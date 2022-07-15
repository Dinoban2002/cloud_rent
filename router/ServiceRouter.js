const { Task, RentalItems, Auth, Invoice, InvoiceItems, Rental, Inventory, Client, Terms } = require("../models/Model")(
    ["Task", "RentalItems", "Invoice", "Rental", "Inventory", "InvoiceItems", "Auth", "Client", "Terms"]
);
var handy = require("../config/common");
const tsc = require("../controllers/TaskServiceController.js");
const { lang } = handy;
let moment = require('moment');


async function ServiceRouter(fastify, opts) {
    /**
     * @summary This rout is used for create or update the service
     * @returns status and updated data
     */
    fastify.post('/service/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_or_update_service(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for create or update the service item
     * @returns Status and updated data
     */
    fastify.post('/service/item/create', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_service_items(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is used for create the service items
     * @param {Service id} service_id
     * @param {Inventory items ids} list of item_ids
     * @param {Logged in user} user 
     * @returns Status and created data
     */
    async function create_service_items(body, user) {
        const data = {};
        if (body && body.item_ids && Object.keys(body.item_ids).length && body.task_id) {
            for (item_id of Object.keys(body.item_ids)) {
                if (body.item_ids[item_id].length) {
                    const req_data = { task_id: body.task_id, item_ids: body.item_ids[item_id] };
                    data[item_id] = await create_items(req_data);
                } else {
                    data[item_id] = [];
                }
            }
            return { status: true, data };
        } else {
            return { status: false, message: lang("Validation.invalid_data", user.lang) };
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used for create the service items
     * @param {Service id} service_id
     * @param {Inventory items ids} list of item_ids
     * @returns Status and created data
     */
    async function create_items(body) {
        let inve_data = await Inventory.findAll({
            attributes: [
                ["price", "unit_price"], "item",
                ["__inventory_id_pk", "_inventory_id_fk"],
            ], where: { __inventory_id_pk: body.item_ids }
        })
        inve_data = await handy.transformnames('RTL', inve_data, "Inventory");
        if (inve_data.length) {
            for (key in inve_data) {
                inve_data[key]._task_id_fk = body.task_id;
                inve_data[key].qty = 1;
            }
            let component_data = await RentalItems.bulkCreate(inve_data);
            component_data = await handy.transformnames('LTR', component_data, "RentalItems");
            return component_data;
        } else {
            return [];
        }
    }

    /**
     * @author Kirankumar
     * @summary This rout is used for create or update the service item
     * @returns Status and updated data
     */
    fastify.post('/service/item/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.body && (req.body.task_id || req.body.rental_item_id)) {
                const data = await handy.create_update_table(req.body, user, RentalItems, "RentalItems", "__rental_item_id_pk");
                if (data.status) {
                    res.status(200).send(data);
                } else {
                    res.status(500).send(data);
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for delete the service item
     * @returns Status and message
     */
    fastify.delete('/service/item/delete/:item_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.item_id) {
                const updated_status = await RentalItems.destroy({ where: { __rental_item_id_pk: req.params.item_id } })
                if (updated_status) {
                    res.status(200).send({ status: true, message: lang("Validation.record_deleted", user.lang) });
                } else {
                    res.status(404).send({ status: false, message: lang("Validation.record_not_exist", user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for delete the service item
     * @returns Status and message
     */
    fastify.delete('/service/resource/delete/:task_resourse_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.task_resourse_id) {
                const data = await tsc.delete_task_resource(req.params.task_resourse_id, user)
                if (data.status) {
                    res.status(200).send(data);
                } else {
                    res.status(500).send(data);
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for delete the service item
     * @returns Status and message
     */
    fastify.delete('/service/vehicle/delete/:task_vehicle_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.task_vehicle_id) {
                const data = await tsc.delete_task_vehicle(req.params.task_vehicle_id, user)
                if (data.status) {
                    res.status(200).send(data);
                } else {
                    res.status(500).send(data);
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for create or update the service item
     * @returns Status and created data
     */
    fastify.post('/service/invoice/create', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await createInvoice(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for create or update the service item
     * @returns status and updated data
     */
    fastify.post('/service/repeat', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await repeat_service(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @summary This rout is used for get the all tasks for company with filters
     * @returns status and Task list
     */
    fastify.post('/service/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            //Here including filters
            let { limit, offset, where, attributes, order } = await handy.grid_filter(req.body, "Task", true, user.company_id);
            const condition = { limit, offset, where, order };
            if (attributes && attributes.length) {
                condition.attributes = attributes;
            }
            const res_data = await Task.findAndCountAll(condition);
            let data = await handy.transformnames('LTR', res_data.rows, "Task", {}, user);
            data = data ? data : [];
            data = await handy.getFormatDate(data, ["date_start", "date_end"], user);
            const endRow = await handy.get_end_row(offset, limit, res_data.count);
            res.status(200).send({ status: true, count: res_data.count, endRow, data });
        } catch (error) {
            res.status(501).send(error);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for get task data for inventory by inventory id
     * @returns status and task data
     */
    fastify.get('/service/get/:service_id', async (req, res) => {
        let user = await handy.verfiytoken(req, res);
        if (!user) return;
        try {
            if (req.params && req.params.service_id) {
                let data = await Task.findOne({ raw: true, where: { __task_id_pk: req.params.service_id, is_deleted: 0 } });
                if (data) {
                    data = await handy.transformnames('LTR', data, "Task", {}, user);
                    data.items = await RentalItems.findAll({ where: { _task_id_fk: data.task_id } });
                    data.items = await handy.transformnames('LTR', data.items, "RentalItems", {}, user);
                    data.resource_list = await tsc.get_task_resource(req.params.service_id, user);
                    data.vehicle_list = await tsc.get_task_vehicle(req.params.service_id, user);
                    res.status(200).send({ status: true, data });
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_found', user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for create or update the service
     * @param {Inpit body} body 
     * @param {Logged in user data} user 
     * @returns status and updated data
     */
    async function create_or_update_service(body, user) {
        if (!body.task_id) {
            body.status = "DUE"
            if (!body.inventory_id && !body.rental_id && !body.is_global) {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
            if (body.rental_id) {
                const rental_data = await Rental.findOne({ attributes: ["_client_id_fk", "date", "date_end"], where: { __rental_id_pk: body.rental_id } })
                if (rental_data) {
                    body.client_id = rental_data._client_id_fk;
                    body.date_end = moment(rental_data.date).format("YYYY-MM-DD");
                    body.start_date = moment(rental_data.date).format("YYYY-MM-DD");
                    body.job_end_date = moment(rental_data.date_end).format("YYYY-MM-DD");
                }
            } else {
                body.date_end = moment().format("YYYY-MM-DD");
                body.date_start = moment().format("YYYY-MM-DD");
            }
            body.time_start = "09:00:00"
            body.summary = "SERVICE";
            body.description = "General service";
            body.type = "SERVICE CALL"
        }
        if (body.client_id) {
            const client = await Client.findOne({ attributes: ["first_name", "last", "address_delivery", "address_billing", "telephone", "account_name"], where: { __client_id_pk: body.client_id } });
            if (client) {
                body.location = client.address_delivery || client.address_billing;
                body.model_no = client.telephone;
                let name = "";
                if (!client.last && client.first_name) {
                    name = client.first_name;
                } else if (client.last && !client.first_name) {
                    name = client.last;
                } else {
                    name = client.first_name + " " + client.last;
                }
                body.customer_contact_details = `${name} \n ${body.location} \n ${body.model_no}`;
                body.client_name = client.account_name;
            }
        }
        const data = await handy.create_update_table(body, user, Task, "Task", "__task_id_pk");
        if (data.status && body.rental_item_id) {
            await RentalItems.update({ "service_status": 2 }, { where: { __rental_item_id_pk: body.rental_item_id } })
        }
        return data;
    }

    /**
     * @author Kirankumar
     * @summary This function is used for create invoice for service
     * @param {Input data} data 
     * @param {logged in data} user 
     * @returns Status and message or created data
     */
    async function createInvoice(data, user) {
        if (data && data.task_id) {
            const { rental_id } = data;
            const inv_count = await Invoice.count({ where: { _task_id_fk: data.task_id } })
            if (inv_count) {
                return { status: true, alert: lang('Validation.service_invoice_exist', user.lang) };
            } else {
                let renta_term_id = 0;
                let task_term_id = 0;
                let term_id = 0;
                let extension = 0;
                let tax_rate_id = 0;
                let credit_card_id = 0;
                let due_date = new Date();
                const task_data = await Task.findOne({ where: { __task_id_pk: data.task_id } })
                if (task_data && task_data._client_id_fk) {
                    task_term_id = task_data._config_term_id_fk;
                    const task_item_Data = await RentalItems.findAll({ where: { _task_id_fk: data.task_id } })
                    if (task_item_Data.length) {
                        const invoice_data = {};
                        invoice_data._task_id_fk = task_data.__task_id_pk;
                        invoice_data._client_id_fk = task_data._client_id_fk;
                        invoice_data._inventory_id_fk = task_data._inventory_id_fk;
                        if (rental_id) {
                            invoice_data._rental_id_fk = rental_id;
                            const rental = await Rental.findOne({ attributes: ["_config_term_id_fk", "_tax_rate_id_fk", ["unstored_count_invoices", "extension"], "_credit_card_rate_id_fk"], where: { __rental_id_pk: rental_id, is_deleted: 0 } }) || 0;
                            if (rental) {
                                tax_rate_id = rental._tax_rate_id_fk;
                                credit_card_id = rental._credit_card_rate_id_fk;
                                renta_term_id = parseInt(rental._config_term_id_fk);
                                extension = parseInt(rental.extension);
                                let invoice_serial_no = await Invoice.max("invoice_serial_no", { where: { _rental_id_fk: rental_id } })
                                if ((extension || 0) != 0 && (extension || 0) <= invoice_serial_no) {
                                    extension = ++invoice_serial_no;
                                }
                            }
                        }
                        invoice_data.tax_rate = 0.1;
                        if (renta_term_id) {
                            term_id = renta_term_id;
                        } else {
                            if (!task_term_id && task_data._client_id_fk)
                                term_id = await Client.sum("_config_term_id_fk", { where: { __client_id_pk: task_data._client_id_fk, is_deleted: 0 } }) || 0;
                        }
                        if (term_id) {
                            let term = await Terms.findOne({ attributes: ["term_label"], where: { __config_term_id_pk: term_id } })
                            if (term) {
                                const term_label = term.term_label ? term.term_label.match(/(\d+)/) : null;
                                if (term_label && term_label.length) {
                                    due_date = new Date(due_date.setDate(due_date.getDate() + parseInt(term_label[0])))
                                }

                            }
                        }
                        invoice_data.summary = task_data.summary;
                        //invoice_data.key_pos = 1;
                        //invoice_data.key__pos = 1;
                        invoice_data.due_date = due_date;
                        invoice_data.type = "SERVICE";
                        invoice_data.date = new Date();
                        invoice_data.selected_company_no = 1;
                        invoice_data.terms = term_id || 0;
                        invoice_data._tax_rate_id_fk = tax_rate_id;
                        invoice_data._credit_card_rate_id_fk = credit_card_id;
                        invoice_data.created_by = user.user_id;
                        invoice_data._staff_id_fk = user.user_id;
                        invoice_data.created_at = new Date();
                        let out_invoice_data = await Invoice.create(invoice_data);
                        if (out_invoice_data.__invoice_id_pk) {
                            if (extension > 0) {
                                await Invoice.update({ invoice_id_no: out_invoice_data.__invoice_id_pk.toString().padStart(6, '0') + "." + extension, invoice_serial_no: extension }, { where: { __invoice_id_pk: out_invoice_data.__invoice_id_pk } })
                            } else {
                                await Invoice.update({ invoice_id_no: out_invoice_data.__invoice_id_pk.toString().padStart(6, '0') }, { where: { __invoice_id_pk: out_invoice_data.__invoice_id_pk } })
                            }
                        }

                        Invoice.belongsTo(Auth, { targetKey: '__staff_id_pk', foreignKey: 'created_by' })
                        if (out_invoice_data.__invoice_id_pk)
                            out_invoice_data = await Invoice.findOne({
                                where: { __invoice_id_pk: out_invoice_data.__invoice_id_pk },
                                include: {
                                    model: Auth,
                                    attributes: ["display_staff_name"]
                                }
                            });
                        out_invoice_data = await handy.transformnames("LTR", out_invoice_data, "Invoice", { staff: "Auth" }, user);
                        if (out_invoice_data.invoice_id) {
                            const inv_items = [];
                            for (item of task_item_Data) {
                                const temp = {
                                    sku: item.sku || "",
                                    item: item.item || "",
                                    qty: item.qty,
                                    _client_id_fk: task_data._client_id_fk,
                                    unit_price: item.unit_price || 0,
                                    _inventory_id_fk: task_data._inventory_id_fk,
                                    _invoice_id_fk: out_invoice_data.invoice_id
                                }
                                inv_items.push(temp);
                            }
                            out_invoice_data.items = await InvoiceItems.bulkCreate(inv_items);
                            await Task.update({ is_invoiced: 1 }, { where: { __task_id_pk: data.task_id } })
                        }
                        const responds = await handy.getInvoice(0, out_invoice_data.invoice_id, 0, user, true);
                        if (responds && responds.length) {
                            out_invoice_data = responds[0];
                        }
                        //out_invoice_data.items = await handy.transformnames("LTR", out_invoice_data.items, "InvoiceItems", {}, user);
                        if (rental_id) {
                            out_invoice_data.rental_calculated_data = await handy.auto_update_or_calculate_rental(rental_id, true, user);
                        } else {
                            out_invoice_data.rental_calculated_data = {};
                        }
                        return { status: true, data: out_invoice_data };
                    } else {
                        return { status: true, alert: lang('Validation.item_not_found_job', user.lang) };
                    }
                } else {
                    return { status: true, alert: lang('Validation.add_client_before_invoice', user.lang) };
                }
            }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }
    /**
     * @author Kirankumar
     * @summary This function is used for create service for assets
     * @param {service data} rep_in_data 
     * @param {inventory id} inventory_id 
     * @param {Logged in user} user 
     * @param {Status of service(DUE or PENDDING)} status 
     * @param {Date of service} date 
     * @returns updated data
     */
    async function createService(rep_in_data, user, status, date, is_repeated = false) {
        let is_invoice = false;
        if (rep_in_data.is_invoice) {
            is_invoice = true;
            delete rep_in_data.is_invoice;
        }
        let invoice_data = {};
        let invoice_items = [];
        let task_items = [];
        if (rep_in_data.task_items && rep_in_data.task_items) {
            task_items = rep_in_data.task_items;
        }
        let in_data = await handy.transformnames('RTL', rep_in_data, "Task", {}, user);
        //in_data._inventory_id_fk = inventory_id;
        const inventory_id = in_data._inventory_id_fk || 0;
        in_data.status = in_data.status || status;
        in_data.date_start = new Date(date);
        if (is_repeated)
            in_data.is_repeated = 1;
        let task_data = await Task.create(in_data);
        if (task_data.__task_id_pk) {
            task_data = await handy.transformnames('LTR', task_data, "Task", {}, user);
            if (task_items.length) {
                let ins_items = [];
                for (const key in task_items) {
                    if (task_items[key].qty) {
                        if (is_invoice) {
                            const inv_item_data = {
                                sku: task_items[key].sku || "",
                                item: task_items[key].item || "",
                                qty: task_items[key].qty,
                                _client_id_fk: task_data.client_id,
                                unit_price: task_items[key].unit_price || 0,
                                _inventory_id_fk: inventory_id,
                            };
                            invoice_items.push(inv_item_data);
                        }
                        task_items[key]._task_id_fk = task_data.task_id;
                        task_items[key]._client_id_fk = task_data.client_id;
                        task_items[key]._inventory_id_fk = inventory_id;
                        task_items[key].amount = (parseInt(task_items[key].qty) || 0) * (parseFloat(task_items[key].unit_price) || 0);
                        ins_items.push(task_items[key]);
                    }
                }

                if (ins_items.length) {
                    ins_items = await handy.transformnames('RTL', ins_items, "RentalItems", {}, user);
                    let out_data = await RentalItems.bulkCreate(ins_items);
                    task_data.task_items = await handy.transformnames('LTR', out_data, "RentalItems", {}, user);
                }
            }
            if (is_invoice && invoice_items.length) {
                invoice_data._task_id_fk = task_data.task_id;
                invoice_data._client_id_fk = in_data._client_id_fk;
                invoice_data._inventory_id_fk = inventory_id;
                invoice_data.tax_rate = 0.1;
                invoice_data.summary = in_data.summary;
                invoice_data.key_pos = 1;
                invoice_data.key__pos = 1;
                invoice_data.due_date = date;
                invoice_data.type = "POS";
                invoice_data.selected_company_no = 1;
                //invoice_data._tax_rate_id_fk = tax_rate_id;
                invoice_data.created_by = user.user_id;
                invoice_data._staff_id_fk = user.user_id;
                invoice_data.created_at = new Date();
                const out_invoice_data = await Invoice.create(invoice_data);
                if (out_invoice_data.__invoice_id_pk) {
                    for (inv_key in invoice_items) {
                        invoice_items[inv_key]._invoice_id_fk = out_invoice_data.__invoice_id_pk;
                    }
                    await InvoiceItems.bulkCreate(invoice_items);
                }
            }
            return task_data
        } else {
            return false;
        }
    }
    /**
     * @author Kirankumar
     * @summary This function is used for repeat and update the task
     * @param {HTTP input data} rep_in_data 
     * @param {Logged in user details} user 
     * @returns status and updated data
     */
    async function repeat_service(rep_in_data, user) {
        //not used any ware
        /*let test ={
            daily:{
            repeat_every:2,     //(every 2 days)
            stop_after:10,      //(10 repeatetions)
            //or
            stop_on:2021-09-25  //(end date)
            },
            weekly:{
            repeat_every:2,                                 //(every 2 weeks)
            week_days:["sun","mon","tu","we","tu","fri","sa"],   //week days for repeate
            stop_after:10,      //(10 repeatetions)
            //or
            stop_on:2021-09-25  //(end date)
            },
            monthly:{
            repeat_every:2,                                 //(every 2 months)
            dates:[1,2,3],                               //(month days)
            //or
            month_weeks:["1st","2nd","3rd","4th","la"],      //(Month weeks)
            stop_after:10,      //(10 repeatetions)
            //or
            stop_on:2021-09-25  //(end date)
            },
            yearly:{
            repeat_every:2,                                 //(every 2 years)
            months:["jan","feb"] ,                       //(months of year)
            stop_after:10,      //(10 repeatetions)
            //or
            stop_on:2021-09-25  //(end date)"PENDING"
            }
        }*/

        const task_id = (rep_in_data && rep_in_data.task_id) ? rep_in_data.task_id : 0;
        if (!task_id) {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
        delete rep_in_data.task_id;
        //get task data for repeat
        let task_data = await Task.findOne({ raw: true, attributes: { exclude: ["__task_id_pk", "date_start", "date_end", "date_done", "is_deleted", "created_by", "updated_by", "created_at", "updated_at"] }, where: { __task_id_pk: task_id } });
        task_data = await handy.transformnames("LTR", task_data, "Task", {}, user);
        //const inventory_id = task_data.inventory_id;
        task_data.task_items = await RentalItems.findAll({ attributes: ["sku", "item", "qty", "unit_price"], where: { _task_id_fk: task_id } })
        task_data.task_items = await handy.transformnames("LTR", task_data.task_items, "RentalItems", {}, user);
        const inv_count = await Invoice.count({ where: { _task_id_fk: task_id } });
        if (inv_count) {
            task_data.is_invoice = true;
        }

        let date = new Date();
        let count = 0;
        const all_out_data = [];
        const con_months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const con_weeks = ["sun", "mon", "tus", "wed", "thu", "fri", "sat"];
        const con_week_pos = ["1st", "2nd", "3rd", "4th", "la"]
        let repeat = true;
        let week_set = true;
        const repeat_options = rep_in_data;
        rep_in_data = task_data;
        while (repeat) {
            if (repeat_options && repeat_options.daily && Object.keys(repeat_options.daily).length) {
                const { repeat_every, stop_after, stop_on } = repeat_options.daily;
                //increase days with given value
                date.setDate(date.getDate() + parseInt(repeat_every || 1));
                //check the repeat and date values with expected values
                if (!((stop_after && count < stop_after) || (stop_on && date < new Date(stop_on)))) {
                    repeat = false;
                } else {
                    count++;
                    all_out_data.push(await createService(rep_in_data, user, "PENDING", date, true));
                }
            } else if (repeat_options && repeat_options.weekly && Object.keys(repeat_options.weekly).length) {
                const { repeat_every, stop_after, stop_on, week_days } = repeat_options.weekly;
                if (week_days && week_days.length) {
                    //intial to set the week day to sunday
                    if (week_set) {
                        const day_no = date.getDay();
                        if (day_no != 0) {
                            date.setDate(date.getDate() - day_no);
                        }
                        week_set = false;
                    }
                    //loop the week days from input
                    for (week_day of week_days) {
                        const clone_date = new Date(date);
                        if (con_weeks.indexOf(week_day) >= 0) {
                            clone_date.setDate(clone_date.getDate() + con_weeks.indexOf(week_day));//set the week days to date obj
                            if (!((stop_after && count < stop_after) || (stop_on && clone_date < new Date(stop_on)))) {
                                repeat = false;
                            } else {
                                if (clone_date > new Date()) {//check the date should be grater than current date 
                                    count++;
                                    all_out_data.push(await createService(rep_in_data, user, "PENDING", clone_date, true));
                                }
                            }
                        } else {
                            repeat = false;
                            break;
                        }
                    }
                    date.setDate(date.getDate() + (7 * repeat_every));
                } else {
                    repeat = false;
                }

                //Montly repeat functionality
            } else if (repeat_options && repeat_options.monthly && Object.keys(repeat_options.monthly).length) {
                const { repeat_every, stop_after, stop_on, months_dates, month_week_day } = repeat_options.monthly;
                if (months_dates && months_dates.length) {
                    for (month_date of months_dates) {
                        if (month_date <= new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()) {
                            date.setDate(month_date);
                            if (!((stop_after && count < stop_after) || (stop_on && date < new Date(stop_on)))) {
                                repeat = false;
                            } else {
                                if (date > new Date()) {
                                    count++;
                                    all_out_data.push(await createService(rep_in_data, user, "PENDING", date, true));
                                }
                            }
                        }
                    }
                } else if (month_week_day && month_week_day.pos && month_week_day.pos) {
                    if (con_week_pos.indexOf(month_week_day.pos) >= 0 && con_weeks.indexOf(month_week_day.day) >= 0) {
                        if (con_week_pos.indexOf(month_week_day.pos) < 4) {
                            date = weekDay(date.getFullYear(), date.getMonth(), con_weeks.indexOf(month_week_day.day), con_week_pos.indexOf(month_week_day.pos));
                        } else {
                            date = lastWeek(date.getFullYear(), date.getMonth(), con_weeks.indexOf(month_week_day.day));
                        }
                        if (!((stop_after && count < stop_after) || (stop_on && date < new Date(stop_on)))) {
                            repeat = false;
                        } else {
                            if (date > new Date()) {
                                count++;
                                all_out_data.push(await createService(rep_in_data, user, "PENDING", date, true));
                            }
                        }
                    } else {
                        repeat = false;
                    }
                } else {
                    repeat = false;
                }
                date.setMonth(date.getMonth() + parseInt(repeat_every || 1))//set every repeat month
                //Yearly repeat functionality
            } else if (repeat_options && repeat_options.yearly && Object.keys(repeat_options.yearly).length) {
                const { repeat_every, stop_after, stop_on, months } = repeat_options.yearly;
                if (months.length) {
                    for (month of months) {
                        if (con_months.indexOf(month) >= 0) {
                            date.setMonth(con_months.indexOf(month));
                            if (!((stop_after && count < stop_after) || (stop_on && date < new Date(stop_on)))) {
                                repeat = false;
                            } else {
                                if (date > new Date()) {
                                    count++;
                                    all_out_data.push(await createService(rep_in_data, user, "PENDING", date, true));
                                }
                            }
                        }
                    }
                    date.setFullYear(date.getFullYear() + parseInt(repeat_every || 1))//set every repeat year
                } else {
                    repeat = false;
                }
            } else {
                repeat = false;
            }
            //count++;
        }
        if (all_out_data.length)
            await Task.update({ is_repeated: 1 }, { where: { __task_id_pk: task_id } });
        return { status: true, data: all_out_data };
    }
    /**
     * @author Kirankumar
     * @summary This function is used for change the week day in date object
     * @param {Year} year 
     * @param {Month} month 
     * @param {Week} week 
     * @param {Week position in month} pos 
     * @returns changed date 
     */
    function weekDay(year, month, week, pos) {
        var date = new Date(year, month);
        date.setDate(1);
        let weekday = date.getDay();
        if (weekday < week) {
            dayDiff = week - weekday;
        } else if (weekday > week) {
            dayDiff = 7 + week - weekday;
        } else {
            dayDiff = 0;
        }
        dayDiff += (pos * 7);
        date.setDate(date.getDate() + dayDiff);
        return date;
    }
    /**
     * @author Kirankumar
     * @summary This function is used for set the last day in week
     * @param {Year} year 
     * @param {Month} month 
     * @param {Week day} week 
     * @returns changed date
     */
    function lastWeek(year, month, week) {
        var date = new Date(year, month, 0);
        let weekday = date.getDay();
        if (weekday < week) {
            dayDiff = 7 - week;
        } else if (weekday > week) {
            dayDiff = weekday - week;
        } else {
            dayDiff = 0;
        }
        date.setDate(date.getDate() - dayDiff);
        return date;
    }
}

module.exports = ServiceRouter;