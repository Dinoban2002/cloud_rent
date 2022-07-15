const { QuickNavigationPOS, Invoice, InvoiceItems, TaxRate, Client, Administration } = require("../models/Model")(
    ["Invoice", "InvoiceItems", "TaxRate", "QuickNavigationPOS", "Client", "Administration"]
);
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;
const sequelize = require("../config/database");
var handy = require("../config/common");
var lang = require('../language/translate').validationMsg;
/**
 * Routs for POS
 * @param {*} fastify 
 * @param {*} opts 
 */
async function POSRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary This function used to get the pos List of data with filters
     * @input  json filters,
     * @returns Status and List of POS items
     * 
     */
    fastify.post('/pos/list', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            //const client_fields = ["name_full"]; 
            var { limit, offset, where, attributes, order } = await handy.grid_filter(req.body, "Invoice", false, user.company_id);
            where.type = "POS";
            let condition = { limit, offset, where, order }
            if (attributes && attributes.length) {
                attributes = handy.setDateFormat(attributes, ["date"], user.date_format);
                condition.attributes = attributes;
                condition.attributes.push("__invoice_id_pk");
            }
            let client_conditions = {};
            if ((attributes.length && attributes.indexOf("name_full") >= 0) || attributes.length == 0) {
                if (attributes.indexOf("name_full") >= 0)
                    attributes.splice(attributes.indexOf("name_full"), 1)
                client_conditions.attributes = ["name_full"];
                client_conditions.model = Client;
                if (where.name_full) {
                    client_conditions.where = { name_full: where.name_full };
                    delete where.name_full;
                }
                for (orer_key in order) {
                    if (order[orer_key][0] == "name_full") {
                        client_conditions.order = order[orer_key];
                        order.splice(orer_key, 1)
                        break;
                    }
                }
            }
            condition.include = [];
            if (attributes.indexOf("tax_rate") >= 0) {
                condition.include.push({
                    model: TaxRate,
                    attributes: [["percentage", "tax_rate"]]
                });
                attributes.splice(attributes.indexOf("tax_rate"), 1)
            }
            if (Object.keys(client_conditions).length) {
                condition.include.push(client_conditions);
            }
            //remove if have duplicates
            condition.attributes = [...new Set(condition.attributes)];
            if (!condition.attributes.length)
                delete condition.attributes
            Invoice.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk', })
            Invoice.belongsTo(TaxRate, { targetKey: '__tax_rate_id_pk', foreignKey: '_tax_rate_id_fk', })
            const res_data = await Invoice.findAndCountAll(condition);
            let data = await handy.transformnames('LTR', res_data.rows, "Invoice", { client: "Client", tax_rate: "TaxRate" });
            for (item_key in data) {
                data[item_key].items = await InvoiceItems.findAll({ attributes: [["__invoice_item_id_pk", "invoice_item_id"], "item", "qty", "unit_price", "sku", "discount_rate", "taxable"], where: { _invoice_id_fk: data[item_key].invoice_id } })
            }
            const endRow = await handy.get_end_row(offset, limit, res_data.count);
            res.status(200).send({ status: true, count: res_data.count, endRow, data });
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This function used to get the pos by id
     * @input  invoice_id, invoice id
     * @returns Status and POS data
     * 
     */
    fastify.get('/pos/get/:id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.id) {
                const data = await getPos(req.params.id);
                res.status(200).send({ status: true, data });
            } else {
                res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @summary This function will usefull to create quick pos
     * @input quick pos data
     * @returns Status and created quick pos data
     */
    fastify.post('/quickpos/create', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.body && req.body.inventory_id && req.body.sku) {
                data = handy.transformnames('RTL', req.body, "QuickNavigationPOS");
                data._company_id_fk = user.company_id;
                data.created_by = user.user_id;
                data.created_at = new Date();
                const out_data = await QuickNavigationPOS.create(data);
                if (out_data.__quick_navigation_pos_id_pk) {
                    let data = await QuickNavigationPOS.findByPk(out_data.__quick_navigation_pos_id_pk);
                    data = handy.transformnames('LTR', data, "QuickNavigationPOS");
                    res.status(200).send({ status: true, data });
                } else {
                    res.status(500).send({ status: true, message: lang('Validation.record_not_inserted', user.lang) });
                }
            } else {
                res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });
    /**
     * @author Kirankumar
     * @summary This function will usefull to create pos
     * @input pos data
     * @returns Status and created pos data
     */
    fastify.post('/pos/create', async (req, res) => {
        POS(req, res);
    });

    /**
     * @author Kirankumar
     * @summary This function is used to delete the pos
     * @param {pos id} pos_id
     * @requires pos_id
     * @returns status and message
     */
    fastify.delete('/pos/delete/:pos_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.pos_id) {
                const count = await Invoice.count({ where: { __invoice_id_pk: req.params.pos_id, type: "POS" } })
                if (count) {
                    const item_ids = await InvoiceItems.findAll({ attributes: ["_inventory_id_fk"], where: { _invoice_id_fk: req.params.pos_id } })
                    await Invoice.destroy({ where: { __invoice_id_pk: req.params.pos_id } });
                    await InvoiceItems.destroy({ where: { _invoice_id_fk: req.params.pos_id } });
                    for (id of item_ids) {
                        if (id._inventory_id_fk) {
                            await handy.updateStock(id._inventory_id_fk)
                        }
                    }
                    res.status(200).send({ status: true, message: lang('Validation.record_deleted', user.lang) });
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
                }
            } else {
                res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This function is used to delete the pos item
     * @param {pos id} pos_item_id
     * @requires pos_item_id
     * @returns status and message
     */
    fastify.delete('/pos/item/delete/:pos_item_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.pos_item_id) {
                const data = await InvoiceItems.findOne({ attributes: ["_invoice_id_fk", "_inventory_id_fk"], where: { __invoice_item_id_pk: req.params.pos_item_id } })
                if (data) {
                    await InvoiceItems.destroy({ where: { __invoice_item_id_pk: req.params.pos_item_id } });
                    await update_pos_total(data._invoice_id_fk);
                    if (data._inventory_id_fk) {
                        await handy.updateStock(data._inventory_id_fk)
                    }
                    res.status(200).send({ status: true, message: lang('Validation.record_deleted', user.lang) });
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
                }
            } else {
                res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });
    // fastify.post('/pos/calculate', async(req,res)=>{
    //     POS(req,res);
    // });

    /**
     * @author Kirankumar
     * @summary This function is usefull to get the quick pos data
     * @returns Status and List of quick pos data
     */
    fastify.get('/quickpos/get', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await getQuickPOS(user.company_id);
            res.status(200).send({ status: true, data });
        } catch (e) {
            res.status(501).send(e);
        }
    });
    /**
     * @author Kirankumar
     * @summary This function is usefull to get POS email config
     * @returns status and email config
     */
    fastify.get('/pos/email/config/get', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await Administration.findOne({ attributes: ["pos_email_subject", "pos_email_body"], where: { _company_id_fk: user.company_id } })
            res.status(200).send({ status: true, data });
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This rout is used for create or update with transaction and socket connection
     * @returns Status and updated data
     */
    fastify.get('/ws-pos/connect', { websocket: true }, async function wsHandler(connection, req) {
        try {
            let user = await handy.verfiytoken(req, false, connection);
            if (!user) return;
            let transaction = ""
            let socket_room = ""
            const socket_key = req.headers["sec-websocket-key"]
            const room = fastify.subscribe(req, connection, user.username)
            if (!room) {
                connection.socket.send(JSON.stringify({ status: false }))
                connection.end()
            }
            connection.socket.on('message', async function (message) {
                try {
                    const data = JSON.parse(message.toString());
                    socket_room = fastify.getRoom(room);
                    if (data.type == "lock") {
                        if (!socket_room.lock_by) {
                            transaction = await sequelize.transaction();
                            transaction.afterCommit(() => {
                                fastify.unLock(room, socket_key);
                                transaction = "";
                            });
                            await Invoice.findOne({ where: { __invoice_id_pk: data.invoice_id }, transaction, lock: transaction.LOCK.UPDATE });
                            fastify.setLock(room, socket_key);
                            connection.socket.send(JSON.stringify({ status: true, message: "Record locked" }))
                        } else if (socket_room.lock_by == socket_key) {
                            connection.socket.send(JSON.stringify({ status: true, message: "Already Record locked by you" }))
                        } else {
                            connection.socket.send(JSON.stringify({ status: false, message: "Record locked by " + fastify.lockBy(room) }))
                        }
                    } else if (data.type == "update" && socket_room.lock_by == socket_key && data.update_data && Object.keys(data.update_data).length) {
                        const update_data = await ws_POS(data, transaction, user)
                        if (update_data.status) {
                            fastify.sendInRoom(room, JSON.stringify(update_data));
                        } else {
                            connection.socket.send(JSON.stringify(update_data))
                        }
                    } else if (data.type == "rollback" && socket_room.lock_by == socket_key) {
                        await transaction.rollback()
                        transaction = "";
                        fastify.unLock(room, socket_key);
                        //connection.socket.send(JSON.stringify({status:true, message:"Record un locked"}))
                        //connection.end()
                    } else if (data.type == "commit" && socket_room.lock_by == socket_key) {
                        await transaction.commit();
                        //transaction = "";
                        //fastify.unLock(room,socket_key);
                        //connection.socket.send(JSON.stringify({status:true,message:"Record un locked"}))
                        //connection.end()
                    } else if (data.type == "forceUnLock") {
                        if (socket_room.lock_by && socket_room[socket_room.lock_by]) {
                            socket_room[socket_room.lock_by].connection.end();
                            //fastify.sendInRoom(room,JSON.stringify({status:true,message:"Record un locked"}));
                            //connection.socket.send(JSON.stringify({status:true}))
                        } else {
                            connection.socket.send(JSON.stringify({ status: false, message: "Record not locked" }))
                        }
                    } else {
                        connection.socket.send(JSON.stringify({ status: false, message: "Invalid data" }))
                    }
                } catch (e) {
                    connection.socket.send(JSON.stringify({ status: false, message: e.message }))
                    connection.end()
                }
            })
            connection.socket.on('close', async (message) => {
                if (transaction && socket_room.lock_by == socket_key) {
                    await transaction.commit();
                    transaction = "";
                    //fastify.unLock(room,socket_key);
                }
                fastify.unSubscribe(req);
                //connection.socket.send(JSON.stringify({status:true,message:"connection closed"}))
            })
        } catch (e) {
            connection.socket.send(JSON.stringify({ status: false, message: e.message }))
            connection.end()
        }
    });

    /**
     * @author Kirankumar
     * @summary This function will usefull to create pos
     * @param req, HTTP request
     * @param res, HTTP responds
     * @returns created pos data
     */
    async function POS(req, res, type = false) {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            let inv_data_items = [];
            //convert items data
            if (req.body.items && req.body.items.length) {
                inv_data_items = handy.transformnames('RTL', req.body.items, "InvoiceItems");;
                delete req.body.items;
            }
            //convert pos data
            const invoice_data = handy.transformnames('RTL', req.body, "Invoice");
            //if not create the record will create
            if (!invoice_data.__invoice_id_pk) {
                invoice_data.created_by = user.user_id;
                invoice_data._staff_id_fk = user.user_id;
                invoice_data.created_at = new Date();
                invoice_data._company_id_fk = user.company_id;
                invoice_data.type = "POS"
                const invoice_out = await Invoice.create(invoice_data);
                if (invoice_out.__invoice_id_pk) {
                    res.status(200).send({ status: true, data: handy.transformnames('LTR', invoice_out, "Invoice") });
                } else {
                    res.status(500).send({ status: false, message: lang('Validation.record_not_inserted', user.lang) });
                }
            } else {//update the record
                const invoice_id = invoice_data.__invoice_id_pk;
                const count = await Invoice.count({ where: { __invoice_id_pk: invoice_id } });
                if (count) {
                    await Invoice.update(invoice_data, { where: { __invoice_id_pk: invoice_id } });
                    //let total_discount = 0;
                    //let items_total = 0;
                    //let un_taxable_items_total = 0;
                    const items_ids = [];
                    //loop the items for save or update
                    for (inv_item of inv_data_items) {
                        //const {qty,price,discount_rate} = inv_item;
                        inv_item.pos = 1;
                        // const total = parseInt(qty) * parseFloat(price);
                        // total_discount += total * (discount_rate/100)
                        // items_total += total;
                        // inv_item.total             = Number(total - (total * (discount_rate/100))).toFixed(2);
                        // if(inv_item.taxable == 0){
                        //     un_taxable_items_total += total;
                        // }
                        let inv_item_id = 0;
                        if (invoice_id) {
                            inv_item._invoice_id_fk = invoice_id;
                        }
                        if (inv_item.__invoice_item_id_pk) {
                            inv_item_id = inv_item.__invoice_item_id_pk;
                            items_ids.push(inv_item.__invoice_item_id_pk);
                            await InvoiceItems.update(inv_item, { where: { __invoice_item_id_pk: inv_item.__invoice_item_id_pk } });
                        } else {
                            inv_item.created_by = user.user_id;
                            inv_item.created_at = new Date();
                            const invoice_items_data = await InvoiceItems.create(inv_item);
                            if (invoice_items_data.__invoice_item_id_pk) {
                                inv_item_id = inv_item.__invoice_item_id_pk;
                                items_ids.push(invoice_items_data.__invoice_item_id_pk);
                            }
                        }
                        if (inv_item_id) {
                            const inv = await InvoiceItems.findOne({ attributes: ["_inventory_id_fk"], where: { __invoice_item_id_pk: inv_item_id } })
                            if (inv && inv._inventory_id_fk) {
                                await handy.updateStock(inv._inventory_id_fk)
                            }
                        }

                    }
                    // if(items_ids.length){
                    //     await InvoiceItems.destroy({where:{_invoice_id_fk:invoice_id, __invoice_item_id_pk : {[Op.notIn]:items_ids}}})
                    // }else{
                    //     await InvoiceItems.destroy({where:{_invoice_id_fk:invoice_id}});
                    // }
                    //await update_pos_total(invoice_id);
                    const data = await getPos(invoice_id);
                    res.status(200).send({ status: true, data });
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
                }
            }
        } catch (e) {
            res.status(501).send(e);
        }
    }

    /**
     * @author Kirankumar
     * @summary this function is usefull to update total
     * @param invoice_id, invoice id
     * @return nothing
     */
    async function update_pos_total(invoice_id) {
        const invoice_data = await Invoice.findOne({ attributes: ["_tax_rate_id_fk", "delivery_charge"], where: { __invoice_id_pk: invoice_id } });
        let delivery_charge = 0; let items_total = 0; let total_discount = 0; let un_taxable_items_total = 0; let tax_rate_id = 0;
        if (invoice_data) {
            delivery_charge = invoice_data.delivery_charge;
            tax_rate_id = invoice_data._tax_rate_id_fk;
        }
        const items_data = await InvoiceItems.findAll({ attributes: ["qty", "unit_price", "discount_rate"], where: { _invoice_id_fk: invoice_id } });
        for (inv_item of items_data) {
            const qty = inv_item.qty || 0;
            const price = inv_item.unit_price || 0;
            const discount_rate = inv_item.discount_rate || 0;
            const total = parseInt(qty) * parseFloat(price);
            total_discount += total * (discount_rate / 100)
            items_total += total;
            if (inv_item.taxable == 0) {
                un_taxable_items_total += total;
            }
        }
        const sub_total = items_total + delivery_charge - total_discount;
        let tax = 0;
        if (tax_rate_id) {
            const rate_data = await TaxRate.findByPk(tax_rate_id);
            if (rate_data) {
                tax = (sub_total - un_taxable_items_total) * (parseFloat(rate_data.percentage) / 100);
            }
        }
        await Invoice.update({ total: Number(tax + sub_total).toFixed(2) }, { where: { __invoice_id_pk: invoice_id } });
    }

    /**
     * @author Kirankumar
     * @summary Get the quick pos data
     * @param {company id} company_id 
     * @requires company_id
     * @returns List of quick pos data
     */
    async function getQuickPOS(company_id) {
        let data = await QuickNavigationPOS.findAll({ where: { _company_id_fk: company_id } });
        data = handy.transformnames('LTR', data, "QuickNavigationPOS");
        return data || [];
    }
    /**
     * @author Kirankumar
     * @summary Get the pos data
     * @param {invoice id} invoice_id 
     * @requires invoice_id
     * @returns pos data
     */
    async function getPos(invoice_id) {
        Invoice.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk', });
        let data = await Invoice.findOne({
            where: { __invoice_id_pk: invoice_id }, include: {
                model: Client,
                attributes: ["address_billing", "name_full", "email", "telephone"]
            }
        });
        if (data) {
            data = handy.transformnames('LTR', data, "Invoice");
            const items = await InvoiceItems.findAll({ where: { _invoice_id_fk: invoice_id } });
            data.items = handy.transformnames('LTR', items, "InvoiceItems") || [];
            return data;
        } else {
            return {};
        }
    }

    //web-socket
    /**
     * @author Kirankumar
     * @summary This function will usefull to update pos in sockets
     * @param data,input data from socket
     * @param transaction, transaction if created
     * @param user, current user details
     * @returns status and data
     */
    async function ws_POS(req_data, transaction, user) {
        let data = req_data.update_data;
        const count = req_data.invoice_id ? await Invoice.count({ where: { __invoice_id_pk: req_data.invoice_id } }) : 0;
        let status = false;
        if (!count) {
            return { status, data }
        }
        const invoice_id = req_data.invoice_id;
        //updating invoice data if there
        if (data.invoice_data) {
            const invoice_data = handy.transformnames('RTL', data.invoice_data, "Invoice");
            invoice_data.update_by = user.user_id;
            const update_status = await Invoice.update(invoice_data, { where: { __invoice_id_pk: invoice_id }, transaction });
            if (update_status[0]) {
                status = true;
                if (invoice_data && (invoice_data.tax_rate_id || invoice_data.delivery_charge))
                    await update_pos_total(invoice_id);
            }
        } else if (data.invoice_item && Object.keys(data.invoice_item).length) {
            if (data.invoice_item.create && data.invoice_item.create.inventory_id) {
                const create_data = {};
                create_data.pos = 1;
                create_data.total = 0;
                create_data._inventory_id_fk = data.invoice_item.create.inventory_id;
                create_data._invoice_id_fk = invoice_id;
                create_data.created_by = user.user_id;
                create_data.created_at = new Date();
                const invoice_items_data = await InvoiceItems.create(create_data, { transaction });
                if (invoice_items_data.__invoice_item_id_pk) {
                    data.invoice_item.create.invoice_item_id = invoice_items_data.__invoice_item_id_pk;
                    status = true;
                }
            } else if (data.invoice_item.update && Object.keys(data.invoice_item.update).length && data.invoice_item.update.invoice_item_id) {
                const update_data = handy.transformnames('RTL', data.invoice_item.update, "InvoiceItems");
                const item = await InvoiceItems.findByPk(update_data.__invoice_item_id_pk);
                if (item) {
                    // let qty = update_data.qty || item.qty;qty = qty?parseInt(qty):0;
                    // let price = update_data.price || item.price;price = price?parseInt(price):0;
                    // let discount_rate = update_data.discount_rate || item.discount_rate;
                    // discount_rate = discount_rate?parseInt(discount_rate):0;
                    // discount_rate = discount_rate > 1?(discount_rate/100):discount_rate;
                    // const total = qty * price;
                    // update_data.total               = Number(total - (total * discount_rate)).toFixed(2);
                    update_data.update_by = user.user_id;
                    const invoice_items_data = await InvoiceItems.update(update_data, { where: { __invoice_item_id_pk: update_data.__invoice_item_id_pk }, transaction });
                    if (invoice_items_data[0]) {
                        if (update_data && (update_data.qty || update_data.price || update_data.discount_rate))
                            await update_pos_total(invoice_id);
                        status = true
                    }
                }

            } else if (data.invoice_item.delete && Object.keys(data.invoice_item.delete).length) {
                const delete_status = await InvoiceItems.destroy({ where: { __invoice_item_id_pk: data.invoice_item.delete.invoice_item_id }, transaction });
                if (delete_status) {
                    status = true
                    //await update_pos_total(invoice_id);
                }
            }
        }
        req_data.update_data = data;
        return { status, data: req_data }
    }

    /**
     * @deprecated 1.0.0
     * @summary This function is used for Create or update the pos.
     * @param {HTTP request} req 
     * @param {HTTP responds} res 
     * @param {POS type} type 
     * @returns Status and Updated data
     */
    async function POS_old(req, res, type = false) {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            let invoice_id = 0;
            let status = false;
            if (req.body && req.body.client_id) {
                const inv_data = req.body;
                const inv_data_items = req.body.items || [];
                const tax_rate_id = inv_data.tax_rate_id || 0;
                let invoice_data = {};
                let invoice_items = [];
                const delivery_charge = inv_data.delivery_charge || 0;
                invoice_data._client_id_fk = inv_data.client_id;
                invoice_data._tax_rate_id_fk = tax_rate_id;
                invoice_data.payment_method = inv_data.payment_method;
                invoice_data.delivery_method = inv_data.delivery_method || "";
                invoice_data.delivery_notes = inv_data.delivery_notes || "";
                invoice_data.delivery_charge = delivery_charge;
                invoice_data.comments = inv_data.comments || 0;
                invoice_data.created_by = user.user_id;
                invoice_data._staff_id_fk = user.user_id;
                invoice_data.created_at = new Date();
                invoice_data.type = "POS"
                let total_discount = 0;
                let items_total = 0;
                let un_taxable_items_total = 0;
                if (type == "create" && inv_data.payment_method) {
                    const invoice_out = await Invoice.create(invoice_data);
                    if (invoice_out.__invoice_id_pk) {
                        status = true;
                        invoice_id = invoice_out.__invoice_id_pk;
                    }
                } else if (type == "create") {
                    res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
                    return;
                }
                for (inv_item of inv_data_items) {
                    const { qty, price, discount_rate } = inv_item;
                    inv_item.pos = 1;
                    const total = parseInt(qty) * parseFloat(price);
                    total_discount += total * (discount_rate / 100)
                    items_total += total;
                    inv_item.total = Number(total - (total * (discount_rate / 100))).toFixed(2);
                    if (inv_item.taxable == 0) {
                        un_taxable_items_total += total;
                    }
                    if (invoice_id) {
                        inv_item._invoice_id_fk = invoice_id;
                    }
                    invoice_items.push(inv_item);
                }
                const sub_total = items_total + delivery_charge - total_discount;
                let tax = 0;
                if (tax_rate_id) {
                    const rate_data = await TaxRate.findByPk(tax_rate_id);
                    if (rate_data) {
                        tax = (sub_total - un_taxable_items_total) * (parseFloat(rate_data.percentage) / 100);
                    }
                }
                if (invoice_items.length && type == "create") {
                    if (status) {
                        invoice_items = handy.transformnames('RTL', invoice_items, "InvoiceItems");
                        const item_out_data = await InvoiceItems.bulkCreate(invoice_items)
                        if (item_out_data[0] && item_out_data[0].__invoice_item_id_pk) {
                            res.status(200).send({ status: true, message: lang('Validation.record_inserted', user.lang) });
                        } else {
                            res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
                        }
                    } else {
                        res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
                    }
                } else if (type == "create" && status) {
                    res.status(200).send({ status: true, message: lang('Validation.record_inserted', user.lang) });
                } else if (type == "create" && !status) {
                    res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
                } else {
                    inv_data.items = invoice_items;
                    inv_data.calculations = {
                        subtotal: Number(sub_total).toFixed(2),
                        delivery: Number(delivery_charge).toFixed(2),
                        discount: Number(total_discount).toFixed(2),
                        tax: Number(tax).toFixed(2),
                        total: Number(tax + sub_total).toFixed(2)
                    };
                    res.status(200).send({ status: true, data: inv_data });
                }
            } else {
                res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    }
}



module.exports = POSRouter;