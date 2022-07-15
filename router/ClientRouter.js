const { Client, Site, Address, Communication, RentalItems, ClientPaymentMethod, ClientNotes, ClientContact, Auth, Messaging, Rental, ConfigRentalStatus } = require("../models/Model")(["Client", "Address", "RentalItems", "Communication", "ClientPaymentMethod", "ClientNotes", "ClientContact", "Auth", "Messaging", "Rental", "ConfigRentalStatus", "Site"]);
var handy = require("../config/common");
var translate = require('../language/translate').validationMsg;
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;
var md5 = require('md5');

async function ClientRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary This rout is usefull to get client dashboard data
     * @returns count data of client
     */
    fastify.get('/customer/dashboard', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const account_group_data = await Client.findAll({
                group: ['account_type'],
                where: {
                    is_deleted: 0,
                    _company_id_fk: user.company_id
                },
                attributes: ['account_type', [Sequelize.fn('COUNT', '__client_id_pk'), 'count']],
                order: [[Sequelize.literal('count'), 'DESC']],
                raw: true
            })
            const active = await Client.count({ where: { is_deleted: 0, is_active: 1, _company_id_fk: user.company_id } })
            const inActive = await Client.count({ where: { is_deleted: 0, is_active: 0, _company_id_fk: user.company_id } })
            const data = {
                Total: active + inActive,
                Active: active,
                InActive: inActive
            };
            for (type of account_group_data) {
                if (type.account_type) {
                    data[type.account_type] = parseFloat(Number((type.count / data.Total) * 100).toFixed(2))
                } else {
                    data["Others"] = parseFloat(Number((type.count / data.Total) * 100).toFixed(2))
                }
            }
            res.status(200).send({ status: true, data });
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is usefull to get client data with filters
     * @param Json input filters data
     * @returns List of client data
     */
    fastify.post('/customer/get', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            let address_order = [];
            let address_req = [];
            let address_where = {};
            const address_fields = ["country", "state", "zip", "is_billing", "is_delivery"];
            let { start, limit, offset, where, attributes, order } = await handy.grid_filter(req.body, "Client", true, user.company_id);
            for (o_key in order) {
                if (address_fields.indexOf(order[o_key][0]) >= 0)
                    order[o_key] = [Address].concat(order[o_key]);
            }
            if (where) {
                where.parent_id = 0;
            } else {
                where = { parent_id: 0 };
            }

            //var condition = { limit, offset, where, order }
            if (attributes && attributes.length) {
                attributes = [...new Set(attributes)];
                let req_data = Array.from(attributes);
                for (key in req_data) {
                    if (address_fields.indexOf(req_data[key]) >= 0) {
                        address_req.push(req_data[key]);
                        if (where[req_data[key]]) {
                            address_where[req_data[key]] = where[req_data[key]]
                            delete where[req_data[key]];
                        }
                        if (attributes.indexOf(req_data[key]) >= 0)
                            attributes.splice(attributes.indexOf(req_data[key]), 1);
                    }
                }
                //condition.attributes = attributes;
            }
            Client.belongsTo(Address, { targetKey: '_client_id_fk', foreignKey: '__client_id_pk', })
            let sub_conditions = [];
            //place address conditions for filters
            if (address_req.length) {
                let address_condition = {
                    model: Address, // will create a left join
                }
                if (Object.keys(address_where).length > 0) {
                    address_where.is_billing = 1;
                    address_condition.where = address_where;
                } else {
                    address_condition.where = { is_billing: 1 };
                }

                address_condition.attributes = address_req;
                if (address_order.length)
                    address_condition.order = address_order;
                sub_conditions.push(address_condition);

            }
            let condition = {
                limit, offset, where, attributes, order,
                include: sub_conditions
            }
            if (!attributes.length) {
                delete condition.attributes;
            }
            var res_data = await Client.findAndCountAll(condition);
            let data = await handy.transformnames('LTR', res_data.rows, "Client", { address: "Address" }, user);
            data = data ? data : [];
            const endRow = await handy.get_end_row(offset, limit, res_data.count);
            res.status(200).send({ status: true, count: res_data.count, endRow, data });
        } catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for create the client record
     * @input client data
     * @returns client data
     */
    fastify.post('/customer/create', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            var res_data = await insert_update_customer(res, req.body, user, req.params.customer_id);
            res.status(200).send(res_data)
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })
    /**
     * @author Kirankumar
     * @summary This functon used to get the client full details by ID
     * @param customer_id, client_id
     * @requires customer_id
     * @returns Client data
     */
    fastify.get('/customer/get/:customer_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            var res_get_data = await get_customer_data(res, req.params.customer_id, user);
            res.status(200).send(res_get_data)
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout used to create all pdfs in app
     * @returns status and alert or pdf reference
     */
    fastify.post('/pdf/create', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await handy.get_pdf(req.body, user);
            if (data.status) {
                res.status(200).send(data)
            } else {
                res.status(500).send(data)
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })

    /**
     * @author Kirankumar
     * @summary This functon used to get the client sub contact list
     * @param customer_id, client_id
     * @requires customer_id
     * @returns Status and client sub cntact list
     */
    fastify.get('/customer/subcontact/get/:customer_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const res_get_data = await get_customer_subcontact_data(req.params.customer_id, user);
            res.status(200).send(res_get_data)
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })

    /**
     * @author Kirankumar
     * @summary This functon used to get the client venue list
     * @returns Client list data
     */
    fastify.get('/customer/venue/list', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await Client.findAll({ attributes: [["__client_id_pk", "client_id"], "account_name", "address_delivery", "address_billing"], where: { is_deleted: 0, account_type: "Venue", _company_id_fk: user.company_id } })
            res.status(200).send({ status: true, data })
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for update the client record
     * @input client data
     * @param customer_id, client_id
     * @requires customer_id
     * @returns client data
     */
    fastify.post('/customer/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            // var res_data = await insert_update_customer(res, req.body, user, req.params.customer_id);
            // res.status(200).send(res_data)
            const requestBody = req.body;
            if (requestBody.client_id && (requestBody.first_name || requestBody.last)) {
                const clientData = await Client.findOne({ attributes: ["first_name", "last"], where: { "__client_id_pk": requestBody.client_id } }) || {};
                requestBody.first_name = requestBody.first_name ? requestBody.first_name : clientData.first_name;
                requestBody.last = requestBody.last ? requestBody.last : clientData.last;
                requestBody.name_full = "";
            }
            const data = await handy.create_update_table(req.body, user, Client, "Client", "__client_id_pk");
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })

    /** 
     * @ignore 1.0.0
     * @author Kirankumar
     * @summary This rout is used for update the communication table and client table email and telephone fields
     * @returns Status and updated data
     */
    fastify.post('/customer/communication/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const requestBody = req.body;
            if (!req.body || !req.body.client_id) {
                res.status(500).send({ status: false, message: res.status(500).send({ status: false, message: translate('Validation.invalid_client', user.lang) }) });
                return;
            }
            const update = await handy.create_update_table(req.body, user, Communication, "Communication", "__comm_id_pk");
            if (update.data) {
                let saveField = {};
                if (update.data.is_int) {
                    saveField = { "email": update.data.data };
                }
                else if (update.data.is_tel) {
                    saveField = { "telephone": update.data.data };
                }
                if (Object.keys(saveField).length > 0) {
                    await Client.update(saveField, { where: { "__client_id_pk": requestBody._client_id_fk } })
                }
            }
            if (update.status) {
                res.status(200).send(update);
            } else {
                res.status(500).send(update);
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })

    /** 
     * @author Kirankumar
     * @summary  This rout is used for update the address table and client table address fields
     * @returns Status and updated address data
     */

    fastify.post('/customer/address/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (!req.body.client_id) {
                res.status(500).send({ status: false, message: res.status(500).send({ status: false, message: translate('Validation.invalid_client', user.lang) }) });
                return;
            }
            const update = await handy.create_update_table(req.body, user, Address, "Address", "__address_id_pk");
            const requestBody = req.body;
            if (update.data) {
                let saveField = {};
                let combineObj = requestBody;
                if (update.data.address_id) {
                    const clientData = await Address.findOne({ attributes: ["address1", "city", "state", "country", "zip"], where: { "__address_id_pk": update.data.address_id } }) || {};
                    combineObj.address1 = combineObj.address1 ? combineObj.address1 : clientData.address1;
                    combineObj.city = combineObj.city ? combineObj.city : clientData.city;
                    combineObj.state = combineObj.state ? combineObj.state : clientData.state;
                    combineObj.zip = combineObj.zip ? combineObj.zip : clientData.zip;
                    combineObj.country = combineObj.country ? combineObj.country : clientData.country;
                }

                var combine_address = await handy.format_address(combineObj, user.company_id);
                if (requestBody.is_billing) {
                    saveField = { "address_billing": combine_address, "billing_add_id": update.data.address_id };
                    if (update && update.data)
                        update.data.address_billing = combine_address;
                }
                else if (requestBody.is_delivery) {
                    saveField = { "address_delivery": combine_address, "delivery_add_id": update.data.address_id }
                    if (update && update.data)
                        update.data.address_delivery = combine_address;

                    const update_status = await Rental.update({ address_full: combine_address, _address_id_fk: update.data.address_id }, {
                        where: {
                            _client_id_fk: update.data.client_id,
                            //_address_id_fk: 0,
                            _company_id_fk: user.company_id
                        }
                    });
                    console.log(update_status);
                }
                if (Object.keys(saveField).length > 0) {
                    await Client.update(saveField, { where: { "__client_id_pk": requestBody._client_id_fk } })
                }
            }
            if (update.status) {
                res.status(200).send(update);
            } else {
                res.status(500).send(update);
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })

    /** 
     * @author Kirankumar
     * @summary  This rout is used for create or update the site data for client
     * @param {Site data} HTTP input body
     * @returns Status and updated site data
     */

    fastify.post('/customer/site/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (!(req.body.client_id || req.body.site_id)) {
                res.status(500).send({ status: false, message: translate('Validation.invalid_data', user.lang) });
                return;
            }
            const update = await handy.create_update_table(req.body, user, Site, "Site", "__site_id_pk");
            if (update.status) {
                const site_data = await Site.findOne({
                    raw: true, attributes: [["address", "address1"],
                    ["suburb", "city"], "state", ["post_code", "zip"]], where: { "__site_id_pk": update.data.site_id }
                }) || {};
                site_data.country = site_data.country || "";
                const billing_address = await handy.format_address(site_data, user.company_id);
                update.data.billing_address = billing_address;
                handy.create_update_table({ site_id: update.data.site_id, billing_address }, user, Site, "Site", "__site_id_pk");
                res.status(200).send(update);
            } else {
                res.status(500).send(update);
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })

    /** 
     * @author Kirankumar
     * @summary  This rout is used for get site list for client
     * @package {client id} client_id
     * @returns Status and list of site data
     */

    fastify.get('/customer/site/get/:client_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.client_id) {
                let data = await Site.findAll({ where: { _client_id_fk: req.params.client_id, is_deleted: 0 } })
                data = await handy.transformnames('LTR', data, "Site", {}, user);
                res.status(200).send({ status: true, data })
            } else {
                res.status(500).send({ status: false, message: translate('Validation.invalid_data', user.lang) })
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })

    /** 
     * @author Kirankumar
     * @summary  This rout is used for get site by id
     * @package {site id} site_id
     * @returns Status and site data
     */

    fastify.get('/site/get/:site_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.site_id) {
                let data = await Site.findOne({ where: { __site_id_pk: req.params.site_id, is_deleted: 0 } })
                data = await handy.transformnames('LTR', data, "Site", {}, user);
                if (data) {
                    res.status(200).send({ status: true, data })
                } else {
                    res.status(404).send({ status: false, message: translate('Validation.record_not_exist', user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: translate('Validation.invalid_data', user.lang) })
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message })
        }
    })

    /** 
     * @author Kirankumar
     * @summary  This rout is used for delete site by id
     * @package {site id} site_id
     * @returns Status and site data
     */

    fastify.delete('/site/delete/:site_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.site_id) {
                let data = await Site.update({ is_deleted: 1 }, { where: { __site_id_pk: req.params.site_id, is_deleted: 0 } })
                if (data && data[0]) {
                    res.status(200).send({ status: true, message: translate('Validation.record_deleted', user.lang) })
                } else {
                    res.status(404).send({ status: false, message: translate('Validation.record_not_exist', user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: translate('Validation.invalid_data', user.lang) })
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message })
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used to create or update the payment method
     * @returns Status and updated payment method data
     */
    fastify.post('/customer/paymentmethod/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (!req.body.client_id) {
                res.status(500).send({ status: false, message: res.status(500).send({ status: false, message: translate('Validation.invalid_client', user.lang) }) });
                return;
            }
            if (req.body.secret) {
                req.body.secret = md5(req.body.secret);
            }
            const update = await handy.create_update_table(req.body, user, ClientPaymentMethod, "ClientPaymentMethod", "__payment_method_id_pk");
            if (update.status) {
                res.status(200).send(update);
            } else {
                res.status(500).send(update);
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message })
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is used for delete the client record
     * @param customer_id, client_id
     * @requires customer_id
     * @returns status and message
     */
    fastify.delete('/customer/delete/:customer_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params.customer_id) {
                var delete_check = await handy.check_item_exist("Client", "__client_id_pk", req.params.customer_id);
                if (delete_check) {
                    var delete_query = await Client.count({ where: { __client_id_pk: req.params.customer_id, _company_id_fk: user.company_id, [Op.or]: [{ is_deleted: 0 }, { is_deleted: 'NULL' }] } });
                    if (delete_query) {
                        var delete_update_query = await Client.update({ updated_by: user.company_id, is_deleted: 1, deleted_date_time: new Date() }, { where: { __client_id_pk: req.params.customer_id } })
                        res.status(200).send({ status: false, message: translate('Validation.record_deleted', user.lang) })
                    }
                    else {
                        res.status(404).send({ status: false, message: translate('Validation.record_not_exist', user.lang) })
                    }
                }
                else {
                    res.status(500).send({ status: false, message: translate('Validation.invalid_client', user.lang) })
                }
            }
            else {
                res.status(404).send({ status: false, message: translate('Validation.invalid_data', user.lang) })
            }
        } catch (e) {
            res.status(500).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for create the Notes for client record
     * @input Notes data
     * @returns Status and List of notes data
     */
    fastify.post('/customer/notes/create', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.body.customer_id && req.body.notes) {
                var body_notes = { notes: req.body.notes, created_by: user.company_id, created_at: new Date(), _client_id_fk: req.body.customer_id };
                var insert_notes = await ClientNotes.create(body_notes);
                var get_notes_staff = await Auth.findAll({ raw: true, attributes: ["display_staff_name"], where: { __staff_id_pk: user.company_id, is_deleted: 0 } })
                get_all_notes = [];
                if (insert_notes) {
                    get_all_notes = await ClientNotes.findAll({ raw: true, order: [['__client_notes_id_pk', 'DESC']], attributes: ["__client_notes_id_pk", "notes", "created_at"], where: { _client_id_fk: req.body.customer_id } })
                    get_all_notes = await handy.transformnames('LTR', get_all_notes, "ClientNotes", {}, user);
                    for (var gtn = 0; gtn < get_all_notes.length; gtn++) {
                        get_all_notes[gtn].created_by = get_notes_staff[0].display_staff_name;
                    }
                }
                res.status(200).send({ status: true, data: get_all_notes })
            }
            else {
                res.status(500).send({ status: false, message: translate('Validation.invalid_data', user.lang) })
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message });
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is used for delete the Notes for client record
     * @returns Status and message
     */
    fastify.delete('/customer/notes/delete/:notes_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.notes_id) {
                const count = await ClientNotes.destroy({ where: { __client_notes_id_pk: req.params.notes_id } });
                if (count)
                    res.status(200).send({ status: true, message: translate('Validation.record_deleted', user.lang) })
                else
                    res.status(404).send({ status: true, message: translate('Validation.record_not_exist', user.lang) })
            }
            else {
                res.status(500).send({ status: false, message: translate('Validation.invalid_data', user.lang) })
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for create the sub contact for client record
     * @input Sub contact data
     * @returns Status and Sub contact data
     */
    fastify.post('/customer/subcontact/update', async (req, res) => {
        try {
            const user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_sub_contact(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for create or update the sub contact
     * @param {Sub contact data} data 
     * @param {Logged in user details} user 
     * @returns status and created sub contact data
     */
    async function create_sub_contact(subCont_request, user) {
        if (subCont_request) {
            subCont_request._company_id_fk = user.company_id;
            if (subCont_request.client_id) {
                subCont_request.parent_id = subCont_request.client_id;
                subCont_request.last = subCont_request.last_name;
                subCont_request.notes = subCont_request.notes;
                subCont_request.created_by = user.company_id;
                subCont_request.created_at = new Date();
                subCont_request.name_full = subCont_request.first_name + (subCont_request.first_name && subCont_request.last_name ? " " : "") + subCont_request.last_name;
                let sub_client_saved = {};
                if (subCont_request.contact_id) {
                    const contact_id = subCont_request.contact_id;
                    delete subCont_request.contact_id;
                    const update_status = await Client.update(subCont_request, { where: { __client_id_pk: contact_id } });
                    sub_client_saved = subCont_request;
                    sub_client_saved.__client_id_pk = contact_id;

                } else {
                    sub_client_saved = await Client.create(subCont_request);
                }

                if (sub_client_saved) {
                    const sub_client_id = sub_client_saved.__client_id_pk;
                    // if (subCont_request.notes) {
                    //     var temp_notes = {}
                    //     temp_notes._client_id_fk = sub_client_id;
                    //     temp_notes.created_by = user.company_id;
                    //     temp_notes.created_at = new Date();
                    //     temp_notes.notes = subCont_request.notes;
                    //     var sub_notes_save = await ClientNotes.create(temp_notes);
                    // }

                    if (subCont_request.address1) {
                        var temp_address = {};
                        temp_address._client_id_fk = sub_client_id;
                        temp_address.created_by = user.company_id;
                        temp_address.created_at = new Date();
                        temp_address.address1 = subCont_request.address1;
                        temp_address.city = subCont_request.city;
                        temp_address.state = subCont_request.state;
                        temp_address.country = subCont_request.country;
                        temp_address.zip = subCont_request.zip;
                        temp_address.is_default = 1;
                        if (subCont_request.address_id) {
                            await Address.update(temp_address, { where: { __address_id_pk: subCont_request.address_id } });
                        } else {
                            await Address.create(temp_address);
                        }

                    }

                    // if (subCont_request.email) {
                    //     var temp_email = { _client_id_fk: sub_client_id, created_by: user.company_id, created_at: new Date(), data: subCont_request.email, is_default: 1, is_int: 1 }
                    //     var sub_email_save = await Communication.create(temp_email);
                    // }

                    // if (subCont_request.mobile) {
                    //     var temp_mobile = { _client_id_fk: sub_client_id, created_by: user.company_id, created_at: new Date(), data: subCont_request.mobile, is_default: 1, is_tel: 1 }
                    //     var sub_mobile_save = await Communication.create(temp_mobile);
                    // }
                    let clientsub_get = await Client.findOne({ raw: true, attributes: [['__client_id_pk', 'contact_id'], 'first_name', ['last', 'last_name'], "name_full", 'parent_id', 'position', "email", "telephone", "notes", "is_active"], where: { is_deleted: 0, _company_id_fk: user.company_id, __client_id_pk: sub_client_id } }) || {};
                    if (clientsub_get) {
                        const get_address = await Address.findOne({ raw: true, attributes: [["__address_id_pk", "address_id"], "address1", "city", "state", "zip", "country"], where: { _client_id_fk: sub_client_id } })
                        if (get_address) {
                            clientsub_get = { ...clientsub_get, ...get_address };
                            clientsub_get.address_full = await handy.format_address(get_address, user.company_id);
                        }
                        // var communication_records = await Communication.findAll({ raw: true, attributes: ["data", "is_int", "is_tel"], where: { _client_id_fk: sub_client_id } });
                        // if (communication_records) {
                        //     for (var sub_cm = 0; sub_cm < communication_records.length; sub_cm++) {
                        //         if (communication_records[sub_cm].is_int == 1) {
                        //             clientsub_get[0].email = communication_records[sub_cm].data;
                        //         }
                        //         else if (communication_records[sub_cm].is_tel == 1) {
                        //             clientsub_get[0].mobile = communication_records[sub_cm].data;
                        //         }
                        //     }
                        // }
                        // var get_sub_notes = await ClientNotes.findAll({ raw: true, attributes: ["notes"], where: { _client_id_fk: sub_client_id } })
                        // if (get_sub_notes.length > 0) {
                        //     clientsub_get[0].notes = get_sub_notes[0].notes;
                        // }
                    }
                    return { status: true, data: clientsub_get };
                }
                else {
                    return { status: false, message: translate('Validation.record_not_inserted', user.lang) };
                }
            }
            else {
                return { status: false, message: translate('Validation.invalid_data', user.lang) };
            }
        }
        else {
            return { status: false, message: translate('Validation.invalid_data', user.lang) };
        }
    }
    /**
     * @author Kirankumar
     * @summary This function is used for set the status of sub contact
     * @requires customer_id
     * @param customer_id, sub contact id
     * @returns status and message
     */
    fastify.put('/customer/subcontact/status/:customer_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await update_sub_contact_status(req.body, req.params, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for update subcontact status
     * @param {HTTP request body} body 
     * @param {Contact id} customer_id 
     * @param {Logged in user data} user 
     * @returns Status and message
     */
    async function update_sub_contact_status(body, params, user) {
        if (params.customer_id && (body.is_active || body.is_active == 0)) {
            var item_check = await handy.check_item_exist("Client", "__client_id_pk", params.customer_id);
            if (item_check) {
                const update_active_status = await Client.update({ is_active: body.is_active, updated_by: user.company_id }, { where: { __client_id_pk: params.customer_id, _company_id_fk: user.company_id } })
                if (update_active_status) {
                    return { status: true, message: translate('Validation.status_updated', user.lang) };
                }
                else {
                    return { status: false, message: translate('Validation.record_not_exist', user.lang) };
                }
            }
            else {
                return { status: false, message: translate('Validation.record_not_exist', user.lang) };
            }
        }
        else {
            return { status: false, message: translate('Validation.invalid_data', user.lang) };
        }
    }
    /**
     * @author Kirankumar
     * @summary This function is used for create the address for client record
     * @requires customer_id
     * @input Address data
     * @returns Status and List of address
     */
    fastify.get('/customer/address/get/:customer_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            var validate_customer = await Client.count({ where: { __client_id_pk: req.params.customer_id, is_deleted: 0 } });
            if (validate_customer) {
                var address_records = await Address.findAll({ raw: true, attributes: ["__address_id_pk", "address1", "city", "state", "country", "zip", "is_active", "is_billing", "is_delivery", "is_default"], where: { _client_id_fk: req.params.customer_id } })
                if (address_records.length > 0) {
                    for (var add_all = 0; add_all < address_records.length; add_all++) {
                        address_records[add_all].address_full = await handy.format_address(address_records[add_all], user.company_id);
                    }
                    address_records = await handy.transformnames('LTR', address_records, "Address", {}, user);
                    address = address_records;
                    res.status(200).send({ status: true, data: address })
                }
                else {
                    res.status(500).send({ status: false, message: translate('Validation.record_not_exist', user.lang) })
                }
            }
            else {
                res.status(500).send({ status: false, message: translate('Validation.customer_not_exist', user.lang) })
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used get the client rentals
     * @requires customer_id
     * @returns Status and List of rentals
     */
    fastify.get('/customer/rental/get/:customer_id', async (req, res) => {
        try {
            const user = await handy.verfiytoken(req, res);
            if (!user) return;
            let attributes = ["__rental_id_pk", "company_contact_mobile", "company_contact_phone", "date_start", "date_end", "delivery", "pickup", "due_date", "is_rental", "is_quote", "_address_id_fk", "address_full"];
            attributes = handy.setDateFormat(attributes, ["date_start", "date_end"], user.date_format);
            Rental.belongsTo(ConfigRentalStatus, { targetKey: '__config_rental_status_id_pk', foreignKey: '_config_rental_status_id_fk', })
            let rental_get = await Rental.findAll({
                attributes, where: { _client_id_fk: req.params.customer_id, is_deleted: 0 },
                include: {
                    model: ConfigRentalStatus,
                    attributes: ["status_label", "color_code"]
                },
                order: [["created_at", "DESC"]]
            })
            rental_get = await handy.transformnames('LTR', rental_get, "Rental", { config_rental_status: "ConfigRentalStatus" }, user);
            if (rental_get.length > 0) {
                let client_comm_get = await Client.findAll({ raw: true, attributes: ["email", "telephone"], where: { __client_id_pk: req.params.customer_id } });
                for (let ret in rental_get) {
                    let address_records = await Address.findAll({ raw: true, attributes: ["address1", "city", "state", "country", "zip"], where: { _client_id_fk: req.params.customer_id, __address_id_pk: rental_get[ret].address_id } })
                    if (client_comm_get.length > 0) {
                        rental_get[ret].email = client_comm_get[0].email;
                        rental_get[ret].telephone = client_comm_get[0].telephone;
                    }
                    if (address_records.length > 0) {
                        rental_get[ret].address_full = await handy.format_address(address_records[0], user.company_id);
                        rental_get[ret] = { ...rental_get[ret], ...address_records[0] }
                    }
                    let rental_items_data = await RentalItems.findAll({ attributes: ["item", "qty"], where: { _rental_id_fk: rental_get[ret].rental_id } });
                    rental_get[ret].items = await handy.transformnames('LTR', rental_items_data, "RentalItems", {}, user);
                }
                res.status(200).send({ status: true, data: rental_get })
            }
            else {
                res.status(200).send({ status: true, data: [] })
            }
        }
        catch (e) {
            res.status(404).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for create or update the client
     * @param {HTTP responds} res 
     * @param {client data} data 
     * @param {logged in user} user 
     * @param {client id} cust_id 
     * @returns status and updated data
     */
    async function insert_update_customer(res, data, user, cust_id) {
        try {
            if (cust_id) {
                var check_deleted = await Client.count({ where: { __client_id_pk: cust_id, is_deleted: 0 } })
                if (!check_deleted) {
                    return { status: false, message: translate('Validation.record_not_exist', user.lang) }
                }
            }
            var client_id = "";
            var input_request = Object.assign({}, data);
            if (input_request.address) {
                delete input_request.address;
            }
            if (input_request.notes) {
                delete input_request.notes;
            }
            if (input_request.payment_method) {
                delete input_request.payment_method;
            }
            if (input_request.communication) {
                delete input_request.communication;
            }
            input_request = await handy.transformnames('RTL', input_request, "Client", {}, user);
            if (!cust_id) {
                var serial_count = await Client.count({ where: { _company_id_fk: user.company_id, } });
                serial_count = serial_count + 1;
                input_request.serial_no = serial_count;
                input_request.created_by = user.company_id;
                input_request.created_at = new Date();
                input_request._company_id_fk = user.company_id;
                input_request.name_full = "";
                var client_saved = await Client.create(input_request);
                client_id = client_saved.get("__client_id_pk");
            }
            else {
                input_request.updated_by = user.company_id;
                var client_saved = await Client.update(input_request, { where: { __client_id_pk: cust_id } });
                client_id = cust_id;
            }

            if (client_saved) {
                //address
                if (data.address && data.address.length > 0) {
                    var store_address_id = [];
                    var address_arr = data.address;
                    address_arr = await handy.transformnames('RTL', address_arr, "Address", {}, user);
                    var is_have_billing = false;
                    var is_have_delivery = false;
                    for (var addr = 0; addr < address_arr.length; addr++) {
                        var update_address_id = "";
                        address_arr[addr]._client_id_fk = client_id;
                        var get_address_id = "";
                        if (address_arr[addr].__address_id_pk) {
                            update_address_id = address_arr[addr].__address_id_pk;
                        }
                        if (update_address_id) {
                            address_arr[addr].updated_by = user.company_id;
                            var address_save = await Address.update(address_arr[addr], { where: { __address_id_pk: update_address_id } });
                            get_address_id = update_address_id;
                            store_address_id.push(update_address_id);
                            // var address_save = await Address.bulkCreate(address_arr);
                        }
                        else {
                            address_arr[addr].created_by = user.company_id;
                            address_arr[addr].created_at = new Date();
                            var address_save = await Address.create(address_arr[addr]);
                            store_address_id.push(address_save.__address_id_pk);
                            get_address_id = address_save.__address_id_pk;
                        }
                        address_save = await handy.transformnames('LTR', address_arr, "Client", {}, user);

                        var insert_CombineAddr = {};
                        if (address_save[addr].is_billing !== undefined && address_save[addr].is_billing == 1) {
                            var address_billing = await handy.format_address(address_arr[addr], user.company_id);
                            insert_CombineAddr['address_billing'] = address_billing;
                            insert_CombineAddr['billing_add_id'] = get_address_id;
                            is_have_billing = true;
                        } else if (!is_have_billing) {
                            insert_CombineAddr['address_billing'] = "";
                            insert_CombineAddr['billing_add_id'] = "";
                        }

                        if (address_save[addr].is_delivery !== undefined && address_save[addr].is_delivery == 1) {
                            var address_delivery = await handy.format_address(address_arr[addr], user.company_id);
                            insert_CombineAddr['address_delivery'] = address_delivery;
                            insert_CombineAddr['delivery_add_id'] = get_address_id;
                            await Rental.update({ address_full: address_delivery, _address_id_fk: get_address_id }, {
                                where: {
                                    _client_id_fk: client_id,
                                    //_address_id_fk: 0,
                                    _company_id_fk: user.company_id
                                }
                            });
                            is_have_delivery = true;
                        } else if (!is_have_delivery) {
                            insert_CombineAddr['address_delivery'] = "";
                            insert_CombineAddr['delivery_add_id'] = "";
                        }
                        //Update combine Address in client table
                        if (Object.keys(insert_CombineAddr).length > 0) {
                            var client_addr_save = await Client.update(insert_CombineAddr, { where: { __client_id_pk: client_id } });
                        }
                    }
                    //delete Address
                    if (store_address_id.length > 0) {
                        var address_delete = await Address.destroy({ where: { __address_id_pk: { [Op.notIn]: store_address_id }, _client_id_fk: client_id } });
                    }
                }
                else {
                    var address_delete_all = await Address.destroy({ where: { _client_id_fk: client_id } });
                }

                //communication
                if (data.communication && data.communication.length > 0) {
                    var store_communication_id = [];
                    data.communication = await handy.transformnames('RTL', data.communication, "Communication", {}, user);
                    var email = '';
                    var tel = '';
                    for (var comt = 0; comt < data.communication.length; comt++) {
                        var communication_id = "";
                        data.communication[comt]._client_id_fk = client_id;
                        if (data.communication[comt].__comm_id_pk) {
                            communication_id = data.communication[comt].__comm_id_pk;
                        }

                        if (data.communication[comt].is_int) {
                            if (data.communication[comt].is_int == "1" && data.communication[comt].email) {
                                email = email != '' ? email : data.communication[comt].email;
                                if (data.communication[comt].is_default && data.communication[comt].is_default == "1") {
                                    email = data.communication[comt].email;
                                }
                                data.communication[comt].data = email;
                            }
                            data.communication[comt].is_fax = data.communication[comt].is_int;
                        }

                        if (data.communication[comt].is_tel) {
                            if (data.communication[comt].is_tel == "1" && data.communication[comt].data) {
                                tel = tel != '' ? tel : data.communication[comt].data;
                                if (data.communication[comt].is_default && data.communication[comt].is_default == "1") {
                                    tel = data.communication[comt].data;
                                }
                                data.communication[comt].data = tel;
                            }
                            data.communication[comt].is_mobile = data.communication[comt].is_tel;
                        }
                        if (communication_id) {
                            data.communication[comt].updated_by = user.company_id;
                            var comm_save = await Communication.update(data.communication[comt], { where: { __comm_id_pk: communication_id } });
                            store_communication_id.push(communication_id)
                        }
                        else {
                            data.communication[comt].created_by = user.company_id;
                            data.communication[comt].created_at = new Date();
                            var comm_save = await Communication.create(data.communication[comt]);
                            store_communication_id.push(comm_save.__comm_id_pk)
                        }
                    }
                    //Email and data in client
                    var client_comm_save = await Client.update({ email: email, telephone: tel }, { where: { __client_id_pk: client_id } });
                    //delete Address
                    if (store_communication_id.length > 0) {
                        var communiaction_delete = await Communication.destroy({ where: { __comm_id_pk: { [Op.notIn]: store_communication_id }, _client_id_fk: client_id } });
                    }
                }
                else {
                    var communiaction_delete_all = await Communication.destroy({ where: { _client_id_fk: client_id } });
                }

                //Payment method
                if (data.payment_method && data.payment_method.length > 0) {
                    var store_payment_id = [];
                    data.payment_method = await handy.transformnames('RTL', data.payment_method, "ClientPaymentMethod", {}, user);
                    for (var payt = 0; payt < data.payment_method.length; payt++) {
                        var payment_method_id = "";
                        data.payment_method[payt]._client_id_fk = client_id;
                        data.payment_method[payt]._company_id_fk = user.company_id;
                        if (!cust_id) {
                            data.payment_method[payt].secret = md5(data.payment_method[payt].secret)
                        }
                        if (data.payment_method[payt].__payment_method_id_pk) {
                            payment_method_id = data.payment_method[payt].__payment_method_id_pk;
                        }

                        if (payment_method_id) {
                            data.payment_method[payt].updated_by = user.company_id;
                            var pay_save = await ClientPaymentMethod.update(data.payment_method[payt], { where: { __payment_method_id_pk: payment_method_id } });
                            store_payment_id.push(payment_method_id)
                        }
                        else {
                            data.payment_method[payt].created_by = user.company_id;
                            data.payment_method[payt].created_at = new Date();
                            var pay_save = await ClientPaymentMethod.create(data.payment_method[payt]);
                            store_payment_id.push(pay_save.__payment_method_id_pk)
                        }
                    }
                    //delete payment
                    if (store_payment_id.length > 0) {
                        var pay_delete = await ClientPaymentMethod.destroy({ where: { __payment_method_id_pk: { [Op.notIn]: store_payment_id }, _client_id_fk: client_id } });
                    }

                }
                else {
                    var pay_delete_all = await ClientPaymentMethod.destroy({ where: { _client_id_fk: client_id } });
                }

                //Notes
                if (data.notes) {
                    for (var cnot = 0; cnot < data.notes.length; cnot++) {
                        data.notes[cnot]._client_id_fk = client_id;
                        data.notes[cnot].created_by = user.company_id;
                        data.notes[cnot].created_at = new Date();
                        var notes_save = await ClientNotes.create(data.notes[cnot]);
                    }
                }
                var get_data = await get_customer_data(res, client_id, user);
                return get_data
            }
            else {
                if (!cust_id) {
                    res.status(501).send({ status: false, message: translate('Validation.record_not_inserted', user.lang) })
                }
                else {
                    res.status(501).send({ status: false, message: translate('Validation.record_not_updated', user.lang) })
                }
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message })
        }
    }
    /**
     * @author Kirankumar
     * @summary This function is used for send client details
     * @param {HTTP responds} res 
     * @param {client id} customer_id 
     * @param {Logged in user} user 
     * @returns status and client details
     */
    async function get_customer_data(res, customer_id, user) {
        try {
            if (customer_id) {
                //var get_data = ["__client_id_pk", "_company_id_fk", "account_bsb", "serial_no", "account_customer", "account_name", "account_number", "address_billing", "address_delivery", "account_type", "biller_code", "biller_reference_number", "birth_date", "car_registration_no", "commision", "company", "company_discount", "company_number", "creation_host_timestamp", "driver_license", "driver_license_expriy", "driver_license_issued", "first_name", "initial", "is_updated", "last", "modification_host_timestamp", "name_full", "pay_commision", "photo", "referral", "supplier", "supplier_display", "terms", "website", "is_send_alert", "is_insurance", "insurance_exp_date", "insurance_policy_no", "is_pay_comm", "is_supplier", "position", "parent_id"]
                let client_get = await Client.findAll({ raw: true, where: { is_deleted: 0, _company_id_fk: user.company_id, __client_id_pk: customer_id } })
                client_get = await handy.transformnames('LTR', client_get, "Client", {}, user);
                if (!client_get || !client_get.length) {
                    res.status(404).send({ status: false, message: translate('Validation.record_not_exist', user.lang) })

                }
                let contact_records = await ClientContact.findAll({ raw: true, attributes: ["__client_contact_id_pk", "first_name", "last_name", "notes", "position"], where: { _company_id_fk: user.company_id, _client_id_fk: customer_id } })
                contact_records = await handy.transformnames('LTR', contact_records, "ClientContact", {}, user);

                //Client payment methods
                let payment_method_records = await ClientPaymentMethod.findAll({ raw: true, attributes: ["__payment_method_id_pk", "type", "name", "number", "expiry_month", "expiry_year", "is_active"], where: { _company_id_fk: user.company_id, _client_id_fk: customer_id } })
                payment_method_records = await handy.transformnames('LTR', payment_method_records, "ClientPaymentMethod", {}, user);
                //Client addresses
                let address_records = await Address.findAll({ raw: true, attributes: ["__address_id_pk", "address1", "city", "state", "country", "zip", "is_active", "is_billing", "is_delivery", "is_default"], where: { _client_id_fk: customer_id } })
                address_records = await handy.transformnames('LTR', address_records, "Address", {}, user);
                //will use in future 
                // var communication_records = await Communication.findAll({ raw: true, attributes: ["__comm_id_pk", "email", "data", "type", "area_code", "country_code", "is_default", "is_int", "is_tel"], where: { _client_id_fk: customer_id } })
                // communication_records = await handy.transformnames('LTR', communication_records, "Communication");
                //get site details for client
                let site_list_client_id = 0;
                if (client_get && client_get[0].parent_id) {
                    site_list_client_id = client_get[0].parent_id;
                } else {
                    site_list_client_id = client_get[0].client_id;
                }
                if (site_list_client_id) {
                    let site_list = await Site.findAll({ where: { _client_id_fk: site_list_client_id, is_deleted: 0 } })
                    client_get[0].site_list = await handy.transformnames('LTR', site_list, "Site", {}, user);
                }
                let get_notes = await ClientNotes.findAll({ raw: true, order: [['__client_notes_id_pk', 'DESC']], attributes: ["__client_notes_id_pk", "notes", "created_at"], where: { _client_id_fk: customer_id } })
                get_notes = await handy.transformnames('LTR', get_notes, "ClientNotes", {}, user);
                let get_notes_staff = await Auth.findAll({ raw: true, attributes: ["display_staff_name"], where: { __staff_id_pk: user.company_id, is_deleted: 0 } })
                if (client_get.length > 0) {
                    //Address
                    if (address_records) {
                        client_get[0].address = [];
                        for (let ar = 0; ar < address_records.length; ar++) {
                            let temp_addr_obj = address_records[ar]
                            temp_addr_obj = await handy.transformnames('RTL', temp_addr_obj, "Address", {}, user);
                            temp_addr_obj['address_full'] = await handy.format_address(address_records[ar], user.company_id);
                            temp_addr_obj = await handy.transformnames('LTR', temp_addr_obj, "Address", {}, user);
                            client_get[0].address.push(temp_addr_obj)
                        }
                    }
                    //Notes
                    if (get_notes) {
                        client_get[0].notes_list = [];
                        for (let notlst = 0; notlst < get_notes.length; notlst++) {
                            let temp_notes_obj = {};
                            temp_notes_obj['notes_id'] = get_notes[notlst].notes_id;
                            temp_notes_obj['notes'] = get_notes[notlst].notes;
                            temp_notes_obj['created_at'] = get_notes[notlst].created_at;
                            temp_notes_obj['created_by'] = get_notes_staff[0] ? get_notes_staff[0].display_staff_name : "";
                            client_get[0].notes_list.push(temp_notes_obj);
                        }
                    }

                    //Message
                    Messaging.belongsTo(Auth, { targetKey: '__staff_id_pk', foreignKey: 'created_by' })
                    let message_records = await Messaging.findAll({
                        order: [['__messaging_id_pk', 'DESC']], attributes: ["__messaging_id_pk", "subject", "message", "sms_cost", "to_phone_number", "type", ["created_at", "sent_date"], "attachments"],
                        where: { _client_id_fk: customer_id, is_deleted: 0 },
                        include: {
                            model: Auth,
                            attributes: ["display_staff_name"]
                        }
                    })
                    message_records = await handy.transformnames('LTR', message_records, "Messaging", { staff: "Auth" }, user);
                    if (message_records) {
                        client_get[0].messages = message_records;
                    }
                    //sub-contacts
                    let sub_contacts = await Client.findAll({ raw: true, attributes: [["__client_id_pk", "contact_id"], "_company_id_fk", "first_name", ["last", "last_name"], "name_full", "account_name", "position", "parent_id", "is_active", "telephone", "email", "notes"], where: { parent_id: customer_id, is_deleted: 0 } })
                    sub_contacts = await handy.transformnames('LTR', sub_contacts, "Client", {}, user);
                    if (sub_contacts) {
                        client_get[0].sub_contacts = [];
                        for (let subc = 0; subc < sub_contacts.length; subc++) {
                            let temp_subCont_obj = {};
                            temp_subCont_obj = sub_contacts[subc];
                            let sub_address_records = await Address.findAll({ raw: true, attributes: ["__address_id_pk", "address1", "city", "state", "zip", "country"], where: { _client_id_fk: sub_contacts[subc].contact_id } })
                            sub_address_records = await handy.transformnames('LTR', sub_address_records, "Address", {}, user);
                            if (sub_address_records) {
                                for (let subaddr = 0; subaddr < sub_address_records.length; subaddr++) {
                                    temp_subCont_obj['address_id'] = sub_address_records[subaddr].address_id;
                                    temp_subCont_obj['address1'] = sub_address_records[subaddr].address1;
                                    temp_subCont_obj['city'] = sub_address_records[subaddr].city;
                                    temp_subCont_obj['state'] = sub_address_records[subaddr].state;
                                    temp_subCont_obj['zip'] = sub_address_records[subaddr].zip;
                                    temp_subCont_obj['address_full'] = await handy.format_address(sub_address_records[subaddr], user.company_id);
                                }
                            }
                            client_get[0].sub_contacts.push(temp_subCont_obj);
                        }
                    }
                    //Payment_methods
                    if (payment_method_records) {
                        client_get[0].payment_method = payment_method_records;
                    }
                    client_get[0].client_calculation = await handy.client_calculations(customer_id, user);
                    client_get[0].client_calculation = handy.setDecimal("client_calculation", client_get[0].client_calculation, user);
                    res.status(200).send({ status: true, data: client_get })
                }
                else {
                    res.status(404).send({ status: false, message: translate('Validation.record_not_exist', user.lang) })
                }
            }
            else {
                res.status(500).send({ status: false, message: translate('Validation.invalid_data', user.lang) })
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used for get the sub contact data.
     * @param {Sub contact id} customer_id 
     * @param {Loggedin user details} user 
     * @returns Status and Subcontact data.
     */
    async function get_customer_subcontact_data(customer_id, user) {
        let data = []
        if (customer_id) {
            data = await Client.findAll({
                where: {
                    is_deleted: 0, parent_id: customer_id
                }
            })
            data = await handy.transformnames('LTR', data, "Client", {}, user);
        }
        return { statu: true, data }
    }
}

module.exports = ClientRouter;