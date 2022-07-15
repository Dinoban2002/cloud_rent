const sequelize = require("../config/database");
const { MessagesCanned, Messaging, Client, MasterCompany, RentalItems, Rental, Countries, Address, Administration, Upload } = require("../models/Model")(["Upload", "MessagesCanned", "Messaging", "Rental", "RentalItems", "MasterCompany", "Client", "Countries", "Address", "Administration"]);
var lang = require('../language/translate').validationMsg;
var handy = require("../config/common");
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;
let moment = require('moment');
async function MessageRouter(fastify) {
    /**
     * @author Kirankumar
     * @summary This rout is usefull to create the email or sms template
     * @returns Status and created data
     */
    fastify.post('/message/template/insert', async (req, res) => {
        insert_update_template(req, res);
    })
    /**
     * @author Kirankumar
     * @summary This rout is usefull to update the email or sms template
     * @returns Status and updated data
     */
    fastify.put('/message/template/update/:template_id', async (req, res) => {
        insert_update_template(req, res, req.params.template_id);
    })

    /**
     * @author Kirankumar
     * @summary This rout is usefull to get the template data based on type
     * @returns Status and List of template data
     */
    fastify.get('/message/template/get/:temp_type', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await get_template(user.company_id, req.params.temp_type);
            res.status(200).send({ status: true, data });
        } catch (e) {
            res.status(501).send(e);
        }


    })

    /**
     * @author Kirankumar
     * @summary This rout is usefull to delete the template by id
     * @returns Status and message
     */
    fastify.delete('/message/template/delete/:temp_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const count = await MessagesCanned.count({ where: { _company_id_fk: user.company_id, __message_canned_id_pk: req.params.temp_id, is_deleted: 0 } });
            if (count) {
                MessagesCanned.update({ is_deleted: 1 }, { where: { __message_canned_id_pk: req.params.temp_id } });
                res.status(200).send({ status: true, message: lang('Validation.record_deleted', user.lang) });
            } else {
                res.status(200).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is usefull to get the converted template with client values
     * @returns Status and template data
     */
    fastify.post('/message/get', async (req, res) => {
        get_converted_template(req, res);
    })

    /**
     * @author Kirankumar
     * @summary This rout is usefull to get the converted templates with client values
     * @returns Status and List of template data
     */
    fastify.post('/messages/get', async (req, res) => {
        get_converted_template(req, res, true);
    })

    /**
     * @author Kirankumar
     * @summary This rout is usefull to update the SMTP config
     * @returns Status and SMTP config
     */
    fastify.put('/smtp/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            let in_data = req.body;
            if (in_data && in_data.config_smtp_host && in_data.config_smtp_username && in_data.config_smtp_password && in_data.config_smtp_secure && in_data.config_smtp_port && in_data.config_smtp_from_email && in_data.config_smtp_from_username) {
                in_data = handy.transformnames('RTL', in_data, "MasterCompany");
                const count = await Administration.count({ where: { _company_id_fk: user.company_id } });
                if (count) {
                    in_data.updated_by = user.user_id;
                    await Administration.update(in_data, { where: { _company_id_fk: user.company_id } });
                } else {
                    in_data._company_id_fk = user.company_id;
                    in_data.created_by = user.user_id;
                    in_data.created_at = new Date();
                    await Administration.create(in_data);
                }
                let data = await get_smtp_config(user.company_id);
                res.status(200).send({ status: true, data });
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is usefull to send email or sms and will save the message in db
     * @returns Status and message
     */
    fastify.post('/message/send', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            let sms_send_status = false;
            let sms_send_failed = '';
            let message_array = req.body;
            let attachments = [];
            let inline_images = [];
            let country_code_found = false;
            let result = false;
            if (message_array && Object.keys(message_array).length) {
                let insert_data = [];
                if (message_array.type == "sms") {
                    if (message_array.to_phone_number && !message_array.to_phone_number.match(/^\+/)) {
                        const country_code = await get_country_code(message_array.customer_id);
                        if (country_code)
                            country_code_found = true;
                        message_array.to_phone_number = country_code + message_array.to_phone_number;
                    } else {
                        country_code_found = true;
                    }
                    const twilio_res = await handy.send_message(message_array.to_phone_number, message_array.message);
                    if (twilio_res.status == 400) {
                        sms_send_status = false;
                        if (country_code_found)
                            sms_send_failed = twilio_res.message;
                    } else {
                        sms_send_status = true;
                        message_array.sms_cost = twilio_res.price;
                    }
                } else if (message_array.type == "email") {
                    const config = await get_smtp_config(user.company_id);
                    sms_send_status = await handy.send_email(config, message_array.to_phone_number, message_array.message, message_array.subject, message_array.cc, message_array.attachment, message_array.inline, message_array.rental_id);
                }
                const attachment_files = await Upload.findAll({ raw: true, attributes: ["file_name", "name_ref"], where: { name_ref: message_array.attachment } }) || [];
                message_array = await handy.transformnames("RTL", message_array, "Messaging");
                message_array.attachments = JSON.stringify(attachment_files);
                if (sms_send_status != false && sms_send_status != -1) {
                    message_array.created_by = user.user_id;
                    message_array.created_at = new Date();
                    const create_status = await Messaging.create(message_array);
                    if (create_status.__messaging_id_pk) {
                        result = true;
                    }
                }

                if (sms_send_status === -1) {
                    sms_send_failed = lang('Validation.email_add_wrong');
                } else if (message_array.type == "email" && !sms_send_status) {
                    sms_send_failed = lang('Validation.email_sent_failed');
                } else if (message_array.type == "sms" && !country_code_found && sms_send_failed == '') {
                    sms_send_failed = lang('Validation.country_code_not_found');
                } else if (message_array.type == "sms" && !sms_send_status && sms_send_failed == '') {
                    sms_send_failed = lang('Validation.message_sent_failed');
                }
                let output = {};
                if (result != false) {
                    //$message_canned_id = $result;
                    output.status = true;
                    if (message_array.type == "email") {
                        output.message = lang('Validation.email_sent');
                    } else if (message_array.type == "sms") {
                        output.message = lang('Validation.message_sent');
                    }
                    res.status(200).send(output);
                }
                else {
                    output.status = false;
                    output.message = sms_send_failed ? sms_send_failed : lang('Validation.message_sent_failed', user.lang)
                    res.status(500).send(output);
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
     * @summary  This rout is used for delete message
     * @package {message id} message_id
     * @returns Status and message
     */

    fastify.delete('/message/delete/:message_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.message_id) {
                let data = await Messaging.update({ is_deleted: 1 }, { where: { __messaging_id_pk: req.params.message_id, is_deleted: 0 } })
                if (data && data[0]) {
                    res.status(200).send({ status: true, message: lang('Validation.record_deleted', user.lang) })
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) })
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message })
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is used for get the country code for customer
     * @param {client id} customer_id 
     * @returns country code
     */
    async function get_country_code(customer_id) {
        let add_data = await Address.findOne({
            attributes: ["__address_id_pk", "country"], where: {
                _client_id_fk: customer_id
            },
            order: [
                ["is_billing", "desc"],
                ["is_delivery", "desc"]
            ]
        });

        if (!add_data || !add_data.country)
            return '';
        let country_data = await Countries.findOne({
            attributes: ["countries_isd_code"], where: {
                countries_name: add_data.country
            }
        })
        return (country_data && country_data.countries_isd_code) ? "+" + country_data.countries_isd_code : "";
    }
    /**
     * @author Kirankumar
     * @summary This function is used for get smtp config for company
     * @param {company id} company_id 
     * @returns SMTP config
     */
    async function get_smtp_config(company_id) {
        let data = await Administration.findOne({ attributes: ["config_smtp_from_username", "config_smtp_from_email", "config_smtp_port", "config_smtp_secure", "config_smtp_host", "config_smtp_username", "config_smtp_password"], where: { _company_id_fk: company_id } });
        return data ? data : {};
    }
    /**
     * @author Kirankumar
     * @summary This function used for update customer values with place holders in template
     * @param {HTTP request} req 
     * @param {HTTP responds} res 
     * @param {all templates or one} is_all 
     * @returns Converted template with values
     */
    async function get_converted_template(req, res, is_all = false) {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const { customer_id, template_id, template_type, rental_id } = req.body;
            if (!customer_id && !rental_id) {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
                return;
            }
            const template_rep = {
                Company: "<<Clients::Company>>",
                First: "<<Clients::First>>",
                Last: "<<Clients::Last>>",
                Full: "<<Clients::Full>>",
                JobNo: "<<Interface::RentalID>>",
                DeliveryDate: "<<Interface::DeliveryDate>>",
                DeliveryTime: "<<Interface::DeliveryTime>>",
                DeliveryAddress: "<<Interface::DeliveryAddress>>",
                Address: "<<Clients::Address>>",
                JobItems: "<<Interface::JobItems>>"
            };
            const attributes = [["first_name", "First"], ["last", "Last"], ["name_full", "Full"], ["address_billing", "Address"]];
            let client_data = '';
            let rental_data = '';
            if (customer_id) {
                Client.belongsTo(Administration, { targetKey: '_company_id_fk', foreignKey: '_company_id_fk' });
                client_data = await Client.findOne({
                    raw: true, attributes, where: { __client_id_pk: customer_id, _company_id_fk: user.company_id, is_deleted: 0 }, include: {
                        model: Administration,
                        attributes: ["office_phone"]
                    }
                });
            }
            let office_phone = "";
            if (client_data && client_data["administration.office_phone"]) {
                office_phone = client_data["administration.office_phone"];
                delete client_data["administration.office_phone"];
            }
            const rental_attributes = ["date_end", "date", "collection", "delivery", "return", "pickup", ["__rental_id_pk", "RentalID"], ["delivery_address", "DeliveryAddress"], ["delivery_date", "DeliveryDate"], ["delivery_time", "DeliveryTime"]]
            if (!rental_id) {
                rental_data = await Rental.findOne({ raw: true, attributes: rental_attributes, where: { _client_id_fk: customer_id, _company_id_fk: user.company_id, is_deleted: 0 } }) || {};
            } else {
                rental_data = await Rental.findOne({ raw: true, attributes: rental_attributes, where: { __rental_id_pk: rental_id, _company_id_fk: user.company_id, is_deleted: 0 } }) || {};
            }
            client_data = { ...client_data, ...rental_data };
            let unstored_deliveryPickupDisplay = "";
            if (rental_data.Delivery == "yes" && rental_data.collection == "yes") {
                unstored_deliveryPickupDisplay = "DELIVER & COLLECT";
            } else if (rental_data.Delivery == "yes" && rental_data.return == "yes") {
                unstored_deliveryPickupDisplay = "DELIVER & RETURN";
            } else if (rental_data.pickup == "yes" && rental_data.return == "yes") {
                unstored_deliveryPickupDisplay = "PICKUP & RETURN";
            } else if (rental_data.pickup == "yes" && rental_data.return == "yes") {
                unstored_deliveryPickupDisplay = "PICKUP & COLLECT";
            } else if (rental_data.Delivery == "yes") {
                unstored_deliveryPickupDisplay = "DELIVERY";
            } else if (rental_data.pickup == "yes") {
                unstored_deliveryPickupDisplay = "PICKUP";
            } else if (rental_data.return == "yes") {
                unstored_deliveryPickupDisplay = "RETURN";
            }

            if (!rental_data.pickup && !rental_data.Delivery && !rental_data.collection && !rental_data.return) {
                unstored_deliveryPickupDisplay = "LOGISTICS";
            }
            let rental_item_data = "";
            client_data.JobItems = "";
            if (Object.keys(rental_data).length) {
                let { date_end, date, RentalID: rental_id } = rental_data;
                date_end = new Date(date_end) != "Invalid Date" ? moment(date_end).format(user.inv_date_format) : "";
                date = new Date(date) != "Invalid Date" ? moment(date).format(user.inv_date_format) : "";
                const items = await RentalItems.findAll({
                    attributes: [
                        [Sequelize.fn("CONCAT", Sequelize.col('qty'), ' ', Sequelize.col('item')), "item"]
                    ], where: { _rental_id_fk: rental_id }
                });
                for (item of items) {
                    rental_item_data += item.item + "\n";
                }
                client_data.JobItems = "BOOKING CONFIRMATION\n" + unstored_deliveryPickupDisplay + "\nStart Date: " + date + "\nEnd Date: " + date_end + "\n" + rental_item_data + "\nFOR ANY QUERIES PHONE: " + (office_phone || "")
            }


            if (is_all && template_type && client_data) {
                let template_data = await MessagesCanned.findAll({ attributes: [["__message_canned_id_pk", "message_canned_id"], "template_name", "type", "template_body"], where: { type: template_type, _company_id_fk: user.company_id, is_deleted: 0 } });
                if (template_data && template_data.length && client_data) {
                    for (index in template_data) {
                        let template = template_data[index].template_body || '';
                        for (key of Object.keys(template_rep)) {
                            const val = client_data[key] ? client_data[key] : '';
                            template = template.replace(new RegExp(template_rep[key], "gm"), val);
                        }
                        template_data[index].template_body = template;
                    }
                    res.status(200).send({ status: true, data: template_data });
                } else {
                    res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
                }
            } else if (client_data && template_id) {
                let out_data = '';
                let template_data = await MessagesCanned.findOne({ raw: true, attributes: ["template_body"], where: { __message_canned_id_pk: template_id, _company_id_fk: user.company_id, is_deleted: 0 } });
                if (template_data && client_data) {
                    out_data = template_data.template_body || "";
                    for (key of Object.keys(template_rep)) {
                        const val = client_data[key] ? client_data[key] : '';
                        out_data = out_data.replace(new RegExp(template_rep[key], "gm"), val);
                    }
                    res.status(200).send({ status: true, data: out_data });
                } else {
                    res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    }

    /**
     * @author Kirankumar
     * @summary  This function is used for get the templates data
     * @param {company id} company_id 
     * @param {template type} type 
     * @returns list of template data
     */
    async function get_template(company_id, type = '') {
        let data = await MessagesCanned.findAll({ where: { _company_id_fk: company_id, type: type, is_deleted: 0 } });
        data = await handy.transformnames('LTR', data, "MessagesCanned")
        return data ? data : [];
    }

    /**
     * @author Kirankumar
     * @summary This function is used for create or update the template data
     * @param {HTTP request} req 
     * @param {HTTP responds} res 
     * @param {template id} message_canned_id 
     * @returns Status and template data
     */
    async function insert_update_template(req, res, message_canned_id = '') {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            let template_array = req.body;

            if (template_array && template_array.type && template_array.template_name) {
                let where = {
                    _company_id_fk: user.company_id,
                    template_name: template_array.template_name,
                    is_deleted: 0,
                    type: template_array.type
                }
                if (message_canned_id) {
                    where.__message_canned_id_pk = { [Op.notIn]: [message_canned_id] };
                }
                const count = await MessagesCanned.count({ where });
                const in_data = await handy.transformnames('RTL', req.body, "MessagesCanned")
                if (count) {
                    res.status(404).send({ status: false, message: lang("Validation.temp_exist", user.lang) });
                    return;
                } else {
                    if (message_canned_id) {
                        await MessagesCanned.update(in_data, { where: { __message_canned_id_pk: message_canned_id } });
                    } else {
                        in_data._company_id_fk = user.company_id;
                        let ins_data = await MessagesCanned.create(in_data);
                        console.log(ins_data);
                    }
                }
                const data = await get_template(user.company_id, template_array.type);
                res.status(200).send({ status: 200, data });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    }
}

module.exports = MessageRouter;