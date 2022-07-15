var commonchange = require("../config/common");
const { Rental, ConfigRentalStatus, ConfigCalendar, RentalItems, Client, Task } = require("../models/Model")(["Rental", "ConfigRentalStatus", "ConfigCalendar", "RentalItems", "Client", "Task"]);
const calendar_controller = require("../controllers/CalendarController.js");
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var commonchange = require("../config/common");
var translate = require('../language/translate').validationMsg;

async function CalendarRouter(fastify, opts) {
    /**
     * @author Bharath
     * @summary This rout is used for get calendar data
     * @returns Status and Calender data
     */
    fastify.post('/calendar/filter', async (req, res) => {
        try {

            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            if (!req.body.date_start || !req.body.date_end) {
                res.status(501).send({ status: false, message: translate('Validation.invalid_data', user.lang) });
                return;
            }
            var response_data = {};
            //set start date filter for calender

            /**
             * date_start = 2021-10-23 and date_end = 2021-10-31
             * WHERE (
             *      (
             *          (`rental`.`date_start` >= '2021-08-06' AND `rental`.`date_start` <= '2021-08-18') 
             *              AND 
             *          (`rental`.`date_end` <= '2021-10-30' AND `rental`.`date_end` >= '2021-10-30')
             *      ) 
             *   OR 
             *      (`rental`.`date_end` <= '2021-10-30' AND `rental`.`date_end` >= '2021-10-30')
             * )
             */
            const query_date_start = {
                [Op.and]: [
                    { [Op.gte]: req.body.date_start },
                    { [Op.lte]: req.body.date_end }
                ]
            }
            //set end date filter for calender
            const query_date_end = {
                [Op.and]: [
                    { [Op.lte]: req.body.date_end },
                    { [Op.gte]: req.body.date_start }
                ]
            }
            Rental.belongsTo(ConfigRentalStatus, { targetKey: '__config_rental_status_id_pk', foreignKey: '_config_rental_status_id_fk' });
            if (req.body.type && req.body.type.includes("rentals")) {
                //var rental_data = await Rental.findAll({ attributes: ['__rental_id_pk', 'date_start', 'date_end', 'address_full', 'time_start', "time_end", '_config_rental_status_id_fk', 'job_name', '_invoice_id_fk', 'contact_phone', 'driver', 'long_term_hire'], where: { [Op.or]: [{ date_start: query_date_start, date_end: query_date_end }, { date_end: query_date_end }] }, include: { model: ConfigRentalStatus, attributes: [["status_label", "rental_status"]] } });
                var rental_data = await Rental.findAll({
                    attributes: ['__rental_id_pk', 'date_start', 'date_end', 'address_full', 'time_start', "time_end", '_config_rental_status_id_fk', 'job_name', '_invoice_id_fk', 'contact_phone', 'driver', 'long_term_hire'], where: {
                        [Op.or]: [
                            { date_start: query_date_start, date_end: query_date_end },
                            { date_end: query_date_end }],
                        _company_id_fk: user.company_id,
                        is_deleted: 0
                    },
                    include: { model: ConfigRentalStatus, attributes: [["status_label", "rental_status"]] }
                });
                rental_data = commonchange.transformnames('LTR', rental_data, "Rental", { config_rental_status: "ConfigRentalStatus" })
                response_data['rentals'] = rental_data;
            }
            if (req.body.type && req.body.type.includes('servicecalls')) {
                response_data['service_calls'] = [
                    // {
                    //     "rental_id": 192,
                    //     "date_start": "2021-08-05",
                    //     "date_end": "2021-08-06",
                    //     "due_date": "2021-08-26",
                    //     "contact_phone": "78789798787",
                    //     "company": "Cloudrent",
                    //     "rental_status": "Account"
                    // }
                ];
                var service_data = await Task.findAll({
                    attributes: ["__task_id_pk", "date_start", "date_end", "time_start", "time_end", "resource", "status", "staff_name", "client_name", "company_contact_mobile", "company_contact_phone", "description"],
                    where: {
                        [Op.or]: [
                            { date_start: query_date_start, date_end: query_date_end },
                            { date_end: query_date_end }
                        ],
                        _company_id_fk: user.company_id,
                        is_deleted: 0
                    }
                });
                service_data = commonchange.transformnames('LTR', service_data, "Task")
                response_data['service_calls'] = service_data;
            }
            if (req.body.type && req.body.type.includes('deliveries')) {
                response_data['deliveries'] = [
                    // {
                    //     "rental_id": 192,
                    //     "date_start": "2021-08-05",
                    //     "date_end": "2021-08-06",
                    //     "address_full": "DEL Chennai, 632602-Chennai, India",
                    //     "time_start": "12:35:00",
                    //     "rental_status_id": 0,
                    //     "job_name": "",
                    //     "invoice_id": 0,
                    //     "contact_phone": "78789798787",
                    //     "rental_status": "Account"
                    // }
                ];
                var delivery_data = await Rental.findAll({
                    attributes: ['__rental_id_pk', 'date_start', 'date_end', 'address_full', 'time_start', 'time_end', '_config_rental_status_id_fk', 'job_name', '_invoice_id_fk', 'contact_phone', 'driver', "delivery_date", "long_term_hire"],
                    where: {
                        [Op.or]: [
                            { date_start: query_date_start, date_end: query_date_end },
                            { date_end: query_date_end }],
                        delivery: "yes",
                        _company_id_fk: user.company_id,
                        is_deleted: 0
                    },
                    include: {
                        model: ConfigRentalStatus,
                        attributes: [["status_label", "rental_status"]]
                    }
                });
                delivery_data = commonchange.transformnames('LTR', delivery_data, "Rental", { config_rental_status: "ConfigRentalStatus" })
                for (deladd = 0; deladd < delivery_data.length; deladd++) {
                    if (delivery_data[deladd].address_full) {
                        delivery_data[deladd].address_full = "DEL " + delivery_data[deladd].address_full;
                    }
                }
                response_data['deliveries'] = delivery_data;
            }
            if (req.body.type && req.body.type.includes('collections')) {
                response_data['collections'] = [
                    // {
                    //     "rental_id": 192,
                    //     "date_start": "2021-08-05",
                    //     "date_end": "2021-08-06",
                    //     "address_full": "COL Chennai, 632602-Chennai, India",
                    //     "time_start": "12:35:00",
                    //     "rental_status_id": 0,
                    //     "job_name": "",
                    //     "invoice_id": 0,
                    //     "contact_phone": "78789798787",
                    //     "rental_status": "Account"
                    // }
                ];
                var collection_data = await Rental.findAll(
                    {
                        attributes: ['__rental_id_pk', 'date_start', 'date_end', 'address_full', 'time_start', 'time_end', '_config_rental_status_id_fk', 'job_name', '_invoice_id_fk', 'contact_phone', 'driver', "collection_date", "long_term_hire"],
                        where: {
                            [Op.or]: [
                                { date_start: query_date_start, date_end: query_date_end },
                                { date_end: query_date_end }],
                            collection: "yes",
                            _company_id_fk: user.company_id,
                            is_deleted: 0
                        },
                        include: {
                            model: ConfigRentalStatus,
                            attributes: [["status_label", "rental_status"]]
                        }
                    });
                collection_data = commonchange.transformnames('LTR', collection_data, "Rental", { config_rental_status: "ConfigRentalStatus" })
                for (deladd = 0; deladd < collection_data.length; deladd++) {
                    if (collection_data[deladd].address_full) {
                        collection_data[deladd].address_full = "COL " + collection_data[deladd].address_full;
                    }
                }
                response_data['collections'] = collection_data;
            }
            if (req.body.type && req.body.type.includes('items')) {
                response_data['items'] = [
                    // {
                    //     "rental_id": 192,
                    //     "company": "Cloudrent",
                    //     "rental_type": "QUOTE",
                    //     "lineItem": "Electric Machine 000457 x 6",
                    // }
                ];
                Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
                var items_data = await Rental.findAll({
                    attributes: ['__rental_id_pk', 'date_start', 'date_end', 'time_start', "time_end", '_config_rental_status_id_fk', '_invoice_id_fk', 'long_term_hire'],
                    where: {
                        [Op.or]: [
                            { date_start: query_date_start, date_end: query_date_end },
                            { date_end: query_date_end }],
                        _company_id_fk: user.company_id,
                        is_deleted: 0
                    },
                    include: [{
                        model: ConfigRentalStatus,
                        attributes: [["status_label", "rental_status"]]
                    }, {
                        model: Client,
                        attributes: [["account_name", "company_name"]]
                    }]
                });
                items_data = commonchange.transformnames('LTR', items_data, "Rental", { config_rental_status: "ConfigRentalStatus", client: "Client" })
                if (items_data.length > 0) {
                    for (var itm = 0; itm < items_data.length; itm++) {
                        items_data[itm].lineItem = [];
                        var get_id = items_data[itm].rental_id;
                        var items_get_rental = await RentalItems.findAll({ attributes: ["item", "sku", "qty"], where: { _rental_id_fk: get_id } });
                        items_get_rental = commonchange.transformnames('LTR', items_get_rental, "RentalItems")
                        if (items_get_rental.length > 0) {
                            for (var itm_l = 0; itm_l < items_get_rental.length; itm_l++) {
                                var temp_item = {};
                                temp_item.Item = items_get_rental[itm_l].item + " " + items_get_rental[itm_l].sku + " x " + items_get_rental[itm_l].qty;
                                items_data[itm].lineItem.push(temp_item)
                            }
                        }
                    }
                }

                response_data['items'] = items_data;
            }
            res.status(200).send({ status: true, data: response_data })
        } catch (error) {
            res.status(501).send({ status: false, message: translate('Validation.invalid_data', user.lang) });
        }
    });

    /**
     * @author Bharath
     * @summary This rout is usefull to update the calendar settings
     * @returns Status and message
     */
    fastify.post('/calendar/settings/create', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            var data = req.body;
            data._company_id_fk = user.company_id;
            data._staff_id_fk = user.user_id;
            data.created_by = user.company_id;
            data.created_at = new Date();
            var insert_data = await ConfigCalendar.create(data);
            if (insert_data) {
                var get_calendar_details = await get_calendar(res, user);
                res.status(200).send(get_calendar_details);
            }
            else {
                res.status(500).send({ status: false, message: translate('Validation.record_not_inserted', user.lang) })
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: translate('Validation.invalid_data', user.lang) });
        }
    })
    /**
     * @author Bharath
     * @summary This rout is used for get calendar sttings 
     * @returns Status and calendar settings data
     */
    fastify.get('/calendar/settings/get', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            var get_calendar_details = await get_calendar(res, user);
            res.status(200).send(get_calendar_details);
        }
        catch (e) {
            res.status(501).send({ status: false, message: translate('Validation.invalid_data', user.lang) });
        }
    })
    /**
     * @author Bharath
     * @summary This rout is used for update calendar settings
     * @returns Status and calendar setting data
     */
    fastify.put('/calendar/settings/update', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            var data = req.body;
            data.updated_by = user.company_id;
            var insert_data = await ConfigCalendar.update(data, { where: { _company_id_fk: user.company_id } });
            if (insert_data) {
                var get_calendar_details = await get_calendar(res, user);
                res.status(200).send(get_calendar_details);
            }
            else {
                res.status(500).send({ status: false, message: translate('Validation.record_not_updated', user.lang) })
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: translate('Validation.invalid_data', user.lang) });
        }
    })

    /**
     * @author Kirankumar
     * @summary This rought is used for create or update calender status
     * @return HTTP res
     */
    fastify.post("/calendar/status/update", async (req, res) => {
        try {
            const user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            const data = await calendar_controller.create_update_calender_status(req.body, user, fastify);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (error) {
            res.status(501).send(error);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rought is used for delete calender status
     * @return HTTP res
     */
    fastify.post("/calendar/status/delete", async (req, res) => {
        try {
            const user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            const data = calendar_controller.delete_calendar_status(req.body, user, fastify);
            if ((await data).status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (error) {
            res.status(501).send(data);
        }
    })

    /**
     * @summary This function is used for get the calendar data for company
     * @param {HTTP responds} res 
     * @param {Logged in user data} user 
     * @returns Calendar settings data
     */
    async function get_calendar(res, user) {
        try {
            var get_calendar = await ConfigCalendar.findAll({ raw: true, attributes: ["_company_id_fk", "default_time", "earliest_time", "latest_time", "time_scale", "is_show_weekends", "is_long_term_rentals", "is_compressed_view", "is_fluid_months", "is_show_distance", "breakout_by"], where: { _company_id_fk: user.company_id } })
            get_calendar = commonchange.transformnames('LTR', get_calendar, "ConfigCalendar");
            return { status: true, data: get_calendar }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    }
}
module.exports = CalendarRouter;