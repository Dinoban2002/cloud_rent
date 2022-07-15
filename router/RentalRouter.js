const { Upload, ConfigBusiness, TaxRate, Resource, CreditCardRate, RentalItemSerial, Service, InventoryComponent, Administration, ConfigDefaultRate, Inventory, OffHire, Rental, Client, Address, ConfigRentalStatus, ClientNotes, Auth, RentalItems, SubRent, Payment, Invoice, Rate, InventoryLoss, Return, AssetManagement, Task, InventoryRate, RentalResource, RentalVehicle } = require("../models/Model")(
    ["Upload", "ConfigBusiness", "TaxRate", "Resource", "Service", "CreditCardRate", "RentalItemSerial", "InventoryComponent", "Administration", "Inventory", "ConfigDefaultRate", "OffHire", "Rental", "Client", "Address", "ConfigRentalStatus", "ClientNotes", "Auth", "RentalItems", "SubRent", "Payment", "Invoice", "Rate", "Task", "InventoryLoss", "InventoryRate", "Return", "AssetManagement", "RentalResource", "RentalVehicle"]
);
let handy = require("../config/common");
const lgc = require("../controllers/LogisticsController.js");
const tsc = require("../controllers/TaskServiceController.js");
const client_fields = ["name_full", "account_customer", "account_name", "email", "telephone"];
const address_fields = ["country", "zip", "is_active", "is_billing", "is_delivery"];
const rental_status_fields = ["status_label", "color_code"];
const rental_mandatory = ["flag_record", "status_payment", "status_invoiced", "status_dispatch", "status_overbooked", "use_surcharge"];
const rental_history = ["rental_type", "stepper"];
const stepper_values = { "1": "Quote", "2": "Contract", "3": "Precheck", "7": "Postcheck", "9": "Orderfinalised" }
const { Sequelize, DATE } = require('sequelize');
const Op = Sequelize.Op;
let lang = require('../language/translate').validationMsg;
const sequelizeQuery = require("../config/database");
const pdf = require('../config/pdf');
let moment = require('moment');
const { client } = require("quickemailverification");
const { CompositionSettingsList } = require("twilio/lib/rest/video/v1/compositionSettings");
const auto_update = {
    rental: [
        { call_function: "returns_auto_update", fields: ["unstored_month_length"] },
        { call_function: "rental_item_auto_update", fields: ["client_id"] }
    ],
    rental_item: [
        { call_function: "rental_item_auto_update", fields: ["client_id"] }
    ]
}
async function RentalRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary This rout is usefull to get rental dashboard data
     * @returns status and count data of Rental
     */
    fastify.get('/rental/dashboard', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = {};
            data.total = await Rental.count({ where: { is_deleted: 0, _company_id_fk: user.company_id } });
            //need to make dinamic
            data.myRentals = 200;
            data.balance = 100;
            res.status(200).send({ status: true, data });
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is use full to filter rental data
     * @input kendo filter json
     * @return Status and List of filtered rental data
     */
    fastify.post('/rental/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const condition = await get_rental_data_filters(req, user);
            let res_data = await Rental.findAndCountAll(condition);
            let data = await handy.transformnames('LTR', res_data.rows, "Rental", { client: "Client", address: "Address", config_rental_status: "ConfigRentalStatus" }, user);
            data = data ? data : [];
            if (req.body && req.body.required) {
                data = data.map(item => {
                    for (attr of req.body.required) {
                        if (item[attr] == undefined)
                            item[attr] = "";
                    }
                    return item;
                })
            }
            data = await set_color_codes(data, user.date_format);
            const endRow = await handy.get_end_row(start, limit, res_data.count);
            res.status(200).send({ status: true, count: res_data.count, endRow, data });
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is use full to filter rental data
     * @input kendo filter json
     * @return Status and List of filtered rental data
     */
    fastify.post('/rental/subrent/supplier/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await update_subrent_supplier(req.body, user);
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
     * @summary This rout is use full to create or get serial data for rental item
     * @return Status and data
     */
    fastify.post('/rentalitem/serial/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await rental_item_serial_add(req.body, user);
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
     * @summary This rout is use full to update Rental item serial
     * @return Status and data
     */
    fastify.post('/rentalitem/serial/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await rental_item_serial_update(req.body, user);
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
     * @summary This function is used for update serial for rental item
     * @param {HTTP input} data 
     * @param {Logged in user details} user 
     * @return Status and data
     */
    async function rental_item_serial_update(data, user) {
        if (data.rental_item_serial_id) {
            let rental_item_serials = await RentalItemSerial.findOne({ attributes: ["_rental_item_id_fk", "asset_no", "is_added"], where: { __rental_item_serial_id_pk: data.rental_item_serial_id } });
            if (rental_item_serials) {
                if (data.asset_no) {
                    await RentalItemSerial.update({ asset_no: data.asset_no }, { where: { __rental_item_serial_id_pk: data.rental_item_serial_id } });
                    return { status: true, data }
                } else if (data.is_added) {
                    if (rental_item_serials.is_added == 0) {
                        let update_data = { is_added: 1 };
                        let item_name = "";
                        if (rental_item_serials._rental_item_id_fk) {
                            const item = await RentalItems.findOne({ attributes: ["item"], where: { __rental_item_id_pk: rental_item_serials._rental_item_id_fk } });
                            if (item) {
                                item_name = item.item + " | " + rental_item_serials.asset_no;
                                await RentalItems.update({ item: item_name }, { where: { __rental_item_id_pk: rental_item_serials._rental_item_id_fk } });
                            }
                        }
                        await RentalItemSerial.update(update_data, { where: { __rental_item_serial_id_pk: data.rental_item_serial_id } });
                        update_data.rental_item_serial_id = data.rental_item_serial_id;
                        return { status: true, alert: lang('Validation.serial_add_success'), data: update_data, item_name }
                    } else {
                        return { status: true, alert: lang('Validation.serial_add_alert', user.lang) }
                    }
                } else {
                    return { status: false, message: lang('Validation.invalid_data', user.lang) };
                }
            } else {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }

        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }



    /**
     * @author Kirankumar
     * @summary This function is used for add serial number for rental item.
     * @param {HTTP Input data} data 
     * @param {Logged in user details} user 
     * @returns Json Status and data
     */
    async function rental_item_serial_add(data, user) {
        const attributes = ["__rental_item_serial_id_pk", "_rental_item_id_fk", "_inventory_id_fk", "_rental_id_fk", "asset_no", "sequence_number", "is_added"];
        if (data.rental_item_id) {
            const rental_item = await RentalItems.findOne({ where: { __rental_item_id_pk: data.rental_item_id } })
            if (rental_item) {
                let rental_item_serials = await RentalItemSerial.findAll({ attributes, where: { _rental_item_id_fk: data.rental_item_id } });
                if (rental_item_serials.length == 0) {
                    if (rental_item.qty) {
                        let serial_items = [];
                        for (let i = 1; rental_item.qty >= i; i++) {
                            let serial_data = {
                                _rental_id_fk: rental_item._rental_id_fk,
                                _rental_item_id_fk: rental_item.__rental_item_id_pk,
                                _inventory_id_fk: rental_item._inventory_id_fk,
                                sequence_number: i,
                                is_added: 0,
                                asset_no: ""
                            }
                            serial_items.push(serial_data);
                        }
                        let data = await RentalItemSerial.bulkCreate(serial_items);
                        data = await handy.transformnames("LTR", data, "RentalItemSerial");
                        return { status: true, data };
                    } else {
                        return { status: true, data: [] };
                    }
                } else {
                    if (rental_item.qty > rental_item_serials.length) {
                        let serial_count = rental_item_serials.length;
                        if (data.confirmation == 1) {
                            let serial_items = [];
                            for (let i = serial_count; rental_item.qty > i; i++) {
                                let serial_data = {
                                    _rental_id_fk: rental_item._rental_id_fk,
                                    _rental_item_id_fk: rental_item.__rental_item_id_pk,
                                    _inventory_id_fk: rental_item._inventory_id_fk,
                                    sequence_number: ++serial_count,
                                    is_added: 0,
                                    asset_no: ""
                                }
                                serial_items.push(serial_data);
                            }
                            await RentalItemSerial.bulkCreate(serial_items);
                            let get_data = await RentalItemSerial.findAll({ attributes, where: { _rental_item_id_fk: data.rental_item_id } });
                            get_data = await handy.transformnames("LTR", get_data, "RentalItemSerial");
                            return { status: true, data: get_data };
                        } else {
                            return { status: true, confirmation: lang('Validation.serial_confirm', user.lang) }
                        }
                    } else {
                        //let rental_item_serials = await RentalItemSerial.findAll({ where: { _rental_item_id_fk: data.rental_item_id } });
                        rental_item_serials = await handy.transformnames("LTR", rental_item_serials, "RentalItemSerial");
                        return { status: true, data: rental_item_serials };
                    }
                }
            } else {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used for update the supplier for all subrent.
     * @param {HTTP request data} body 
     * @param {Logged in user details} user
     * @returns Updated subrents list. 
     */
    async function update_subrent_supplier(body, user) {
        if (body && body.rental_id) {
            const subrents_data = await SubRent.findOne({
                raw: true,
                attributes: ["id_supplier", "supplier"],
                where: { _rental_id_fk: body.rental_id },
                order: [["__sub_rent_id_pk", "ASC"]]
            })
            if (subrents_data && subrents_data.id_supplier) {
                await SubRent.update(subrents_data, {
                    where: { _rental_id_fk: body.rental_id },
                })
                return { status: true, data: subrents_data };
            } else {
                return { status: true, alert: lang('Validation.subrent_supplier_alert', user.lang) };
            }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }


    /**
     * @author Kirankumar
     * @summary This rout is use full to filter rental data
     * @input kendo filter json
     * @return Status and List of filtered rental data
     */
    fastify.post('/rental/excel/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await get_rental_excel_subitems(req, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }

    })
    /*
    * @summary This rout is use full to filter rental data
    * @input kendo filter json
    * @return Status and List of filtered rental data
    */
    fastify.post('/rental/pdf/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await get_rental_pdf_subitems(req, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }

    })

    fastify.post('/bulk/pdf/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await get_bulk_pdf(req, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message });
        }
    })


    /**
     * @author Kirankumar
     * @summary This rout is use full get sub rentals for rental.
     * @input {Rental ID} rental_id
     * @return Status and List of sub rental data
     */
    fastify.get('/rental/subrent/get/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.rental_id) {
                SubRent.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk' });
                let data = await SubRent.findAll({
                    attributes: { exclude: ["is_deleted", "created_by", "updated_by", "created_at", "updated_at"] }, where: { _rental_id_fk: req.params.rental_id }, include: {
                        model: Rental,
                        attributes: ["period_no"]
                    }
                });
                data = await handy.transformnames('LTR', data, "SubRent", { rental: "Rental" }, user) || [];
                res.status(200).send({ status: true, data })
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) })
            }
        } catch (e) {
            res.status(501).send(e);
        }

    })

    /**
     * @author Kirankumar
     * @summary This rout is use full for delete the sub rental.
     * @input {Sub Rental ID} rental_id
     * @return Status and List of sub rental data
     */
    fastify.delete('/rental/subrent/delete/:sub_rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.sub_rental_id) {
                const count = await SubRent.count({ where: { __sub_rent_id_pk: req.params.sub_rental_id } });
                if (count) {
                    await SubRent.destroy({ where: { __sub_rent_id_pk: req.params.sub_rental_id } });
                    res.status(200).send({ status: false, message: lang('Validation.record_deleted', user.lang) })
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) })
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) })
            }
        } catch (e) {
            res.status(501).send(e);
        }

    })


    /**
     * @author Kirankumar
     * @summary This function is used for get excel file for filtered rentals
     * @param {HTTP request} req 
     * @param {Logged in user details} user
     * @returns Json 
     */
    async function get_rental_excel_subitems(req, user) {
        let return_data = {};
        const date_format = "DD-MM-YYYY";
        const condition = await get_rental_data_filters(req, user);
        condition.attributes = ["__rental_id_pk"];
        let res_data = await Rental.findAll(condition);
        let order = "";
        if (condition.order.length) {
            order = condition.order;
        } else {
            order = [['__rental_id_pk', 'ASC']];
        }
        let ids = [];
        if (res_data.length) {
            ids = res_data.map(id => id.__rental_id_pk);
        }
        let data = [];
        //To make header bold in excel
        let styles = {
            headerDark: {
                font: {
                    bold: true
                }
            },
            italic: {
                font: {
                    italic: true
                }
            }
        };
        if (req.body && req.body.type == "include_items" && ids) {
            Rental.belongsTo(RentalItems, { targetKey: '_rental_id_fk', foreignKey: '__rental_id_pk' });
            Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
            order = [['__rental_id_pk', 'ASC'], [RentalItems, "sort", "ASC"]];
            const get_data = await Rental.findAll({
                where: {
                    "__rental_id_pk": ids
                },
                order,
                include: [{
                    model: RentalItems
                },
                {
                    model: Client,
                    attributes: ["account_name"]
                }]
            });
            for (item of get_data) {
                const rental_item = item.rental_item || {};
                data.push({
                    "Rentals::Invoice ID": item.__rental_id_pk,
                    "Rentals::Company": item.client ? item.client.account_name : "",
                    "Item": rental_item.item || "",
                    "Qty": rental_item.qty || 0,
                    "Balance": rental_item.balance || 0,
                    "Rentals::Date": moment(item.date_start, date_format).isValid() ? moment(item.date_start).format(date_format) : " ",
                    "Rentals::DateEnd": moment(item.date_end, date_format).isValid() ? moment(item.date_end).format(date_format) : " ",
                    "Delivery Address": item.delivery_address,
                    "Rentals::OffHireDate": moment(item.off_hire_date, date_format).isValid() ? moment(item.off_hire_date).format(date_format) : " ",
                    "isReocurring": rental_item.is_re_occur,
                    "parent_id": rental_item._rental_item_id_fk,
                });
            }
            let excel_data = [{
                sheet: "Booking Item Report",
                content: data,
                columns: {
                    "Rentals::Invoice ID": {
                        displayName: 'Rentals::Invoice ID', // <- Here you specify the column header
                        headerStyle: styles.headerDark, // <- Header style
                        width: 120 // <- width in pixels
                    },
                    "Rentals::Company": {
                        displayName: 'Rentals::Company',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Item": {
                        displayName: 'Item',
                        headerStyle: styles.headerDark,
                        width: 120,
                        cellStyle: function (value, row) { // <- style renderer function
                            if (row.parent_id) {
                                return styles.italic;
                            } else {
                                return {};
                            }
                        }
                    },
                    "Qty": {
                        displayName: 'Qty',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Balance": {
                        displayName: 'Balance',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Rentals::Date": {
                        displayName: 'Rentals::Date',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Rentals::DateEnd": {
                        displayName: 'Rentals::DateEnd',
                        headerStyle: styles.headerDark,
                        width: 200
                    },
                    "Delivery Address": {
                        displayName: 'Delivery Address',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Rentals::OffHireDate": {
                        displayName: 'Rentals::OffHireDate',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "isReocurring": {
                        displayName: 'isReocurring',
                        headerStyle: styles.headerDark,
                        width: 120
                    }
                }
            }];
            return_data = await handy.create_excel_file(excel_data, {}, user, "Items in the Job");
        } else if (req.body.type == "job_details") {
            Rental.belongsTo(ConfigRentalStatus, { targetKey: '__config_rental_status_id_pk', foreignKey: '_config_rental_status_id_fk', })
            Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
            const get_data = await Rental.findAll({
                where: {
                    "__rental_id_pk": ids
                },
                order,
                include: [{
                    model: ConfigRentalStatus,
                    attributes: ["status_label"]
                },
                {
                    model: Client,
                    attributes: ["account_name"]
                }]
            });
            for (item of get_data) {
                const rental_item = item.rental_item || {};
                const items = await RentalItems.findAll({
                    attributes: [
                        [Sequelize.fn("CONCAT", Sequelize.col('qty'), ' x ', Sequelize.col('item')), "item"], "commission_cost"
                    ], where: { _rental_id_fk: item.__rental_id_pk }
                });
                let rental_item_data = "";
                let commission_cost = 0;
                for (item_key in items) {
                    commission_cost += parseFloat(items[item_key].commission_cost);
                    if (items[item_key].item) {
                        rental_item_data += items[item_key].item;
                        if (items.length - 1 > item_key) {
                            rental_item_data += " | ";
                        }
                    }
                }
                data.push({
                    "Invoice ID": item.__rental_id_pk,
                    "Company": item.client && item.client.account_name ? item.client.account_name : '',
                    "Date": moment(item.date_start, date_format).isValid() ? moment(item.date_start).format(date_format) : " ",
                    "DateEnd": moment(item.date_end, date_format).isValid() ? moment(item.date_end).format(date_format) : " ",
                    "Total": item.total,
                    "Balance": item.balance,
                    "Rentals::Delivery Address": item.delivery_address,
                    "Delivery Date": moment(item.delivery_date, date_format).isValid() ? moment(item.delivery_date).format(date_format) : " ",
                    "Delivery Notes": item.delivery_notes,
                    "Status": item["config_rental_status"] ? item["config_rental_status"]["status_label"] || "" : "",
                    "CommissionCost": commission_cost,
                    "unstored_rentalItemList": rental_item_data
                });
            }
            let excel_data = [{
                sheet: "Booking Item Report",
                content: data,
                columns: {
                    "Invoice ID": {
                        displayName: 'Invoice ID', // <- Here you specify the column header
                        headerStyle: styles.headerDark, // <- Header style
                        width: 120, // <- width in pixels
                    },
                    "Company": {
                        displayName: 'Company',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Date": {
                        displayName: 'Date',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "DateEnd": {
                        displayName: 'DateEnd',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Total": {
                        displayName: 'Total',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Balance": {
                        displayName: 'Balance',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Rentals::Delivery Address": {
                        displayName: 'Rentals::Delivery Address',
                        headerStyle: styles.headerDark,
                        width: 250
                    },
                    "Delivery Date": {
                        displayName: 'Delivery Date',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Delivery Notes": {
                        displayName: 'Delivery Notes',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Status": {
                        displayName: 'Status',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "CommissionCost": {
                        displayName: 'CommissionCost',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "unstored_rentalItemList": {
                        displayName: 'unstored_rentalItemList',
                        headerStyle: styles.headerDark,
                        width: 250
                    }
                }
            }];
            return_data = await handy.create_excel_file(excel_data, {}, user, "Job Details");
        } else {
            // Rental.belongsTo(SubRent, { targetKey: '_rental_id_fk', foreignKey: '__rental_id_pk' });
            // Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
            Rental.belongsTo(SubRent, { targetKey: '_rental_id_fk', foreignKey: '__rental_id_pk' });
            Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
            const get_data = await Rental.findAll({
                where: {
                    "__rental_id_pk": ids
                },
                include: [{
                    model: SubRent,
                },
                {
                    model: Client,
                    attributes: ["account_name", "telephone"]
                }
                ]
            });
            for (item of get_data) {
                const rental_item = item.sub_rent;
                if (rental_item)
                    data.push({
                        "Rentals::Invoice ID": item.__rental_id_pk,
                        "Rentals::Date": moment(item.date_start, date_format).isValid() ? moment(item.date_start).format(date_format) : " ",
                        "Rentals::Delivery Date": moment(item.delivery_date, date_format).isValid() ? moment(item.delivery_date).format(date_format) : " ",
                        "Item": rental_item.item || "",
                        "id_LineItem": rental_item.__sub_rent_id_pk,
                        "SKU": rental_item.sku,
                        "Qty": rental_item.qty || 0,
                        "Rentals::Company": item.client.account_name,
                        "Rentals::CompanyContactPhone": item.client.telephone,
                        "Supplier": rental_item.supplier || "",
                        "Status": rental_item.status,
                        "Comments": rental_item.comments || "",
                        "Rentals::Delivery Address": item.delivery_address,
                        "id ParentItem": rental_item.id_parent_item,
                    });
            }
            let excel_data = [{
                sheet: "Booking Item Report",
                content: data,
                columns: {
                    "Rentals::Invoice ID": {
                        displayName: 'Rentals::Invoice ID', // <- Here you specify the column header
                        headerStyle: styles.headerDark, // <- Header style
                        width: 120 // <- width in pixels
                    },
                    "Rentals::Date": {
                        displayName: 'Rentals::Date',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Rentals::Delivery Date": {
                        displayName: 'Rentals::Delivery Date',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "id_LineItem": {
                        displayName: 'id_LineItem',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Qty": {
                        displayName: 'Qty',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "SKU": {
                        displayName: 'SKU',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Item": {
                        displayName: 'Item',
                        headerStyle: styles.headerDark,
                        width: 200
                    },
                    "Rentals::Company": {
                        displayName: 'Rentals::Company',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Rentals::CompanyContactPhone": {
                        displayName: 'Rentals::CompanyContactPhone',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Supplier": {
                        displayName: 'Supplier',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Status": {
                        displayName: 'Status',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "Comments": {
                        displayName: 'Comments',
                        headerStyle: styles.headerDark,
                        width: 200
                    },
                    "Rentals::Delivery Address": {
                        displayName: 'Rentals::Delivery Address',
                        headerStyle: styles.headerDark,
                        width: 120
                    },
                    "id ParentItem": {
                        displayName: 'id ParentItem',
                        headerStyle: styles.headerDark,
                        width: 200
                    }
                }
            }];
            return_data = await handy.create_excel_file(excel_data, {}, user, "Sub Rentals");
        }
        return { status: true, data: return_data };
    }
    /**
   * @author JoysanJawahar
   * @summary This function is used for update the multiple resource to the Task
   * @param {HTTP input data} data 
   * @param {Logged in user details} user 
   * @return status and data
   */
    async function add_resource_to_rental(data, user) {
        if (data && data.rental_id && data.resource_ids && data.resource_ids.length) {
            const _rental_id_fk = data.rental_id;
            const _company_id_fk = user.company_id;
            const rental_resource_data = data.resource_ids.map(_resource_id_fk => ({
                _resource_id_fk,
                _rental_id_fk,
                _company_id_fk,
                created_by: user.user_id,
                created_at: new Date()
            }));
            await RentalResource.bulkCreate(rental_resource_data);
            const res_data = await get_rental_resource(data.rental_id, user);
            return { status: true, data: res_data };
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }
    /**
   * @author JoysanJawahar
   * @summary This function is used for update the multiple resource to the rental
   * @param {HTTP input data} data 
   * @param {Logged in user details} user 
   * @return status and data
   */
    async function add_vehicle_to_rental(data, user) {
        if (data && data.rental_id && data.vehicle_ids && data.vehicle_ids.length) {
            const _rental_id_fk = data.rental_id;
            const _company_id_fk = user.company_id;
            const rental_vehicle_data = data.vehicle_ids.map(_resource_id_fk => ({
                _resource_id_fk,
                _rental_id_fk,
                _company_id_fk,
                created_by: user.user_id,
                created_at: new Date()
            }));
            await RentalVehicle.bulkCreate(rental_vehicle_data);
            const res_data = await get_rental_vehicle(data.rental_id, user);
            return { status: true, data: res_data };
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }
    /**
   * @author JoysanJawahar
   * @summary This function is used for get the rental resources
   * @param {Rental id} rental_id 
   * @param {Logged in user details} user 
   * @returns array of task resource list
   */
    async function get_rental_resource(rental_id, user) {
        RentalResource.belongsTo(Resource, { targetKey: '__resource_id_pk', foreignKey: '_resource_id_fk' });
        let data = await RentalResource.findAll({
            attributes: { exclude: ["created_by", "created_at"] }, where: { _rental_id_fk: rental_id, _company_id_fk: user.company_id }, include: {
                model: Resource,
                attributes: ["name", "mobile"]
            }
        });
        data = await handy.transformnames("LTR", data, "RentalResource", { resource: "Resource" }, user);
        return data || [];
    }
    /**
     * @author JoysanJawahar
     * @summary This function is used for get the rental vahicles
     * @param {rental id} rental_id 
     * @param {Logged in user details} user 
     * @returns array of task resource list
     */
    async function get_rental_vehicle(rental_id, user) {
        RentalVehicle.belongsTo(Resource, { targetKey: '__resource_id_pk', foreignKey: '_resource_id_fk' });
        let data = await RentalVehicle.findAll({
            attributes: { exclude: ["created_by", "created_at"] }, where: { _rental_id_fk: rental_id, _company_id_fk: user.company_id }, include: {
                model: Resource,
                attributes: ["name"]
            }
        });
        data = await handy.transformnames("LTR", data, "RentalVehicle", { resource: "Resource" }, user);
        return data || [];
    }
    /**
   * @author JoysanJawahar
   * @summary This function is used for delete the rental resources
   * @param {Rental Resource id} Rental_resource_id 
   * @param {Logged in user details} user 
   * @returns status and message
   */
    async function delete_rental_resource(rental_resource_id, user) {
        if (rental_resource_id) {
            let count = await RentalResource.count({ where: { __rental_resource_id_pk: rental_resource_id, _company_id_fk: user.company_id } });
            if (count) {
                let deleted_count = await RentalResource.destroy({ where: { __rental_resource_id_pk: rental_resource_id, _company_id_fk: user.company_id } });
                if (deleted_count) {
                    return { status: true, message: lang('Validation.record_deleted', user.lang) };
                } else {
                    return { status: false, message: lang('Validation.record_not_deleted', user.lang) };
                }
            } else {
                return { status: false, message: lang('Validation.record_not_exist', user.lang) };
            }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }
    /**
     * @author JoysanJawahar
     * @summary This function is used for delete the rental vehicle
     * @param {Rental Vehicle id} rental_vehicle_id
     * @param {Logged in user details} user 
     * @returns status and message
     */
    async function delete_rental_vehicle(rental_vehicle_id, user) {
        if (rental_vehicle_id) {
            let count = await RentalVehicle.count({ where: { __rental_vehicle_id_pk: rental_vehicle_id, _company_id_fk: user.company_id } });
            if (count) {
                let deleted_count = await RentalVehicle.destroy({ where: { __rental_vehicle_id_pk: rental_vehicle_id, _company_id_fk: user.company_id } });
                if (deleted_count) {
                    return { status: true, message: lang('Validation.record_deleted', user.lang) };
                } else {
                    return { status: false, message: lang('Validation.record_not_deleted', user.lang) };
                }
            } else {
                return { status: false, message: lang('Validation.record_not_exist', user.lang) };
            }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }
    /**
     * @author Anik
     * @summary This function is used for get pdf file for filtered rentals
     * @param {HTTP request} req 
     * @param {Logged in user details} user
     * @returns Json 
     */
    async function get_rental_pdf_subitems(req, user) {
        let data_admin = await Administration.findOne({ attributes: ["company_name", "pdf_date_format", "trading_as", "checkbox_use_trading_name", "bank_account_number", "bank_account_bsb", "bank_account_name", "bank_name", "credit_cards_yes_no", "postal_code_shipping", "state_shipping", "city_shipping", "address_1_shipping", "postal_code", "state", "city", "address_1", "office_phone", "office_email", "country", "company_number"], where: { __administration_id_pk: user.company_id } })

        let return_data = {};
        const condition = await get_rental_data_filters(req, user);
        condition.attributes = ["__rental_id_pk"];
        let res_data = await Rental.findAll(condition);
        let ids = [];
        if (res_data.length) {
            ids = res_data.map(id => id.__rental_id_pk);
        }
        let data = [];
        if (req.body && req.body.type == "include_items" && ids) {
            // Items in the job
            Rental.belongsTo(RentalItems, { targetKey: '_rental_id_fk', foreignKey: '__rental_id_pk' });
            const get_data = await Rental.findAll({
                where: {
                    "__rental_id_pk": ids
                },
                include: {
                    model: RentalItems
                }
            });

            // take necessary data into an array
            for (item of get_data) {
                const rental_item = item.rental_item || {};
                if (Object.keys(rental_item).length > 0) {
                    data.push({
                        rentalId: item.__rental_id_pk,
                        rentalCompany: item.company,
                        item: rental_item.item || "",
                        qty: rental_item.qty || 0,
                        sku: rental_item.sku,
                        balance: rental_item.balance || 0,
                        rentalDate: moment(item.date, "DD-MM-YYYY").isValid() ? moment(item.date).format("DD-MM-YYYY") : item.date,
                        rentalDeliveryDate: moment(item.date_end, "DD-MM-YYYY").isValid() ? moment(item.date).format("DD-MM-YYYY") : item.date_end,
                        rentalDeliveryAddress: item.delivery_address,
                        rentalOffHireDate: item.off_hire_date == "0000-00-00" ? "" : item.off_hire_date,
                        isReocurring: rental_item.is_re_occur
                    });
                }
            }

            // Get unique sku name from whole data
            let uniqueItemName = [
                ...new Set(data.map((item) => item.sku)),
            ];
            // Filter sku array without null value
            uniqueItemName = uniqueItemName.filter(element => {
                return element !== null;
            });

            let finalArray = [];
            uniqueItemName.map(async (unqSku) => {
                let localObj = {};
                let filterDt = data.filter((dt) => dt.sku == unqSku).map((value) => value)
                localObj.sku = unqSku;
                localObj.itemName = filterDt[0].item;
                localObj.tableDt = filterDt;
                finalArray.push(localObj);
            })

            return_data = await pdf.create_pdf_file(finalArray, {}, user, "Items in the Job", "include_items", req.body, data_admin);
        } else {
            // Sub rental
            Rental.belongsTo(RentalItems, { targetKey: '_rental_id_fk', foreignKey: '__rental_id_pk' });
            const get_data = await Rental.findAll({
                where: {
                    "__rental_id_pk": ids
                },
                include: {
                    model: RentalItems
                }
            });

            // take necessary data into an array
            for (item of get_data) {
                const rental_item = item.rental_item || {};
                if (Object.keys(rental_item).length > 0) {
                    data.push({
                        rentalId: item.__rental_id_pk,
                        rentalDate: moment(item.date, "DD-MM-YYYY").isValid() ? moment(item.date).format("DD-MM-YYYY") : item.date,
                        rentalDeliveryDate: moment(item.delivery_date, "DD-MM-YYYY").isValid() ? moment(item.delivery_date).format("DD-MM-YYYY") : item.delivery_date,
                        item: rental_item.item || "",
                        idLineItem: rental_item.__rental_item_id_pk,
                        sku: rental_item.sku,
                        qty: rental_item.qty || 0,
                        rentalCompany: item.company,
                        rentalCompanyContactPhone: item.company_contact_phone,
                        supplier: rental_item.supplier || "",
                        status: rental_item.status,
                        comments: rental_item.comments || "",
                        rentalDeliveryAddress: item.delivery_address,
                        idParentItem: rental_item._rental_item_id_fk,
                        bin_no: rental_item.bin_no || "",
                        location: rental_item.location || "",
                    });
                }
            }

            // Get unique sku name from whole data
            let uniqueItemName = [
                ...new Set(data.map((item) => item.sku)),
            ];
            // Filter sku array without null value
            uniqueItemName = uniqueItemName.filter(element => {
                return element !== null;
            });

            let finalArray = [];
            uniqueItemName.map(async (unqSku) => {
                let localObj = {};
                let filterDt = data.filter((dt) => dt.sku == unqSku).map((value) => value)
                localObj.sku = unqSku;
                localObj.itemName = filterDt[0].item;
                localObj.tableDt = filterDt;
                finalArray.push(localObj);
            })

            return_data = await pdf.create_pdf_file(finalArray, {}, user, "Sub Rentals", "sub_rental", req.body, data_admin);
        }
        return { status: true, data: return_data };
    }

    /**
     * @author Anik
     * @summary This function is used for get pdf file for filtered rentals
     * @param {HTTP request} req 
     * @param {Logged in user details} user
     * @returns Json 
     */
    async function get_rental_pdf_subitems(req, user) {
        let data_admin = await Administration.findOne({ attributes: ["company_name", "pdf_date_format", "trading_as", "checkbox_use_trading_name", "bank_account_number", "bank_account_bsb", "bank_account_name", "bank_name", "credit_cards_yes_no", "postal_code_shipping", "state_shipping", "city_shipping", "address_1_shipping", "postal_code", "state", "city", "address_1", "office_phone", "office_email", "country", "company_number"], where: { __administration_id_pk: user.company_id } })

        let return_data = {};
        const condition = await get_rental_data_filters(req, user);
        condition.attributes = ["__rental_id_pk"];
        let res_data = await Rental.findAll(condition);
        let ids = [];
        if (res_data.length) {
            ids = res_data.map(id => id.__rental_id_pk);
        }
        let data = [];
        if (req.body && req.body.type == "include_items" && ids) {
            // Items in the job
            let client_get = ["account_name", "telephone"];
            Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
            Rental.belongsTo(RentalItems, { targetKey: '_rental_id_fk', foreignKey: '__rental_id_pk' });
            const get_data = await Rental.findAll({
                where: {
                    "__rental_id_pk": ids
                },
                include: [
                    { model: RentalItems },
                    { model: Client, attributes: client_get }
                ]
            });

            // take necessary data into an array
            for (item of get_data) {
                const rental_item = item.rental_item || {};
                const client_details = item.client || {};
                if (Object.keys(rental_item).length > 0) {
                    data.push({
                        rentalId: item.__rental_id_pk,
                        rentalCompany: item.company,
                        item: rental_item.item || "",
                        qty: rental_item.qty || 0,
                        sku: rental_item.sku,
                        balance: rental_item.balance || 0,
                        rentalDate: moment(item.date, "DD-MM-YYYY").isValid() ? moment(item.date).format("DD-MM-YYYY") : item.date,
                        rentalDeliveryDate: moment(item.date_end, "DD-MM-YYYY").isValid() ? moment(item.date).format("DD-MM-YYYY") : item.date_end,
                        rentalDeliveryAddress: item.delivery_address,
                        rentalOffHireDate: item.off_hire_date == "0000-00-00" ? "" : item.off_hire_date,
                        isReocurring: rental_item.is_re_occur,
                        rentalCompanyContactPhone: client_details.telephone || "",
                        supplier: client_details.account_name || "",
                    });
                }
            }

            // Get unique sku name from whole data
            let uniqueItemName = [
                ...new Set(data.map((item) => item.sku)),
            ];
            // Filter sku array without null value
            uniqueItemName = uniqueItemName.filter(element => {
                return element !== null;
            });

            let finalArray = [];
            uniqueItemName.map(async (unqSku) => {
                let localObj = {};
                let filterDt = data.filter((dt) => dt.sku == unqSku).map((value) => value)
                localObj.sku = unqSku;
                localObj.itemName = filterDt[0].item;
                localObj.tableDt = filterDt;
                finalArray.push(localObj);
            })

            return_data = await pdf.create_pdf_file(finalArray, {}, user, "Items in the Job", "include_items", req.body, data_admin);
        } else {
            // Sub rental
            let client_get = ["account_name", "telephone"];
            Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
            // Rental.belongsTo(RentalItems, { targetKey: '_rental_id_fk', foreignKey: '__rental_id_pk' });
            const get_rental_data = await Rental.findAll({
                attributes: ["__rental_id_pk"],
                where: {
                    "__rental_id_pk": ids
                },
                include: [
                    { model: Client, attributes: client_get }
                ]
            });
            const get_data = await SubRent.findAll({
                attributes: { exclude: ["is_deleted", "created_by", "updated_by", "created_at", "updated_at"] },
                where: {
                    "_rental_id_fk": ids
                }
            });
            // data = await handy.transformnames('LTR', data, "SubRent", {}, user) || [];
            let sub_rental_arr = [];
            if (get_rental_data) {
                get_rental_data.map((dt) => {
                    get_data.map((item) => {
                        if (dt.__rental_id_pk == item._rental_id_fk) {
                            sub_rental_arr.push({
                                rentalId: dt.__rental_id_pk,
                                date: item?.use_date || "",
                                del_date: item?.received_date || "",
                                qty: item?.qty || "",
                                item: item?.item || "",
                                client_name: dt.client.account_name || "",
                                supplier_name: item?.supplier || "",
                                sent_date: item.sent_date,
                            })
                        }
                    });
                });
            }

            // // take necessary data into an array
            // for (item of get_data) {
            //     const rental_item = item.rental_item || {};
            //     const client_detail = item.client || {};
            //     if (Object.keys(rental_item).length > 0) {
            //         data.push({
            //             rentalId: item.__rental_id_pk,
            //             rentalDate: moment(item.date, "DD-MM-YYYY").isValid() ? moment(item.date).format("DD-MM-YYYY") : item.date,
            //             rentalDeliveryDate: moment(item.delivery_date, "DD-MM-YYYY").isValid() ? moment(item.delivery_date).format("DD-MM-YYYY") : item.delivery_date,
            //             item: rental_item.item || "",
            //             idLineItem: rental_item.__rental_item_id_pk,
            //             sku: rental_item.sku,
            //             qty: rental_item.qty || 0,
            //             rentalCompany: item.company,
            //             rentalCompanyContactPhone: client_detail.telephone || "", //item.company_contact_phone,
            //             supplier: client_detail.account_name || "", //rental_item.supplier
            //             status: rental_item.status,
            //             comments: rental_item.comments || "",
            //             rentalDeliveryAddress: item.delivery_address,
            //             idParentItem: rental_item._rental_item_id_fk,
            //             bin_no: rental_item.bin_no || "",
            //             location: rental_item.location || "",
            //         });
            //     }
            // }

            // // Get unique sku name from whole data
            // let uniqueItemName = [
            //     ...new Set(data.map((item) => item.sku)),
            // ];
            // // Filter sku array without null value
            // uniqueItemName = uniqueItemName.filter(element => {
            //     return element !== null;
            // });

            // let finalArray = [];
            // uniqueItemName.map(async (unqSku) => {
            //     let localObj = {};
            //     let filterDt = data.filter((dt) => dt.sku == unqSku).map((value) => value)
            //     localObj.sku = unqSku;
            //     localObj.itemName = filterDt[0].item;
            //     localObj.tableDt = filterDt;
            //     finalArray.push(localObj);
            // })

            return_data = await pdf.create_pdf_file(sub_rental_arr, {}, user, "Sub Rentals", "sub_rental", req.body, data_admin);
        }
        return { status: true, data: return_data };
    }


    /**
     * @author Anik
     * @summary this function is used to get bulk pdfs for checklist
     * @input {HTTP request}
     * @return Status and pdf {ref_id,file_name}
     */
    async function get_bulk_pdf(req, user) {
        const condition = await get_rental_data_filters(req, user);
        condition.attributes = ["__rental_id_pk"];
        let res_data = await Rental.findAll(condition);
        let ids = [];
        if (res_data.length) {
            ids = res_data.map(id => id.__rental_id_pk);
        }
        let data = [];
        data = req.body;
        if (Array.isArray(ids)) {
            let unresolvedPromises = [];
            for (rental_id in ids) {
                let data_admin = await Administration.findOne({ attributes: ["company_name", "colour_palette", "pdf_date_format", "trading_as", "checkbox_use_trading_name", "bank_account_number", "bank_account_bsb", "bank_account_name", "bank_name", "credit_cards_yes_no", "currency", "postal_code_shipping", "state_shipping", "city_shipping", "address_1_shipping", "postal_code", "state", "city", "address_1", "office_phone", "office_email", "country", "company_number", "no_show_unit_price"], where: { __administration_id_pk: user.company_id } })
                if (req?.body?.action == "checklist") {
                    if (!ids[rental_id]) {
                        return { status: false, message: lang('Validation.invalid_data', user.lang) };
                    }
                    data.admin = data_admin; //send pdf_date_format
                    let rental_data_res = await handy.getDetailByRentalId(ids[rental_id], user);
                    data.rental_data = rental_data_res;
                    if (data.rental_data && Object.keys(data.rental_data).length > 0) {
                        if (rental_data_res?.item?.length > 0 && rental_data_res?.print_type == "CHECKLIST") {
                            console.log("this is rental_data_res------>", rental_data_res?.print_type);
                            unresolvedPromises.push(await pdf.print_statement(data, user));
                        }
                    } else {
                        return { status: false, message: lang('Validation.record_not_found', user.lang) };
                    }
                }
            }
            const result = pdf.create_zip_file(unresolvedPromises, user);
            return result;
        }
    }

    /**
     * @author Kirankumar
     * @summary This rout is use full to create or get rental item services
     * @input {HTTP request}
     * @return Status and List of rental item service data
     */
    fastify.post('/rental/item/service/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await get_rental_item_service(req.body, user);
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
     * @summary This rout is usefull to get resource and vehicle list for rental
     * @input {HTTP request}
     * @return Status and List of rental resource and vehicle list
     */
    fastify.get('/rental/resource/get/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await lgc.get_rental_driver_vehicles(req.params, user);
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
     * @author JoysanJawahar
     * @summary This rout is usefull to get resource and vehicle list for rental
     * @input {HTTP request}
     * @return Status and List of rental resource and vehicle list
     */
    fastify.get('/rental/resource_vehicle/get/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await lgc.get_rental_resource_driver_vehicles(req.params, user);
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
     * @author JoysanJawahar
     * @summary This rout is usefull to add resource for rental
     * @return Status and List of added data
     */
    fastify.post('/rental/resource/add', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await add_resource_to_rental(req.body, user);
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
     * @author JoysanJawahar
     * @summary This rout is usefull to add vehicle for rental
     * @return Status and List of added data
     */
    fastify.post('/rental/vehicle/add', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await add_vehicle_to_rental(req.body, user);
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
     * @author JoysanJawahar
     * @summary This rout is used for delete the rental resource item
     * @returns Status and message
     */
    fastify.delete('/rental/resource/delete/:rental_resource_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.rental_resource_id) {
                const data = await delete_rental_resource(req.params.rental_resource_id, user)
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
     * @author JoysanJawahar
     * @summary This rout is used for delete the rental service item
     * @returns Status and message
     */
    fastify.delete('/rental/vehicle/delete/:rental_vehicle_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.rental_vehicle_id) {
                const data = await delete_rental_vehicle(req.params.rental_vehicle_id, user)
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
     * @summary This function is used for create or get the rental item service
     * @param {Request data} body 
     * @param {Logged in user details} user 
     * @return JSON service data
     */
    async function get_rental_item_service(body, user) {
        if (body.rental_item_id) {
            let data = await Service.findAll({ attributes: { exclude: ["created_by", "updated_by", "created_at", "updated_at"] }, where: { _rental_item_id_fk: body.rental_item_id } });
            if (!data.length) {
                RentalItems.belongsTo(Inventory, { targetKey: '__inventory_id_pk', foreignKey: '_inventory_id_fk' });
                let rental_item = await RentalItems.findOne({
                    attributes: ["_inventory_id_fk", "_client_id_fk", "_rental_id_fk", "qty", "item", "units", "unit_price"], where: { __rental_item_id_pk: body.rental_item_id }, include: {
                        model: Inventory,
                        attributes: ["cost"]
                    }
                });
                let cost = 0;

                let create_data = [];
                if (rental_item) {
                    if (rental_item.inventory) {
                        cost = rental_item.inventory.cost || 0;
                    }
                    for (let i = 1; i <= rental_item.qty; i++) {
                        create_data.push({
                            _inventory_id_fk: rental_item._inventory_id_fk,
                            _client_id_fk: rental_item._client_id_fk,
                            _rental_id_fk: rental_item._rental_id_fk,
                            _rental_item_id_fk: body.rental_item_id,
                            item: rental_item.item,
                            units: rental_item.units,
                            charge_per_hour: rental_item.unit_price,
                            cost_per_hour: cost,
                            fee: parseFloat(rental_item.unit_price || 0) * rental_item.units,
                            total_cost: rental_item.units * parseFloat(cost),
                            status: "PENDING"
                        })
                    }
                }
                if (create_data.length) {
                    await Service.bulkCreate(create_data);
                }
                data = await Service.findAll({ attributes: { exclude: ["created_by", "updated_by", "created_at", "updated_at"] }, where: { _rental_item_id_fk: body.rental_item_id } });
            }
            data = await handy.transformnames('LTR', data, "Service", {}, user) || [];
            const auto_update_data = await rental_item_auto_update(body.rental_item_id, true, true, user, false, "item_service");
            return { status: true, data, auto_update_data }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }

    }

    /**
     * @author Kirankumar
     * @summary This rout is use full to update rental item services
     * @input {HTTP request}
     * @return Status and rental item service data
     */
    fastify.post('/rental/item/service/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await update_rental_item_service(req.body, user);
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
     * @summary This function is used for update the rental item service
     * @param {Request data} body 
     * @param {Logged in user details} user 
     * @return JSON service data
     */
    async function update_rental_item_service(body, user) {
        if (body.service_id) {
            const service = await Service.findOne({ raw: true, where: { __service_id_pk: body.service_id } });
            if (body.resource_id || body.charge_per_hour || body.cost_per_hour || body.units) {
                if (service) {
                    let { charge_per_hour = undefined, cost_per_hour = undefined, units = undefined } = body;
                    charge_per_hour = charge_per_hour != undefined ? charge_per_hour : service.charge_per_hour || 0;
                    cost_per_hour = cost_per_hour != undefined ? cost_per_hour : service.cost_per_hour || 0;
                    units = units != undefined ? units : service.units || 0;
                    if (body.resource_id) {
                        Resource.belongsTo(Auth, { targetKey: '__staff_id_pk', foreignKey: '_staff_id_fk' })
                        const resource = await Resource.findOne({
                            where: { __resource_id_pk: body.resource_id, is_deleted: 0 }, include: {
                                model: Auth,
                                attributes: ["rate"]
                            }
                        })
                        if (resource && resource.staff) {
                            cost_per_hour = resource.staff.rate || 0;
                        }
                    }
                    body.fee = charge_per_hour * units;
                    body.total_cost = units * cost_per_hour;
                }
            }
            data = await handy.create_update_table(body, user, Service, "Service", "__service_id_pk");
            if (data.status && data.data) {
                data.data.auto_update_data = await rental_item_auto_update(service._rental_item_id_fk, true, true, user, false, "item_service")
            }
            return data
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }

    }

    /**
     * @author Kirankumar
     * @summary this function is useful to get sequelize filter query
     * @param {Http request} req 
     * @param {Logged in user details} user 
     * @returns return Sequelize query
     */
    async function get_rental_data_filters(req, user) {
        let client_req = [];
        let address_req = [];
        let rental_status_req = [];
        let client_where = {};
        let address_where = {};
        let rental_status_where = {};
        let client_order = [];
        let address_order = [];
        let rental_status_order = [];
        let date_fields = ["date_start", "date_end"];
        let { start, limit, offset, where, attributes, order } = await handy.grid_filter(req.body, "Rental", true, user.company_id, date_fields);
        //separate orders
        for (o_key in order) {
            if (client_fields.indexOf(order[o_key][0]) >= 0)
                order[o_key] = [Client].concat(order[o_key]);
            else if (address_fields.indexOf(order[o_key][0]) >= 0)
                order[o_key] = [Address].concat(order[o_key]);
            else if (rental_status_fields.indexOf(order[o_key][0]) >= 0)
                order[o_key] = [ConfigRentalStatus].concat(order[o_key]);
        }
        //separate attributes and where conditions
        if (attributes && Array.isArray(attributes)) {
            attributes = attributes ? attributes.concat(rental_mandatory) : rental_mandatory;
            attributes = [...new Set(attributes)];
            let req_data = Array.from(attributes);
            for (key in req_data) {
                if (client_fields.indexOf(req_data[key]) >= '0') {
                    client_req.push(req_data[key]);
                    if (where[req_data[key]]) {
                        client_where[req_data[key]] = where[req_data[key]]
                        delete where[req_data[key]];
                    }
                    if (attributes.indexOf(req_data[key]) >= 0)
                        attributes.splice(attributes.indexOf(req_data[key]), 1);
                } else if (address_fields.indexOf(req_data[key]) >= 0) {
                    address_req.push(req_data[key]);
                    if (where[req_data[key]]) {
                        address_where[req_data[key]] = where[req_data[key]]
                        delete where[req_data[key]];
                    }
                    if (attributes.indexOf(req_data[key]) >= 0)
                        attributes.splice(attributes.indexOf(req_data[key]), 1);
                } else if (rental_status_fields.indexOf(req_data[key]) >= 0) {
                    rental_status_req.push(req_data[key]);
                    if (where[req_data[key]]) {
                        rental_status_where[req_data[key]] = where[req_data[key]]
                        delete where[req_data[key]];
                    }
                    if (attributes.indexOf(req_data[key]) >= 0)
                        attributes.splice(attributes.indexOf(req_data[key]), 1);
                }
            }
        }
        Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk', })
        Rental.belongsTo(Address, { targetKey: '__address_id_pk', foreignKey: '_address_id_fk', })
        Rental.belongsTo(ConfigRentalStatus, { targetKey: '__config_rental_status_id_pk', foreignKey: '_config_rental_status_id_fk', })
        //place client conditions for filters
        let sub_conditions = [];
        if (client_req.length) {
            let client_condition = {
                model: Client, // will create a left join
            }
            if (Object.keys(client_where).length > 0)
                client_condition.where = client_where;
            client_condition.attributes = client_req;
            if (client_order.length)
                client_condition.order = client_order;
            sub_conditions.push(client_condition);

        }
        //place address conditions for filters
        if (address_req.length) {
            let address_condition = {
                model: Address, // will create a left join
            }
            if (Object.keys(address_where).length > 0)
                address_condition.where = address_where;
            address_condition.attributes = address_req;
            if (address_order.length)
                address_condition.order = address_order;
            sub_conditions.push(address_condition);

        }
        //join all filters
        if (rental_status_req.length) {
            let rental_status_condition = {
                model: ConfigRentalStatus, // will create a left join
            }
            if (Object.keys(rental_status_where).length > 0)
                rental_status_condition.where = rental_status_where;
            rental_status_condition.attributes = rental_status_req;
            if (rental_status_order.length)
                rental_status_condition.order = rental_status_order;
            sub_conditions.push(rental_status_condition);
        }
        attributes = handy.setDateFormat(attributes, ["date_start", "date_end"], user.date_format);
        let condition = {
            limit, offset, where, attributes, order,
            include: sub_conditions
        }
        return condition;

    }
    /**
     * @author Kirankumar
     * @summary This function is used for create notes
     * @input notes data
     * @returns status and message
     */
    fastify.post('/rental/notes/create', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await handy.create_notes(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e.message);
        }
    })


    /**
     * @author Kirankumar
     * @summary This rout work for get rental data by id
     * @param {rental id} rental_id
     * @returns status and rental data.
     */
    fastify.get('/rental/get/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let res_get_data = await get_rental_data(req.params.rental_id, user);
            if (res_get_data.status) {
                res.status(200).send(res_get_data);
            } else {
                res.status(500).send(res_get_data);
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message })
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout used for refresh the stepper for rental
     * @param {rental id} rental_id
     * @returns status and stepper id.
     */
    fastify.get('/rental/stepper/refresh/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let stepper_data = await handy.update_stepper(req.params.rental_id);
            if (stepper_data.status) {
                res.status(200).send(stepper_data);
            } else {
                res.status(500).send(stepper_data);
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message })
        }
    })



    /**
     * @author Kirankumar
     * @summary This rout work for get rental documents by rental id
     * @param {rental id} rental_id
     * @returns status and rental document list data.
     */
    fastify.get('/rental/documents/get/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && !!parseInt(req.params.rental_id)) {
                let data = await Upload.findAll({ attributes: ["file_name", "name_ref", "file_name_fm", "is_signature"], where: { _rental_id_fk: req.params.rental_id, is_deleted: 0 } })
                res.status(200).send({ status: true, data })
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
     * @summary This rout work for delete rental data by id
     * @param {rental id} rental_id
     * @returns status and message.
     */
    fastify.delete('/rental/delete/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params.rental_id) {
                let delete_check = await Rental.count({ where: { __rental_id_pk: req.params.rental_id, _company_id_fk: user.company_id } })
                if (delete_check) {
                    let delete_query = await Rental.count({ where: { __rental_id_pk: req.params.rental_id, _company_id_fk: user.company_id, [Op.or]: [{ is_deleted: 0 }, { is_deleted: 'NULL' }] } });

                    if (delete_query) {
                        let delete_update_query = await Rental.update({ updated_by: user.company_id, is_deleted: 1, deleted_date_time: new Date() }, { where: { __rental_id_pk: req.params.rental_id } })
                        const item_ids = await RentalItems.findAll({ attributes: ["_inventory_id_fk"], where: { _rental_id_fk: req.params.rental_id } })
                        //Delete rental related rental items
                        await RentalItems.destroy({ where: { _rental_id_fk: req.params.rental_id } });
                        await SubRent.destroy({ where: { _rental_id_fk: req.params.rental_id } });
                        //Delete rental related task's
                        await Task.update({ is_deleted: 1 }, { where: { _rental_id_fk: req.params.rental_id, is_deleted: 0 } })
                        for (id of item_ids) {
                            if (id._inventory_id_fk) {
                                await handy.updateStock(id._inventory_id_fk)
                            }
                        }
                        res.status(200).send({ status: false, message: lang('Validation.record_deleted', user.lang) })
                    }
                    else {
                        res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) })
                    }
                }
                else {
                    res.status(500).send({ status: false, message: lang('Validation.invalid_rental', user.lang) })
                }
            }
            else {
                res.status(404).send({ status: false, message: lang('Validation.invalid_data', user.lang) })
            }
        } catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is usefull to create or update rental
     * @input Rental data
     * @returns status and rental data
     */
    fastify.post('/rental/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await update_rental_root(req, user);
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

    async function update_rental_root(req, user) {
        const body = { ...req.body };
        let update_price = "";
        if (body && body.update_price) {
            update_price = req.body.update_price;
            delete req.body.update_price;
        }
        const data = await create_update_rental(req.body, user);
        if (data.status) {
            let rental_calculated_data = {};
            if (data.data.client_id && req.rental_id) {
                await Task.update({ _client_id_fk: data.data.client_id }, { where: { _rental_id_fk: req.rental_id } })
            }
            if (body && body.rental_id && (data.data.date_end || data.data.period_no || data.data.rate_config_id || data.data.date_start)) {
                rental_calculated_data = await update_rental_period_calc({ rental_id: data.data.rental_id, update_price }, user, false)
            } else {
                rental_calculated_data = await handy.auto_update_or_calculate_rental(data.data.rental_id, true, user, true);
            }
            data.data.rental_calculated_data = rental_calculated_data;
            if (body && body.bond) {
                var notes_obj = {
                    "rental_id": data.data.rental_id,
                    "notes": lang('History.bond_updated', user.lang)
                }
                const notes_data = await handy.create_notes(notes_obj, user);
                data.history = notes_data.data.dataValues;
            }
        }
        return data;
    }

    /**
     * @author Kirankumar
     * @summary This rout is usefull to delete the rental item for rental
     * @param {Rental item id} item_id
     * @returns status and message
     */
    fastify.delete('/rentalitem/delete', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let data = {};
            if (req.body && req.body.rental_item_ids && req.body.rental_item_ids.length) {
                let delete_check = await RentalItems.findAll({ where: { __rental_item_id_pk: req.body.rental_item_ids } })
                if (delete_check.length) {
                    for (let key in delete_check) {
                        const item = delete_check[key];
                        let deleted = await RentalItems.destroy({ where: { __rental_item_id_pk: item.__rental_item_id_pk } })
                        if (deleted) {
                            await Return.destroy({ where: { id_lineitem: item.__rental_item_id_pk } });
                            if (item._inventory_id_fk)
                                await handy.updateStock(item._inventory_id_fk)
                        }
                        if (delete_check.length == (parseInt(key) + 1) && delete_check[key]._rental_id_fk) {
                            const rental_calculated_data = await handy.auto_update_or_calculate_rental(delete_check[key]._rental_id_fk, true, user);
                            data = { rental_calculated_data };
                        }
                        let delete_status = await SubRent.destroy({ where: { id_parent_item: item.__rental_item_id_pk } });
                        console.log(delete_status);
                    }
                    res.status(200).send({ status: true, data, message: lang('Validation.record_deleted', user.lang) })
                }
                else {
                    res.status(500).send({ status: false, message: lang('Validation.record_not_exist', user.lang) })
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) })
            }

        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message });
        }
    })


    /**
     * @author Kirankumar
     * @summary This rout is usefull to create or update the rental items
     * @inpit rental item data
     * @returns status and updated rental item data
     */
    fastify.post('/rentalitem/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_or_update_rental_item(req.body, user);
            if (data.status) {
                data.data.auto_update_data = await rental_item_auto_update(data.data.rental_item_id, true, true, user);
                let cal_data = await handy.transformnames('LTR', data.data.auto_update_data, "RentalItems", {}, user);
                data.data.amount = cal_data.amount;
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
            // if (req.params.item_id) {
            //     let insert_record = await insert_update_rentals_itemdata(res, user, req.body, req.params.item_id);
            //     res.status(200).send(insert_record)
            // }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message });
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is usefull to create or update the rental items
     * @inpit rental item data
     * @returns status and updated rental item data
     */
    fastify.post('/rental/items/create', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_rental_items(req.body, user);
            if (data.status) {
                //data.data.auto_update_data = await rental_item_auto_update(data.data.rental_item_id);
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
            // if (req.params.item_id) {
            //     let insert_record = await insert_update_rentals_itemdata(res, user, req.body, req.params.item_id);
            //     res.status(200).send(insert_record)
            // }
        }
        catch (e) {
            res.status(500).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for create the bulk items for rental
     * @param {rental item items} data 
     * @param {Logged in user details} user 
     * @returns status and created data
     */
    async function create_rental_items(data, user) {
        if (data.items && data.items.length && data.rental_id) {
            let items = data.items;
            const return_items = [];
            let parent_item_id = 0;
            const admin = await Administration.findOne({ attributes: ["no_extra_panel", "checkbox_checkAvailability"], where: { _company_id_fk: user.company_id } })
            const rental = await Rental.findOne({ attributes: ["_rate_config_id_fk", "_client_id_fk", "company_discount", "period_no", "is_rate_calculator", "date_start", "date_end", "selected_company_no", "is_quote", "time_start", "time_end"], where: { __rental_id_pk: data.rental_id } })
            if (!rental) {
                return { status: false, message: lang('Validation.invalid_data', user.lang) }
            }
            if (!rental._client_id_fk) {
                return { status: true, alert: lang('Validation.client_miss', user.lang) }
            }
            let sort = await RentalItems.max("sort", { where: { _rental_id_fk: data.rental_id } }) || 0;
            const inventory_ids = items.map(item_data => item_data.inventory_id) || [];
            const avl_qty = await handy.inventory_available_stock({ inventory_ids, rental_id: data.rental_id }, user);
            let inventory_avl = {};
            if (avl_qty.status) {
                for (item_data of avl_qty.data) {
                    inventory_avl[item_data.inventory_id] = item_data.zz_available_qty;
                }
                //inventory_avl = avl_qty.data.map(item_data => ({ [item_data.inventory_id]: item_data.zz_available_qty })) || [];
            }
            for (let item of items) {
                let metres = 0;
                item.rental_id = data.rental_id;
                let unit_price = 0;
                let is_re_occur = 0;
                let inventory = {};
                let sub_item_qty = 1;
                let sub_rent_cost_pice = 0;
                if (item.inventory_id) {
                    inventory = await Inventory.findOne({ attributes: ["size", "zz__available_qty", "is_track_serial_no", "is_not_track_inventory", "_item_type_id_fk", "sku"], where: { __inventory_id_pk: item.inventory_id } });
                }

                if (item.type == "SELL") {
                    if (item.inventory_id) {
                        unit_price = await Inventory.sum("price", { where: { __inventory_id_pk: item.inventory_id } }) || 0;
                    }
                } else {
                    if (item.inventory_id) {
                        if (item.type == "SERVICE") {
                            InventoryRate.belongsTo(ConfigDefaultRate, { targetKey: '__config_default_rate_pk', foreignKey: '_rate_config_id_fk' })
                            const inventory_rate = await InventoryRate.findOne({
                                attributes: ["price_extra_tax", "is_use_mtr_fee", "is_re_occur", "cost"], where: { _inventory_id_fk: item.inventory_id }, include: {
                                    model: ConfigDefaultRate,
                                    where: {
                                        label: "HOURLY"
                                    }
                                }
                            })
                            if (inventory_rate) {
                                unit_price = inventory_rate.price_extra_tax;
                                metres = inventory_rate.is_use_mtr_fee;
                                is_re_occur = inventory_rate.is_re_occur;
                                sub_rent_cost_pice = inventory_rate.cost;
                            }

                        } else {
                            const inventory_rate = await InventoryRate.findOne({ attributes: ["price_extra_tax", "is_use_mtr_fee", "is_re_occur", "cost"], where: { _inventory_id_fk: item.inventory_id, _rate_config_id_fk: rental._rate_config_id_fk } })
                            if (inventory_rate) {
                                unit_price = inventory_rate.price_extra_tax;
                                metres = inventory_rate.is_use_mtr_fee;
                                is_re_occur = inventory_rate.is_re_occur;
                                sub_rent_cost_pice = inventory_rate.cost;
                            }
                        }
                    }
                }

                const is_main_item = item.is_main_item;
                if (!is_main_item) {
                    item.rental_item_id_fk = parent_item_id;
                    //if (item.type != "SERVICE") {
                    if (item.inventory_component_id) {
                        const component_data = await InventoryComponent.findOne({ attributes: ["price", "quantity", "is_show_on_docket"], where: { __inventory_component_id_pk: item.inventory_component_id } })
                        if (component_data) {
                            sub_item_qty = (parseFloat(item.qty) || 0) * (parseFloat(component_data.quantity) || 0);
                            unit_price = component_data.price;
                        }
                    } else {
                        unit_price = 0;
                    }
                    //}
                } else {
                    item.rental_item_id_fk = 0;
                }
                //need to check with linga
                if (metres) {
                    item.metres = item.qty;
                    const noExtra = admin.no_extra_panel;
                    const size = inventory.size || 0;
                    if (noExtra) {
                        item.qty = Math.round(item.qty / size, 0);
                    } else {
                        item.qty = Math.round(item.qty / size, 0) + 1;
                    }
                }
                if (!is_main_item)
                    item.qty = sub_item_qty;
                //for service units will come only 1(FM)
                if (!item.is_header) {
                    if (rental.is_rate_calculator && item.type != "SERVICE") {
                        item.units = rental.period_no;
                    } else {
                        item.units = 1;
                    }
                } else {
                    item.units = 0;
                    item.qty = 0;
                }
                // const zz__available_qty = inventory ? inventory.zz__available_qty : 0;
                // if (item.qty > zz__available_qty) {
                //     item.quantity_over_booked = item.qty - zz__available_qty;
                // }

                item.discount_rate = rental.company_discount;
                item.unit_price = unit_price;
                item.date = rental.date_start;
                item.date_end = rental.date_end;
                item.time_start = rental.time_start;
                item.time_end = rental.time_end;
                item.period_no = item.is_header ? 0 : rental.period_no;
                item.is_re_occur = is_re_occur;
                item.selected_company_no = rental.selected_company_no;
                item.sort = ++sort;
                item.is_track_serial_no = inventory.is_track_serial_no;
                const out_data = await handy.create_update_table(item, user, RentalItems, "RentalItems", "__rental_item_id_pk");
                if (out_data.status) {
                    item = out_data.data;
                }
                if (item.rental_item_id) {
                    if (admin.checkbox_checkAvailability && item.type != "SERVICE") {
                        const avl_qty = inventory_avl[item.inventory_id] || 0;
                        const no_track = inventory.is_not_track_inventory || 0;
                        const is_quote = rental.is_quote || 0;
                        const item_type_id = inventory._item_type_id_fk;
                        //item_type == 5 means checking item type is sub rental
                        if (!no_track && !is_quote) {
                            if (item.qty > avl_qty || item_type_id == 5) {
                                const over_booked_qty = avl_qty <= 0 ? item.qty : item.qty - avl_qty;
                                const sub_rent_qty = item_type_id == 5 ? item.qty : over_booked_qty;
                                const sub_rent_data = {
                                    cost: sub_rent_cost_pice,
                                    qty: sub_rent_qty,
                                    item: item.item,
                                    _rental_id_fk: data.rental_id,
                                    id_parent_item: item.rental_item_id,
                                    id_product: item.inventory_id,
                                    sku: inventory.sku,
                                    status: "PENDING",
                                    send: 1,
                                    use_date: item.date,
                                    use_time: item.time_start,
                                    period_no: item.period_no
                                }
                                await SubRent.create(sub_rent_data);
                                await RentalItems.update({ sub_rent: 1 }, { where: { __rental_item_id_pk: item.rental_item_id } });
                            }
                        }
                    }
                    item.auto_update_data = await rental_item_auto_update(item.rental_item_id, true, true, user);
                    item.amount = item.auto_update_data.amount;
                }
                return_items.push(item);
                if (is_main_item) {
                    parent_item_id = item.rental_item_id;
                }
            }
            const rental_calculated_data = await handy.auto_update_or_calculate_rental(data.rental_id, true, user);
            const return_data = { items: return_items, rental_calculated_data };
            return { status: true, data: return_data }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }

    /**
     * @author Kirankumar
     * @summary This rout is usefull to calculate the renat and rental items for front end
     * @input Rental and rental item data
     * @param {rental id} rental_id;
     * @returns status and calculated data
     */
    fastify.get('/rental/calculate/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            //let calc_item = await calculate_rental_data(req.body, user, req.params.rental_id);
            if (req.params && req.params.rental_id) {
                //const calc_data = await calculate_rental_update(req.params.rental_id,user,false) || {};
                const calc_data = await handy.auto_update_or_calculate_rental(req.params.rental_id, false, user) || {}
                //const data = (({rental_id,total_costs, taxable_amount, paid, tax, credit_card_charge, total_subrent, total_loss, sub_total, total_kit, total_balence, total_rental, sur_charge, discount, status_payment, status_overbooked, status_invoiced, status_dispatch, total_services, total_invoices, profit, total, total_due, balance, total_paid, pament_amount, total_refund}) => ({rental_id,total_costs, taxable_amount, paid, tax, credit_card_charge, total_subrent, total_loss, sub_total, total_kit, total_balence, total_rental, sur_charge, discount, status_payment, status_overbooked, status_invoiced, status_dispatch, total_services, total_invoices, profit, total, total_due, balance, total_paid, pament_amount, total_refund}))(calc_data)
                res.status(200).send({ status: true, data: calc_data })
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is usefull to update the job end date
     * @returns Status and Updated data
     */
    fastify.post('/rental/offhire/setendjob', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await set_end_job(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })


    /**
     * @author Bharath
     * @summary This rout is used for update rentall offhire
     * @returns Status and Updated data
     */
    fastify.post('/rental/offhire/update/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let check_validate = false;
            if (req.params && req.params.rental_id) {
                check_validate = await Rental.count({ where: { __rental_id_pk: req.params.rental_id, _company_id_fk: user.company_id } })
            }
            if (!check_validate) {
                res.status(501).send({ status: false, message: lang('Validation.invalid_rental', user.lang) })
            }
            const data = await update_offhire(user, req.body, req.params.rental_id, "Rental")
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Bharath
     * @summary This rout is used for set out status
     * @returns Status and Updated data
     */
    fastify.post('/rental/offhire/outstatus/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let check_validate = false;
            if (req.params && req.params.rental_id) {
                check_validate = await Rental.count({ where: { __rental_id_pk: req.params.rental_id, _company_id_fk: user.company_id } })
            }
            if (!check_validate) {
                res.status(501).send({ status: false, message: lang('Validation.invalid_rental', user.lang) })
            }
            const data = await offhire_out(user, req.body, req.params.rental_id, "outpopup")
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for update deposit data for rental
     * @returns Status and Updated data
     */
    fastify.post('/rental/deposit', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await updateDeposit(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for update the deposit data to rental
     * @param {HTTP request body} body 
     * @param {Logged in user details} user 
     * @returns Status and message or Updated data
     */
    async function updateDeposit(body, user) {
        if (!body || !body.action || !body.rental_id) {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
        const rental_data = await Rental.findOne({ attributes: ["bond", "created_at", "date_start", "date", "total"], where: { __rental_id_pk: body.rental_id, is_deleted: 0 } })
        const company_data = await Administration.findOne({ where: { _company_id_fk: user.company_id }, attributes: ["deposit_amount", "deposit_balance_due_period", "checkbox_deposit_balance_due_setdate", "deposit_period", "deposit_percentage", "checkbox_deposit_due_setdate", "bond_rate"] })
        const update_data = { rental_id: body.rental_id };
        if (rental_data && company_data && body.action == "on") {
            if (rental_data.bond > 0 || company_data["bond_rate"] > 0) {
                return { status: 200, alert: lang('Validation.rental_deposit_bond_alert', user.lang) }
            }
            update_data.deposit = company_data.deposit_amount > 0 ? company_data.deposit_amount : rental_data.total * company_data.deposit_percentage;
            update_data.deposit_balance = rental_data.total - update_data.deposit;
            update_data.deposit_req = 1;
            //set deposit due date
            if (company_data.checkbox_deposit_due_setdate == 1) {
                update_data.deposit_due_date = rental_data.date
            } else {
                let d = new Date(rental_data.date);
                d.setDate(d.getDate() - company_data.deposit_period);
                update_data.deposit_due_date = d;
            }
            //set deposit balance due date
            if (company_data.checkbox_deposit_balance_due_setdate == 1) {
                update_data.deposit_balance_due = rental_data.date
            } else {
                let d = new Date(rental_data.date);
                d.setDate(d.getDate() - company_data.deposit_balance_due_period);
                update_data.deposit_balance_due = d;
            }

        } else if (rental_data && company_data && body.action == "off") {
            //update_data.deposit = "";
            //update_data.deposit_balance = "";
            update_data.deposit_req = 0;
            //update_data.deposit_due_date = "";
            //update_data.deposit_balance_due = "";
            //update_data.deposit_balance_due = "";
            //update_data.deposit_balance_date_received = "";
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
        const data = await handy.create_update_table(update_data, user, Rental, "Rental", "__rental_id_pk")
        var notes_obj = {
            "rental_id": data.data.rental_id,
            "notes": lang('History.deposit_' + body.action, user.lang)
        }
        const notes_data = await handy.create_notes(notes_obj, user);
        data.history = notes_data.data.dataValues;
        return data;
    }

    /**
     * @author Kirankumar
     * @summary This rout is used for get deposit data
     * @returns Status and data
     */
    fastify.get('/rental/deposit/get/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.rental_id) {
                let data = await Rental.findOne({ attributes: ["deposit_balance_received", "deposit_balance_date_received", "deposit_received_by", "deposit_date_received", "deposit_received", "deposit", "deposit_balance", "deposit_req", "deposit_due_date", "deposit_balance_due"], where: { __rental_id_pk: req.params.rental_id } }) || {};
                data = await handy.transformnames('LTR', data, "Rental", {}, user) || {};
                res.status(200).send({ status: true, data });
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @summary This rout is used for set out status
     * @returns Status and Updated data
     */
    fastify.post('/rental/longterm', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await updateLongTerm(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for get long term hire data
     * @returns Status and data
     */
    fastify.get('/rental/longterm/get/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.rental_id) {
                const data = await Rental.findOne({ attributes: ["check_box_billing_set", "prorata_billing", "billing_date_start", "billing_cycle", "billing_period_amount", "billing_date_end", "billing_date_next", "long_term_hire"], where: { __rental_id_pk: req.params.rental_id } }) || {};
                res.status(200).send({ status: true, data });
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for update returns
     * @returns Status and data
     */
    fastify.post('/rental/rentalitem/return', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await update_rental_item_return(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for update rental items discount rate
     * @returns Status and rental items data
     */
    fastify.post('/rental/discount/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await update_rental_item_discount(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for update rate calculate field
     * @returns Status and rental items data
     */
    fastify.post('/rental/ratecalculate/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await update_rental_rate_calc(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for update rental and rental item data based on rate and period no
     * @returns Status and rental items data
     */
    fastify.post('/rental/periodcalculate/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await update_rental_period_calc(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is used for update rate calculate field with calculations.
     * @param {Input data} body 
     * @param {Logged in user details} user 
     */
    async function update_rental_rate_calc(body, user) {
        const items = [];
        let data = {};
        let is_rate_calculator = 0;
        let units = 1;
        if (body.rental_id && body.rate_calculator) {
            if (body.rate_calculator == "yes") {
                const admin = await Administration.findOne({ attributes: ["weekly_billing_days"], where: { _company_id_fk: user.company_id } })
                const rental = await Rental.findOne({ attributes: ["period_no"], where: { __rental_id_pk: body.rental_id } })
                const period_no = rental && rental.period_no ? rental.period_no : 0;
                if (admin && admin.weekly_billing_days == 5) {
                    units = period_no - Math.round(period_no / 7, 0) * 2;
                } else {
                    units = period_no;
                }
                is_rate_calculator = 1;
            }
            const rental_data = await RentalItems.findAll({ attributes: ["__rental_item_id_pk"], where: { _rental_id_fk: body.rental_id } });
            if (rental_data.length) {
                await Rental.update({ is_rate_calculator }, { where: { __rental_id_pk: body.rental_id } })
                await RentalItems.update({ units }, { where: { _rental_id_fk: body.rental_id } });
                for (let item of rental_data) {
                    let item_data = {};
                    item_data = await rental_item_auto_update(item.__rental_item_id_pk, true, false, user);
                    item_data.units = units;
                    items.push(item_data);
                }
                const rental_calculated_data = await handy.auto_update_or_calculate_rental(body.rental_id, true, user);
                data = { rental_calculated_data };
                data.items = items;
            }
            var notes_obj = {
                "rental_id": body.rental_id,
                "notes": lang('History.ratecalc_' + body.rate_calculator, user.lang)
            }
            const notes_data = await handy.create_notes(notes_obj, user);
            data.history = notes_data.data.dataValues;
            return { status: true, data }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used for update rental and rental item data based on rate.
     * @param {Input data} body 
     * @param {Logged in user details} user 
     */
    async function update_rental_period_calc(body, user, is_items_need = true) {
        const items = [];
        let data = {};
        const rental_data = {};
        if (body.rental_id) {
            const rental = await Rental.findOne({ attributes: ["_rate_config_id_fk", "long_term_hire", "delivery_date", "collection_date", "period_no", "is_rate_calculator", "delivery", "date_start", "date_end"], where: { __rental_id_pk: body.rental_id } })
            const rental_item_update_data = {
                date: rental.date_start,
                date_end: rental.date_end
            }

            const admin = await Administration.findOne({ attributes: ["de_prep_days", "default_billing_period", "checkbox_add_de_prep_days", "checkbox_add_prep_days", "prep_days", "weekly_billing_days", "checkbox_no_collection", "delivery_default"], where: { _company_id_fk: user.company_id } })
            if (rental.long_term_hire) {
                rental_data.billing_date_start = rental.date_start;
                rental_data.billing_cycle = admin.default_billing_period;
            }

            if (admin.delivery_default = "Delivery" || rental.delivery == "yes") {
                rental_data.delivery_date = rental.date_start;
                if (!admin.checkbox_no_collection) {
                    rental_data.collection_date = rental.date_end;
                }

                if (admin.prep_days && admin.checkbox_add_prep_days && ((rental_data.delivery_date && new Date(rental_data.delivery_date) != "Invalid Date") || new Date(rental.delivery_date) != "Invalid Date")) {
                    const delivery_date = (rental_data.delivery_date && new Date(rental_data.delivery_date) != "Invalid Date") ? rental_data.delivery_date : rental.delivery_date;
                    const prep_date = new Date(new Date(delivery_date).setDate(new Date(delivery_date).getDate() - admin.prep_days))
                    rental_data.prep_date = prep_date;
                }

                if (admin.de_prep_days && admin.checkbox_add_de_prep_days && ((rental_data.collection_date && new Date(rental_data.collection_date) != "Invalid Date") || new Date(rental.collection_date) != "Invalid Date")) {
                    const collection_date = (rental_data.collection_date && new Date(rental_data.collection_date) != "Invalid Date") ? rental_data.collection_date : rental.collection_date;
                    const de_prep_date = new Date(new Date(collection_date).setDate(new Date(collection_date).getDate() - admin.de_prep_days))
                    rental_data.de_prep_date = de_prep_date;
                }
            }

            await Rental.update(rental_data, { where: { __rental_id_pk: body.rental_id } })
            if (rental.is_rate_calculator) {
                const period_no = rental && rental.period_no ? rental.period_no : 0;
                if (admin && admin.weekly_billing_days == 5) {
                    rental_item_update_data.units = period_no - Math.round(period_no / 7) * 2;
                } else {
                    rental_item_update_data.units = period_no;
                }
            }


            const rental_item_data = await RentalItems.findAll({ attributes: ["__rental_item_id_pk", "_inventory_id_fk", "unit_price"], where: { _rental_id_fk: body.rental_id } });
            if (rental_item_data.length) {
                //await Rental.update({ is_rate_calculator }, { where: { __rental_id_pk: body.rental_id } })
                await RentalItems.update(rental_item_update_data, { where: { _rental_id_fk: body.rental_id } });
                for (let item of rental_item_data) {
                    let item_data = {};
                    let unit_price = item.unit_price;
                    if (body.update_price == "yes" && item._inventory_id_fk) {
                        const rate_data = await InventoryRate.findOne({ attributes: ["price_extra_tax"], where: { _rate_config_id_fk: rental._rate_config_id_fk, _inventory_id_fk: item._inventory_id_fk } })
                        unit_price = rate_data && rate_data.price_extra_tax ? rate_data.price_extra_tax : 0;
                        await RentalItems.update({ unit_price }, { where: { __rental_item_id_pk: item.__rental_item_id_pk } });

                    }
                    item_data = await rental_item_auto_update(item.__rental_item_id_pk, true, false, user);
                    if (rental_item_update_data.units)
                        item_data.units = rental_item_update_data.units;
                    item_data.unit_price = unit_price;
                    items.push(item_data);
                }
                const rental_calculated_data = await handy.auto_update_or_calculate_rental(body.rental_id, true, user);
                data = { rental_calculated_data };
                data.items = items;
            }
            if (is_items_need) {
                return { status: true, data };
            } else {
                return data;
            }
        } else {
            if (is_items_need) {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            } else {
                return {};
            }
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used for update discount rate to all rental items related to given rental
     * @param {Input data} body 
     * @param {Logged in user details} user 
     */
    async function update_rental_item_discount(body, user) {
        const items = [];
        let data = {};
        if (body.rental_id && body.discount_rate != undefined) {
            const rental_data = await RentalItems.findAll({ attributes: ["__rental_item_id_pk"], where: { _rental_id_fk: body.rental_id } });
            await Rental.update({ discount_selector: body.discount_rate }, { where: { __rental_id_pk: body.rental_id } })
            if (rental_data.length) {
                await RentalItems.update({ discount_rate: body.discount_rate }, { where: { _rental_id_fk: body.rental_id } });
                for (let item of rental_data) {
                    let item_data = {};
                    item_data = await rental_item_auto_update(item.__rental_item_id_pk, true, false, user);
                    item_data.discount_rate = body.discount_rate;
                    items.push(item_data);
                }
                const rental_calculated_data = await handy.auto_update_or_calculate_rental(body.rental_id, true, user);
                data = { rental_calculated_data };
                data.items = items;
            }
            return { status: true, data }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used for calculate the rental item auto update fields.
     * @param {Rental item id} rental_item_id 
     * @param {Logged in user} user 
     * @returns Updated rental auto calculation fields data
     */
    async function rental_item_auto_update(rental_item_id, calculation_field_update = true, calculate_rental = true, user, update_stepper = false, proces_type = "") {
        //need to call returns first
        if (rental_item_id) {
            await returns_auto_update(rental_item_id);
            //RentalItems.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk'});
            //Rental.belongsTo(Client,{ targetKey: '__client_id_pk', foreignKey: '_client_id_fk'});
            RentalItems.belongsTo(Return, { targetKey: 'id_lineitem', foreignKey: '__rental_item_id_pk' })
            let rental_item_data = await RentalItems.findOne({
                where: { __rental_item_id_pk: rental_item_id },
                include: [
                    //{
                    //     model : Rental,
                    //     include: Client
                    // },
                    {
                        model: Return,
                    }]
            });
            let update_data = {};
            if (rental_item_data) {
                rental_item_data = rental_item_data.get({ plain: true });
                const return_data = rental_item_data.return;
                if (proces_type == "item_service") {
                    const item_service_list = await Service.findAll({ attributes: ["fee", "total_cost"], where: { _rental_item_id_fk: rental_item_id } });
                    let fee = total_cost = 0;
                    for (let service_item of item_service_list) {
                        fee += parseFloat(service_item.fee || 0);
                        total_cost += parseFloat(service_item.total_cost || 0);
                    }
                    update_data.total_service_cost = total_cost;
                    update_data.total_service_profit = fee - total_cost;
                    update_data.total_service_rrp = fee;
                }
                //updating the discount amount
                let discount_rate = rental_item_data.discount_rate >= 1 ? rental_item_data.discount_rate / 100 : rental_item_data.discount_rate;
                update_data.discount_amount = rental_item_data.units ? (
                    (rental_item_data.unit_price * rental_item_data.qty * rental_item_data.units) * discount_rate
                ) : (
                    (rental_item_data.qty * rental_item_data.unit_price) * discount_rate
                )
                //update data to rental item table
                if (calculation_field_update) {
                    await RentalItems.update({ discount_amount: update_data.discount_amount }, { where: { __rental_item_id_pk: rental_item_id } });
                }
                //calculate amount and update in rental item
                const amount_data = await rental_item_update_amount([rental_item_id]);
                if (amount_data && amount_data.length) {
                    rental_item_data.amount = amount_data[0].amount || 0;
                    update_data.amount = rental_item_data.amount;
                }
                //update taxable amount in rental item(can handle in rental)
                update_data.taxable_amount = rental_item_data.taxable ? rental_item_data.amount : 0;

                //update balance in rental item
                update_data.balance = return_data && return_data.balance > 0 ? return_data.balance : rental_item_data.qty;

                //update commission cost in RI(include in rental calculatons)
                // if(client_data){
                //     const client_commission = client_data.commision > 1? client_data.commision/100:client_data.commision;
                //     update_data.commission_cost = (rental_item_data.amount * client_commission) || 0;
                // }

                //update the hourse total
                update_data.hours_total = rental_item_data.hours_in ? rental_item_data.hours_in - rental_item_data.hours_out : 0;
                //update period till service for rental item
                update_data.period_till_service = rental_item_data.hours_in ? (rental_item_data.last_service_hours || 0) + (rental_item_data.service_period || 0) - rental_item_data.hours_in : 0;
                //Update loss
                update_data.loss = await Return.sum("loss", { where: { id_lineitem: rental_item_data.__rental_item_id_pk } }) || 0;
                //Update balance_metres
                update_data.balance_metres = await Return.sum("metres_in", { where: { id_lineitem: rental_item_data.__rental_item_id_pk } }) || 0;
                //update quantity returned count
                update_data.quantity_returned = return_data ? (return_data.qty_in || 0) : 0;
                //update status
                if (!return_data) {
                    update_data.status = "PENDING";
                } else if (return_data && return_data.balance > 0) {
                    update_data.status = "OUT";
                } else if (return_data && !return_data.balance) {
                    update_data.status = "IN";
                } else {
                    update_data.status = "";
                }
                //update un_stored_loss
                update_data.unstored_loss = update_data.loss ? (update_data.loss * rental_item_data.replacement_cost) : 0;
                //update year
                update_data.year = rental_item_data.date ? new Date(rental_item_data.date).getFullYear() : "";

                //update data to rental item table
                if (calculation_field_update) {
                    await RentalItems.update(update_data, { where: { __rental_item_id_pk: rental_item_id } });
                    if (calculate_rental)
                        update_data.rental_calculated_data = await handy.auto_update_or_calculate_rental(rental_item_data._rental_id_fk, true, user, update_stepper)
                }
                update_data = handy.setDecimal("rental_item_cal", update_data, user)
                update_data = handy.setThousandSeparator("rental_item_cal_decimal", update_data);
                update_data.rental_item_id = rental_item_id;
            }
            return update_data;
        } else {
            return {};
        }
    }


    /**
     * @author Kirankumar
     * @summary This rout is used for duplicate the rental
     * @returns status and created data
     */
    fastify.post('/rental/duplicate', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await duplicate_rental(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @summary This rout is used for update sort order for rental items
     * @returns status and created data
     */
    fastify.post('/rental/item/sort', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await rental_item_sort(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for update sort order for rental items
     * @param {rental item ids} data 
     * @param {logged in user details} user 
     * @returns status and message
     */
    async function rental_item_sort(data, user) {
        if (data && data.rental_item_ids) {
            let sort = 1;
            for (id of data.rental_item_ids) {
                await RentalItems.update({ sort: sort++, updated_by: user.user_id }, { where: { __rental_item_id_pk: id } })
            }
            return { status: true, message: lang('Validation.order_updated', user.lang) }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
    }
    /**
     * @author Kirankumar
     * @summary This function is used for duplicate the the rantal for same client
     * @param {Rental id} rental_id 
     * @param {Logged in User details} user 
     * @returns Status and created rental data
     */
    async function duplicate_rental(in_data, user) {
        if (in_data && in_data.rental_id) {
            const rental_id = in_data.rental_id;
            Rental.belongsTo(Administration, { targetKey: '_company_id_fk', foreignKey: '_company_id_fk' });
            const rental_data = await Rental.findOne({
                raw: true, attributes: ["_client_id_fk", "_contact_id_fk", "_company_id_fk", "selected_company", "selected_company_no", "company_address", "company_contact", "company_contact_mobile", "company_contact_phone", "company_email", "contact_phone", "contact_email", "date", "date_start", "date_end", "time_start", "time_end"], where: { __rental_id_pk: rental_id, is_deleted: 0 }, include:
                {
                    model: Administration,
                    attributes: ["_rate_config_id_fk", "delivery_default", "checkbox_tc"]
                }
            });
            if (rental_data) {
                const rental_status = await ConfigRentalStatus.findOne({ attributes: ["__config_rental_status_id_pk"], where: { _company_id_fk: user.company_id, status_label: "Reserved Unpaid" } });
                if (rental_status) {
                    rental_data._config_rental_status_id_fk = rental_status.__config_rental_status_id_pk;
                }
                const admin = rental_data.administration || {};
                delete rental_data.administration;
                rental_data.attach_terms = admin.checkbox_tc ? 1 : 0;
                rental_data.delivery = admin.delivery_default == "Delivery" ? "yes" : "";
                rental_data._rate_config_id_fk = admin._rate_config_id_fk;
                //delete rental_data.__rental_id_pk;
                const created_rental = await Rental.create(rental_data);
                let data = await handy.transformnames('LTR', created_rental, "Rental", {}, user) || {};
                if (created_rental.__rental_id_pk) {
                    if (in_data.is_add_items) {
                        const rental_item_data = await RentalItems.findAll({
                            raw: true, attributes: [
                                "_client_id_fk", "_inventory_id_fk", "_project_id_fk", "date", "date_end", "item", "qty", "sku", "status", "taxable",
                                "time_end", "time_start", "type", "units", "unit_price", "sort"
                            ], where: { _rental_id_fk: rental_id }
                        })
                        for (rental_item_key in rental_item_data) {
                            rental_item_data[rental_item_key]._rental_id_fk = created_rental.__rental_id_pk;
                        }
                        const create_rental_item_data = await RentalItems.bulkCreate(rental_item_data);
                        data.item = await handy.transformnames('LTR', create_rental_item_data, "RentalItems", {}, user) || [];
                    }
                    if (created_rental && created_rental.__rental_id_pk) {
                        created_rental.rental_calculated_data = await handy.auto_update_or_calculate_rental(created_rental.__rental_id_pk, true, user)
                    }
                    return { status: true, data }
                } else {
                    return { status: false, message: lang('Validation.invalid_data', user.lang) }
                }
            } else {
                return { status: false, message: lang('Validation.invalid_data', user.lang) }
            }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
    }


    /**
     * @author Kirankumar
     * @summary This will update the meter charge is 
     * @param {Rental item id} rental_item_id 
     * @param {Rental id} rental_id will call from rental
     * @param {Inventory rate id} rate_id will call from invenntory
     * @returns true
     */
    async function rental_item_auto_update_meter_charge(rental_item_id, rental_id, rate_id) {
        let update_data = "";
        let rental_items = [];
        const return_data = [];
        //let data = {};
        if (rental_item_id) {
            //RentalItems.belongsTo(Inventory,{ targetKey: '__inventory_id_pk', foreignKey: '_inventory_id_fk'})
            // const service_count = await RentalItems.sum("inventory._item_type_id_fk",{where:{__rental_item_id_pk:rental_item_id,is_deleted:0},include:{
            //     model:Inventory
            // }});

            const service_count = 1;
            //need to do later
            if (service_count == 3) {
                //  RentalItems.belongsTo(Inventory,{ targetKey: '__inventory_id_pk', foreignKey: '_inventory_id_fk'})
                // const inv_data = await RentalItems.findOne("inventory._item_type_id_fk",{where:{__rental_item_id_pk:rental_item_id,is_deleted:0},include:{
                //     model:Inventory,
                //     include:{
                //         model:Rate,
                //         where:{

                //         }
                //     }
                // }});
            } else {
                RentalItems.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk' });
                Rental.belongsTo(Rate, { targetKey: '__rate_config_id_pk', foreignKey: '_rate_config_id_fk' });
                Rate.belongsTo(InventoryRate, { targetKey: '_rate_config_id_fk', foreignKey: '__rate_config_id_pk' })
                const data = await RentalItems.findOne({
                    where: { __rental_item_id_pk: rental_item_id },
                    include: {
                        model: Rental,
                        attributes: ["__rental_id_pk"],
                        include: {
                            model: Rate,
                            attributes: ["__rate_config_id_pk"],
                            include: {
                                model: InventoryRate,
                                attributes: ["is_use_mtr_fee"],
                            }
                        }
                    }
                });
                if (data && data.rental && data.rental.rate && data.rental.rate && data.rental.rate.inventory_rate && data.rental.rate.inventory_rate.is_use_mtr_fee) {
                    update_data = { metre_charge: 1 }
                } else {
                    update_data = { metre_charge: 0 }
                }
            }

            //await RentalItems.update(update_data,{where:{__rental_item_id_pk:rental_item_id}})
            rental_items = [rental_item_id];
        } else if (rental_id) {
            Rental.belongsTo(Rate, { targetKey: '__rate_config_id_pk', foreignKey: '_rate_config_id_fk' });
            Rate.belongsTo(InventoryRate, { targetKey: '_rate_config_id_fk', foreignKey: '__rate_config_id_pk' })
            const data = await Rental.findOne({
                where: { __return_id_pk: rental_id, is_deleted: 0 },
                include: {
                    model: Rate,
                    attributes: ["__rate_config_id_pk"],
                    include: {
                        model: InventoryRate,
                        attributes: ["is_use_mtr_fee"],
                    }
                }
            });
            if (data && data.rate && data.rate && data.rate.inventory_rate && data.rate.inventory_rate.is_use_mtr_fee) {
                update_data = { metre_charge: 1 }
            } else {
                update_data = { metre_charge: 0 }
            }
            const rental_items_list = await RentalItems.findAll({ attributes: ["__rental_item_id_pk"], where: { _rental_id_fk: rental_id } })
            for (rental_item_data of rental_items_list) {
                rental_items.push(rental_item_data.__rental_item_id_pk);
            }
        } else if (rate_id) {
            InventoryRate.belongsTo(Inventory, { targetKey: '__inventory_id_pk', foreignKey: '_inventory_id_fk' })
            Inventory.belongsTo(RentalItems, { targetKey: '_inventory_id_fk', foreignKey: '__inventory_id_pk' })
            RentalItems.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk' })

            const rental_data = await InventoryRate.findAll({
                raw: true,
                where: {
                    __inventory_rate_id_pk: rate_id
                },
                attributes: ["is_use_mtr_fee", "_rate_config_id_fk"],
                include: {
                    model: Inventory,
                    attributes: ["__inventory_id_pk"],
                    where: { is_deleted: 0 },
                    include: {
                        model: RentalItems,
                        attributes: ["__rental_item_id_pk"],
                        include: {
                            model: Rental,
                            where: {
                                is_deleted: 0,
                                _rate_config_id_fk: { [Op.col]: 'inventory_rate._rate_config_id_fk' }
                            },
                            attributes: ["__rental_id_pk"]
                        }
                    }
                }
            })
            for (rental of rental_data) {
                if (!update_data) {
                    if (rental && rental.is_use_mtr_fee) {
                        update_data = { metre_charge: 1 }
                    } else {
                        update_data = { metre_charge: 0 }
                    }
                }

                if (rental["inventory.rental_item.__rental_item_id_pk"])
                    rental_items.push(rental["inventory.rental_item.__rental_item_id_pk"]);
            }
        }

        if (update_data && rental_items.length) {
            await RentalItems.update(update_data, { where: { "__rental_item_id_pk": rental_items } });
            //data = await rental_item_update_amount(rental_items);
        }
        for (item_id of rental_items) {
            return_data.push(await rental_item_auto_update(item_id, true, true, user));
        }
        return data;
    }
    /**
     * @author Kirankumar
     * @summary This function is used for update the amount in rental item data.
     * @param {Rental Item ids} rental_item_ids
     * @returns Updated data
     */
    async function rental_item_update_amount(rental_item_ids) {
        const rental_items = await RentalItems.findAll({ where: { __rental_item_id_pk: rental_item_ids } })
        const data = [];
        for (curr_item of rental_items) {
            let amount = 0;
            switch (true) {
                case curr_item.metre_charge == 1 && !curr_item.metres && curr_item.units <= 0:
                    amount = (curr_item.unit_price * curr_item.qty) - curr_item.discount_amount;
                    break;
                case curr_item.metre_charge == 1 && !curr_item.metres && curr_item.units >= 1:
                    amount = (curr_item.unit_price * curr_item.qty * curr_item.units) - curr_item.discount_amount;
                    break;
                case curr_item.metre_charge == 1 && curr_item.metres && curr_item.units >= 1:
                    amount = (curr_item.unit_price * curr_item.metres * curr_item.units) - curr_item.discount_amount;
                    break;
                case curr_item.metre_charge == 1 && curr_item.metres && curr_item.units <= 0:
                    amount = (curr_item.unit_price * curr_item.metres) - curr_item.discount_amount;
                    break;
                case curr_item.units > 0:
                    amount = (curr_item.unit_price * curr_item.qty * curr_item.units) - curr_item.discount_amount;
                    break;
                case curr_item.units <= 0:
                    amount = (curr_item.unit_price * curr_item.qty) - curr_item.discount_amount;
                    break;
            }
            const update_data = { amount };
            // if(curr_item.taxable){
            //     update_data.taxable_amount = amount;
            // }
            await RentalItems.update(update_data, { where: { __rental_item_id_pk: curr_item.__rental_item_id_pk } })
            update_data.__rental_item_id_pk = curr_item.__rental_item_id_pk;
            data.push(update_data);
        }
        return data;
    }
    /**
     * @author Kirankumar
     * @summary This function is used for update the auto calculation fields in returns
     * @param {Rental item id} rental_item_id 
     * @param {rental id} rental_id 
     * @returns true or false
     */
    async function returns_auto_update(rental_item_id, rental_id) {
        const where = {};
        if (rental_item_id) {
            where.id_lineitem = rental_item_id;
        } else if (rental_id) {
            where._rental_id_fk = rental_id;
        } else {
            return false;
        }
        const return_list = await Return.findAll({ where });
        for (return_item of return_list) {
            const loss = await InventoryLoss.sum("qty", { where: { _rental_item_id_fk: rental_item_id } }) || 0;
            const balance = return_item.qty_out - (return_item.qty_in + loss) || 0;
            let cost = 0;
            let duration = 1;
            if (return_item.billing_cycle == "Weekly") {
                duration = 7;
            } else if (return_item.billing_cycle == "Monthly") {
                duration = await Rental.sum("unstored_month_length", { where: { __return_id_pk: return_item._rental_id_fk } }) || 1;
            }
            cost = return_item.price / duration * return_item.pro_rata_percent * return_item.qty_out;
            await Return.update({ loss, balance, cost }, { where: { id_lineitem: rental_item_id } })
        }
        return true;
    }

    /**
     * @author Kirankumar
     * @summary this function is used for update the logistic data.
     * @returns Status and updated data
     */
    fastify.post('/logistics/rentalitem/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await partial_return(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is used for update the partial return to rentalitem
     * @param {Rental item partial return data} data 
     * @param {Logged in user} user 
     * @returns Status and updated data
     */
    async function partial_return(body, user) {
        if (!body || !body.rental_item_id) {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
        let data = {};
        RentalItems.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk' })
        RentalItems.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk' })
        const rental_item_data = await RentalItems.findOne({
            where: { __rental_item_id_pk: body.rental_item_id },
            include: {
                model: Rental,
                attributes: ["_client_id_fk", "billing_date_start", "billing_date_end", "off_hire_partial_return_percentage", "is_meterage_charge"]
            }
        });
        let rental_data = rental_item_data.rental || {};
        if (!rental_item_data) {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
        if (body.action == "stand_down") {
            const off_hire_data = {};
            off_hire_data.qty_in = body.z_stand_down_units;
            off_hire_data.return_date = new Date();
            off_hire_data.comments = body.g_comment;
            off_hire_data.summary = "Stand Down Period: " + body.z_date_stand_down + " - " + body.z_date_end_stand_down;
            //offhire:metreCharge
            off_hire_data._rental_id_fk = rental_item_data._rental_id_fk;
            off_hire_data._inventory_id_fk = rental_item_data._inventory_id_fk;
            off_hire_data._client_id_fk = rental_data._client_id_fk;
            off_hire_data._rental_item_id_fk = rental_data.__rental_item_id_pk;
            off_hire_data.sku = rental_item_data.sku;
            //*offhire:monthLength		:rental:unstored_monthlength
            off_hire_data.days = 1;//ReturnDate - Billing Date Start + 1 have to check
            off_hire_data.return_contact = body.g_contact;
            off_hire_data.item_name = rental_item_data.item;
            off_hire_data.pro_rata_percent = 1;
            off_hire_data.price = "-" + body.z_stand_down_price;
            //need to check with linga need to give and not and witch value
            //off_hire_data.billing_date_start = body.z_date_stand_down;
            off_hire_data.billing_date_end = body.z_date_end_stand_down;
            off_hire_data.billing_cycle = rental_data.billing_cycle;
            off_hire_data.is_stand_down = 1;
            off_hire_data.rate = rental_data.rate;
            //create record in offhire table
            const created_data = await OffHire.create(off_hire_data);
            // data = await setStatus(rental_item_data.__rental_item_id_pk,user);
            // return data;
        } else if (body.action == "partial_return_clear") {
            await Return.destroy({ where: { id_lineitem: rental_item_data.__rental_item_id_pk } });

            // data = await setStatus(rental_item_data.__rental_item_id_pk,user);
            // return data;
        } else if (body.action == "partial_return") {
            if (rental_item_data.status == "PENDING") {
                return { status: true, alert: lang('Validation.partial_return_pending', user.lang) }
            }
            if (body.g_return) {
                body.g_return = parseInt(body.g_return) || 0;
            }
            if (body.g_return && body.g_return > rental_item_data.balance) {
                return { status: true, alert: lang('Validation.partial_return_more', user.lang) }
            }
            const inventory_data = await Inventory.findOne({ attributes: ["size"], where: { __inventory_id_pk: rental_item_data._inventory_id_fk } })
            const size = inventory_data ? inventory_data.size : 1;
            let rental_item_balence = parseInt(rental_item_data.balance || 0);
            let panels = 0;
            const return_data = await Return.findOne({ where: { id_lineitem: rental_item_data.__rental_item_id_pk } });
            let return_qty_in = parseInt(return_data ? (return_data.qty_in || 0) : 0);
            const days = ((new Date(rental_data.billing_date_start) - new Date(rental_data.billing_date_end)) / (1000 * 60 * 60 * 24)) || 0;
            const return_update_data = {};
            //return_update_data.qty_in = return_qty_in + rental_item_balence;
            if (rental_data.is_meterage_charge) {
                panels = size ? Math.round((body.g_return || rental_item_balence) / size, 0) : 0;
                if (return_qty_in) {
                    return_update_data.qty_in = panels + return_qty_in;
                } else {
                    return_update_data.qty_in = panels;
                }

                if (return_data.metres_in) {
                    return_update_data.metres_in = return_data.metres_in + (body.g_return || rental_item_balence);
                } else {
                    return_update_data.metres_in = (body.g_return || rental_item_balence);
                }
            } else {
                return_update_data.qty_in = return_qty_in + (body.g_return || rental_item_balence);
            }

            /**
             * return qty+ g_return
             */
            return_update_data.return_date = new Date();
            //return_update_data.comments = "";
            return_update_data.days = days;
            //return_update_data.return_contact = "";
            return_update_data.pro_rata_percent = rental_data.off_hire_partial_return_percentage;
            return_update_data.price = rental_item_data.unit_price;
            return_update_data.billing_date_start = rental_data.billing_date_start;
            return_update_data.billing_date_end = rental_data.billing_date_end;
            if (return_data)
                return_update_data.return_id = return_data.__return_id_pk;
            //Update the returns table
            await handy.create_update_table(return_update_data, user, Return, "Return", "__return_id_pk");
            const off_hire_data = {};
            off_hire_data.qty_in = body.g_return;
            off_hire_data.return_date = new DATE();
            //off_hire_data.comments = "";
            //off_hire_data.summary = "Rentol period: "+ rental_data.billing_date_start +" - "+ rental_item_data:gdate
            //offhire:metreCharge
            off_hire_data._rental_id_fk = rental_item_data._rental_id_fk;
            off_hire_data._inventory_id_fk = rental_item_data._inventory_id_fk;
            off_hire_data._client_id_fk = rental_data._client_id_fk;
            off_hire_data.rental_item_id = rental_data.__rental_item_id_pk;
            off_hire_data.sku = rental_item_data.sku;
            //offhire:monthLength		:rental:unstored_monthlength
            off_hire_data.panels = panels;
            //off_hire_data.return_contact    = lineitems:gcontact
            off_hire_data.return_date = body.g_date;
            off_hire_data.item_name = rental_item_data.item;
            off_hire_data.pro_rata_percent = rental_data.off_hire_partial_return_percentage;
            off_hire_data.price = rental_item_data.unit_price;
            off_hire_data.billing_date_start = rental_data.billing_date_start;
            off_hire_data.billing_date_end = rental_data.billing_date_end;
            off_hire_data.billing_cycle = rental_data.billing_cycle;
            off_hire_data.rate = rental_data.rate;
            off_hire_data.days = Math.round(((new Date(handy.getDateOnly(off_hire_data.return_date)) - new Date(off_hire_data.billing_date_start)) / (1000 * 60 * 60 * 24)), 0) + 1 || 0;
            //create record in offhire table
            const created_data = await OffHire.create(off_hire_data);
            // data = await setStatus(rental_item_data.__rental_item_id_pk,user);
            // return data;
        }
        const updated_staus_data = await rental_item_auto_update(body.rental_item_id, true, true, user, true);
        return { status: true, data: updated_staus_data }
    }

    /**
     * @author Kirankumar
     * @summary This rout is used for update loss for rental item
     * @return Updated data
     */
    fastify.post('/logistics/rentalitem/loss', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await update_loss(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        }
        catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is used for update the loss for rental item.
     * @param {HTTP input data} data 
     * @param {Logged in user data} user 
     */
    async function update_loss(data, user) {
        if (data.rental_item_id && data.action) {
            const rental_item_data = await RentalItems.findOne({ where: { __rental_item_id_pk: data.rental_item_id } });
            if (rental_item_data && data.action == "loss" && data.loss) {
                if (rental_item_data.status == "PENDING") {
                    return { status: true, alert: lang('Validation.loss_pending', user.lang) };
                } else if (rental_item_data.status == "IN") {
                    return { status: true, alert: lang('Validation.loss_in', user.lang) };
                } else if (rental_item_data.balance < data.loss) {
                    return { status: true, alert: lang('Validation.loss_qty', user.lang) };
                }
                const loss_data = {
                    qty: data.loss,
                    sku: rental_item_data.sku,
                    item: rental_item_data.item,
                    _inventory_id_fk: rental_item_data._inventory_id_fk,
                    _rental_id_fk: rental_item_data._rental_id_fk,
                    _rental_item_id_fk: rental_item_data.__rental_item_id_pk
                }
                await InventoryLoss.create(loss_data);
                //const data = await rental_item_auto_update(data.rental_item_id,user)||{};
                const rental_update_data = { quantity_dispatched: rental_item_data.quantity_dispatched - data.loss };
                await RentalItems.update(rental_update_data, { where: { __rental_item_id_pk: data.rental_item_id } });
                const res_data = await rental_item_auto_update(data.rental_item_id, true, true, user, true);
                return { status: true, data: res_data };
            } else if (rental_item_data && data.action == "clear_loss") {
                const delete_count = await InventoryLoss.destroy({ where: { _rental_item_id_fk: data.rental_item_id } });
                if (delete_count) {
                    const res_data = await rental_item_auto_update(data.rental_item_id, true, true, user, true);
                    return { status: true, data: res_data }
                } else {
                    return { status: true, alert: lang('Validation.no_loss', user.lang) }
                }
            } else {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }
    /**
     * @author Kirankumar
     * @summary This function is used for update the status of rental item and will create the returns
     * @param {HTTP request data} body 
     * @param {Logged in user data} user 
     * @returns Status and updated data
     */
    async function update_rental_item_return(body, user) {
        RentalItems.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk' })
        if (body && body.rental_item_id && (body.action == "single_in" || body.action == "partial_return")) {
            let data = {};
            RentalItems.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk' })
            const rental_item_data = await RentalItems.findOne({
                where: { __rental_item_id_pk: body.rental_item_id },
                include: {
                    model: Rental,
                    attributes: ["_client_id_fk", "billing_date_start", "billing_date_end", "off_hire_partial_return_percentage"]
                }
            });
            if (rental_item_data && body.action == "single_in") {
                if (rental_item_data.status == "OUT") {
                    return { status: true, alert: lang('Validation.rental_item_status_out', user.lang) }
                } else if (rental_item_data.status == "PENDING") {
                    const return_data = {
                        id_product: rental_item_data._inventory_id_fk,
                        id_lineitem: rental_item_data.__rental_item_id_pk,
                        qty_out: rental_item_data.qty,
                        sku: rental_item_data.sku,
                        id_invoice: rental_item_data._rental_id_fk,
                        id_parent: rental_item_data._rental_item_id_fk,
                        id_customer: rental_item_data.rental ? rental_item_data.rental._client_id_fk : 0,
                        _rental_id_fk: rental_item_data._rental_id_fk
                    }
                    const create_data = await Return.create(return_data);
                    data = await rental_item_auto_update(rental_item_data.__rental_item_id_pk, true, true, user, true);
                } else if (rental_item_data) {
                    // if(rental_item_data.balance > 1){
                    //     //data.gQty = rental_item_data.balance;
                    //     //"Are all items being returned? Otherwise change the amount below."
                    // }
                    const return_data = await Return.findOne({ where: { id_lineitem: rental_item_data.__rental_item_id_pk } });
                    if (return_data && return_data.balance != 0) {
                        const update_data = {};
                        if (return_data.qty_in) {
                            update_data.qty_in = (parseInt(return_data.qty_in) || 0) + (parseInt(rental_item_data.balance) || 0)
                        } else {
                            update_data.qty_in = rental_item_data.balance;
                        }
                        update_data.return_id = return_data.__return_id_pk;
                        await handy.create_update_table(update_data, user, Return, "Return", "__return_id_pk")
                        data = await rental_item_auto_update(rental_item_data.__rental_item_id_pk, true, true, user, true);
                    } else {
                        data = {};
                    }
                }
                var history = {};
                if (Object.keys(data).length > 0) {
                    var notes_obj = {
                        "rental_id": data.rental_item_id,
                        "notes": lang('History.rental_item_' + body.action, user.lang, [rental_item_data.item])
                    }
                    const notes_data = await handy.create_notes(notes_obj, user);
                    history = notes_data.data.dataValues;
                }
                return { status: true, data, history: history };

            } else if (body.action == "partial_return") {
                data = await partial_return(body, user);
                if (Object.keys(data).length > 0 && data.data && Object.keys(data.data).length > 0) {
                    var notes_obj = {
                        "rental_id": data.data.rental_item_id,
                        "notes": lang('History.rental_item_' + body.action, user.lang, [rental_item_data.item])
                    }
                    const notes_data = await handy.create_notes(notes_obj, user);
                    data.history = notes_data.data.dataValues;
                }
                return data;
            } else {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
        } else if (body && body.rental_id && (body.action == "in" || body.action == "out")) {
            let data = {};
            const rental_items_data = await RentalItems.findAll({
                where: { _rental_id_fk: body.rental_id, type: { [Op.in]: ['RENTAL', 'KIT', 'SUBRENT'] } },
                include: {
                    model: Rental,
                    attributes: ["_client_id_fk"]
                }
            })
            const returns_data = await Return.findAll({ where: { _rental_id_fk: body.rental_id } });
            //let pending = 0;
            //let out = 0;
            const hours_in = [];
            const hours_out = [];
            for (item of rental_items_data) {
                //if(item.status == "PENDING")pending++;
                //if(item.status != "IN")out++;
                if (item.hours_in != null && item.hours_in != 0) {
                    hours_in.push(item);
                }
                if (item.hours_out != null && item.hours_out != 0) {
                    hours_out.push(item);
                }
            }
            //before calling this Need to show alert(Have all items been returnd?) with yes or no
            if (body.action == "in") {
                data = await return_all_items(body.rental_id, user);
                if (data && data.data.length > 0) {
                    var notes_obj = {
                        "rental_id": body.rental_id,
                        "notes": lang('History.rental_item_' + body.action, user.lang)
                    }
                    const notes_data = await handy.create_notes(notes_obj, user);
                    data.history = notes_data.data.dataValues;
                }
            } else if (body.action == "out") {
                if (!body.confirmation) {
                    if (rental_items_data.length == returns_data.length) {
                        return { status: true, confirmation: lang('Validation.rental_return_out_conformation', user.lang) }
                    }
                }
                if (body.confirmation == 1) {
                    await OffHire.destroy({ where: { _rental_id_fk: body.rental_id } });
                    await Return.destroy({ where: { _rental_id_fk: body.rental_id } });
                    await InventoryLoss.destroy({ where: { _rental_id_fk: body.rental_id } });
                } else {
                    const create_return_data = [];
                    for (rental_item of rental_items_data) {
                        if (rental_item.status != "OUT" && rental_item.status != "IN") {
                            const return_update_data = {
                                id_product: rental_item._inventory_id_fk,
                                id_lineitem: rental_item.__rental_item_id_pk,
                                qty_out: rental_item.qty,
                                sku: rental_item.sku,
                                id_rental: rental_item._rental_id_fk,
                                id_invoice: rental_item._rental_id_fk,
                                _rental_id_fk: rental_item._rental_id_fk,
                                id_parent: rental_item._rental_item_id_fk,
                                id_customer: rental_item.rental ? rental_item.rental._client_id_fk : 0
                            }
                            create_return_data.push(return_update_data);
                        }
                    }
                    if (create_return_data.length) {
                        await Return.bulkCreate(create_return_data);
                    }
                }

                const status_data = [];
                for (item of rental_items_data) {
                    const single_status = await rental_item_auto_update(item.__rental_item_id_pk, true, true, user, true);
                    if (single_status)
                        status_data.push(single_status)
                }
                data = { status: true, data: status_data }
            }
            if (data && data.data.length > 0) {
                var notes_obj = {
                    "rental_id": body.rental_id,
                    "notes": lang('History.rental_item_' + body.action, user.lang)
                }
                const notes_data = await handy.create_notes(notes_obj, user);
                data.history = notes_data.data.dataValues;
            }
            return data;
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used for return all items
     * @param {rental id} rental_id 
     * @returns status and return table data 
     */
    async function return_all_items(rental_id, user) {
        const returns_data = await Return.findAll({ where: { _rental_id_fk: rental_id } });
        const hourse_in = await RentalItems.findAll({ where: { _rental_id_fk: rental_id, type: { [Op.in]: ['RENTAL', 'KIT', 'SUBRENT'] }, hours_in: { [Op.ne]: null } } });
        const hourse_out = await RentalItems.findAll({ where: { _rental_id_fk: rental_id, hours_in: { [Op.ne]: [0, null], type: { [Op.in]: ['RENTAL', 'KIT', 'SUBRENT'] } } } })
        if (!hourse_in.length && hourse_out.length) {
            return { status: true, alert: lang('Validation.partial_return_in_hourse_alert', user.lang) };
        }
        let status_data = [];
        for (return_item of returns_data) {
            const balance = parseInt(return_item.balance) || 0;
            const qty_in = parseInt(return_item.qty_in) ? parseInt(return_item.qty_in) + balance : balance;
            const update_data = {
                qty_in,
                creation_date: new Date(),
                __return_id_pk: return_item.__return_id_pk
            }
            await handy.create_update_table(update_data, user, Return, "Return", "__return_id_pk");
            const single_status = return_item.id_lineitem ? await rental_item_auto_update(return_item.id_lineitem, true, true, user, true) : {};
            if (single_status)
                status_data.push(single_status)
        }
        return { status: true, data: status_data };
    }


    /**
     * @deprecated 1.0.0
     * @author Kirankumar
     * @summary This function used for get the status Rental item
     * @param {Rental item id} id_lineitem 
     * @return Status
     */
    async function setStatus(id_lineitem, user) {
        let status = "";
        const valid = await Return.count({ where: { id_lineitem } }) || 0;
        const sum = await Return.sum("balance", { where: { id_lineitem } }) || 0;
        if (valid == 0) {
            status = "PENDING";
        } else if (valid == 1 && sum > 0) {
            status = "OUT";
        } else if (valid == 1 && sum == 0) {
            status = "IN";
        }
        return await handy.create_update_table({ rental_item_id: id_lineitem, status: status }, user, RentalItems, "RentalItems", "__rental_item_id_pk");
    }

    /**
     * @author Kirankumar
     * @summary This function is used for update the long term hire data to rental
     * @param {HTTP request body} body 
     * @param {Logged in user details} user 
     * @returns Status and message or Updated data
     */
    async function updateLongTerm(body, user) {
        if (!body || !body.action || !body.rental_id) {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
        const rental_count = await Rental.count({ where: { __rental_id_pk: body.rental_id, is_deleted: 0 } })
        const update_data = { rental_id: body.rental_id };
        if (rental_count && body.action == "on") {
            update_data.long_term_hire = 1;
            update_data.billing_period_amount = 1;
        } else if (rental_count && body.action == "off") {
            update_data.long_term_hire = 0;
            //update_data.billing_date_start = "";
            //update_data.billing_cycle = "";
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
        const data = await handy.create_update_table(update_data, user, Rental, "Rental", "__rental_id_pk")
        var notes_obj = {
            "rental_id": data.data.rental_id,
            "notes": lang('History.longterm_' + body.action, user.lang)
        }
        const notes_data = await handy.create_notes(notes_obj, user);
        data.history = notes_data.data.dataValues;
        return data;
    }
    /**
     * @author Kirankumar
     * @summary This function is used to update the job end date
     * @param {input data} data 
     * @param {Logged in user data} user 
     * @returns Status and message
     */
    async function set_end_job(data, user) {
        if (data && data.rental_id) {
            const rental_id = data.rental_id
            //check valid rental or not
            let check_validate = await Rental.count({ where: { __rental_id_pk: rental_id, _company_id_fk: user.company_id } })
            if (!check_validate) {
                return { status: false, message: lang('Validation.invalid_rental', user.lang) };
            }
            //get attributes
            const rental_get = ["period_no", "date_start", "date_end", "_rate_config_id_fk", "off_hire_date", "is_rate_calculator"];
            const rate_get = ["in_days", "is_hourly"];
            //join table
            Rental.belongsTo(Rate, { targetKey: '__rate_config_id_pk', foreignKey: '_rate_config_id_fk' });
            //get data from db
            let query_table = await Rental.findOne({ attributes: rental_get, where: { __rental_id_pk: rental_id }, include: { model: Rate, attributes: rate_get } })
            query_table = await handy.transformnames('LTR', query_table, "Rental", { Rate: "config_rate" }, user);
            if (query_table) {
                let period_no = query_table.period_no;

                if (query_table.config_rate && !(query_table.config_rate.is_hourly)) { //hourly check
                    let rate_period = query_table.config_rate.in_days;
                    let amount = moment(query_table.date_end).diff(moment(query_table.date_start), 'days')
                    period_no = amount / rate_period;
                }
                //Rental update
                const rental_update = await Rental.update({ date_end: query_table.off_hire_date, is_end_date_set: 1 }, { where: { __rental_id_pk: rental_id } })

                //Items update
                if (query_table.is_rate_calculator) {
                    const items_updt = await RentalItems.update({ units: period_no }, { where: { _rental_id_fk: rental_id } })
                }
                return { status: true, message: lang('Validation.record_updated', user.lang) }
            }
        }
        else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }

    /**
    * @author Kirankumar
    * @summary This function is used for create or update rental data
    * @param {rental data} data 
    * @param {Logged in user data} user 
    * @returns status and updated data
    */
    async function create_update_rental(in_data, user) {
        let del = {};
        let col = {};
        if (in_data) {
            //checking the client is valid or not for rental
            if (in_data.client_id) {
                const client_data = await Client.findOne({ attributes: ["address_delivery", "telephone", "parent_id"], where: { __client_id_pk: in_data.client_id } });
                if (!client_data)
                    return { status: false, message: lang('Validation.invalid_client', user.lang) }
                if (!client_data.parent_id) {
                    in_data.delivery_address = client_data.address_delivery;
                    in_data.contact_phone = client_data.telephone;
                }
            }
            //address get from client and save in rental
            if (in_data.address_id) {
                let address = "";
                let address_records = await Address.findOne({ raw: true, attributes: ["__address_id_pk", "address1", "city", "state", "country", "zip", "is_active", "is_billing", "is_delivery", "is_default"], where: { __address_id_pk: in_data.address_id } });
                if (address_records) {
                    address = await handy.format_address(address_records, user.company_id);
                }
                in_data.address_full = address;
            } else if (in_data.address_id == 0) {
                in_data.address_full = "";
            }

            if (in_data.deposit_received == 1) {
                in_data.deposit_date_received = new Date();
            } else if (in_data.deposit_received == 0) {
                in_data.deposit_date_received = "";
            }
            if (in_data.deposit_balance_received == 1) {
                in_data.deposit_balance_date_received = new Date();
            } else if (in_data.deposit_balance_received == 0) {
                in_data.deposit_balance_date_received = "";
            }
            //Updating the rental type
            if (in_data.is_quote)
                in_data.rental_type = 'Quote';
            if (in_data.is_rental)
                in_data.rental_type = 'Rental';

            if (!in_data.rental_id) {
                if (in_data.is_quote) {
                    const rental_status = await ConfigRentalStatus.findOne({ attributes: ["__config_rental_status_id_pk"], where: { _company_id_fk: user.company_id, status_label: "Quote" } });
                    if (rental_status) {
                        in_data._config_rental_status_id_fk = rental_status.__config_rental_status_id_pk;
                    }
                    in_data.stepper = 1;
                } else {
                    const rental_status = await ConfigRentalStatus.findOne({ attributes: ["__config_rental_status_id_pk"], where: { _company_id_fk: user.company_id, status_label: "Reserved Unpaid" } });
                    if (rental_status) {
                        in_data._config_rental_status_id_fk = rental_status.__config_rental_status_id_pk;
                    }
                    in_data.stepper = 2;
                }

                Administration.belongsTo(Rate, { targetKey: '__rate_config_id_pk', foreignKey: '_rate_config_id_fk' })
                const admin_data = await Administration.findOne({
                    attributes: ["use_surcharge", "_rate_config_id_fk", "send_end_date_reminders", "default_billing_period", "checkbox_no_collection", "default_time_out", "default_time_in", "checkbox_long_term", "checkbox_rate_calc", "checkbox_tc", "set_billing", "round_days", "delivery_default", "de_prep_days", "checkbox_add_de_prep_days", "checkbox_add_prep_days", "prep_days"], where: { _company_id_fk: user.company_id }, include: {
                        model: Rate,
                        attributes: ["in_days", "is_hourly", "is_daily"]
                    }
                });
                in_data.use_surcharge = admin_data.use_surcharge || 0;
                in_data.is_rate_calculator = admin_data.checkbox_rate_calc;
                const default_tax = await TaxRate.findOne({ attributes: ["__tax_rate_id_pk"], where: { is_default: 1, _company_id_fk: user.company_id } });
                const main_business = await ConfigBusiness.findOne({ attributes: ["__business_id_pk"], where: { _company_id_fk: user.company_id, is_deleted: 0 }, order: [["is_main_business", "DESC"], ["__business_id_pk", "ASC"]] });
                if (main_business)
                    in_data.selected_company_no = main_business.__business_id_pk

                if (default_tax)
                    in_data._tax_rate_id_fk = default_tax.__tax_rate_id_pk;

                in_data.delivery = "yes";
                in_data.period_no = 1;
                in_data.date = new Date();
                const default_rate = admin_data ? admin_data.config_rate : null;
                in_data.date_start = new Date();
                in_data.date_end = new Date();
                if (default_rate && default_rate.is_hourly && admin_data.default_time_out) {
                    const start_time = admin_data.default_time_out.split(":");
                    in_data.date_end = new Date(in_data.date_end.setHours(start_time[0], start_time[1], start_time[2]))
                    in_data.date_end = new Date(in_data.date_end.setHours(in_data.date_end.getHours() + default_rate.in_days));
                    if (in_data.date_end != "Invalid Date")
                        in_data.time_end = in_data.date_end.toTimeString().split(" ")[0];
                } else if (default_rate) {
                    in_data.date_end = new Date(in_data.date_end.setDate(in_data.date_end.getDate() + default_rate.in_days));
                }
                if (admin_data.round_days) {
                    in_data.date_end = new Date(in_data.date_end.setDate(in_data.date_end.getDate() - 1));
                    in_data.is_round_period_no = 1;
                }
                in_data.delivery_date = in_data.date_start;
                //selected_company 
                const business = await ConfigBusiness.findOne({ attributes: ["__business_id_pk", "company"], where: { _company_id_fk: user.company_id, is_deleted: 0 }, order: [['is_main_business', 'DESC']] });
                if (business) {
                    in_data.selected_company_no = business.__business_id_pk;
                    in_data.selected_company = business.company;
                    //in_data._business_id_fk = business.__business_id_pk;
                }
                if (admin_data.delivery_default = "Delivery" || in_data.delivery == "yes") {
                    in_data.delivery_date = in_data.date_start;
                    if (!admin_data.checkbox_no_collection) {
                        in_data.collection_date = in_data.date_end;
                    }

                    if (admin_data.prep_days && admin_data.checkbox_add_prep_days && ((in_data.delivery_date && new Date(in_data.delivery_date) != "Invalid Date") || new Date(in_data.delivery_date) != "Invalid Date")) {
                        const delivery_date = (in_data.delivery_date && new Date(in_data.delivery_date) != "Invalid Date") ? in_data.delivery_date : in_data.delivery_date;
                        const prep_date = new Date(new Date(delivery_date).setDate(new Date(delivery_date).getDate() - admin_data.prep_days))
                        in_data.prep_date = prep_date;
                    }

                    if (admin_data.de_prep_days && admin_data.checkbox_add_de_prep_days && ((in_data.collection_date && new Date(in_data.collection_date) != "Invalid Date") || new Date(in_data.collection_date) != "Invalid Date")) {
                        const collection_date = (in_data.collection_date && new Date(in_data.collection_date) != "Invalid Date") ? in_data.collection_date : in_data.collection_date;
                        const de_prep_date = new Date(new Date(collection_date).setDate(new Date(collection_date).getDate() - admin_data.de_prep_days))
                        in_data.de_prep_date = de_prep_date;
                    }
                }
                if (admin_data) {
                    in_data.send_reminder = admin_data.send_end_date_reminders;
                    in_data.attach_terms = admin_data.checkbox_tc;
                    if (admin_data.checkbox_no_collection != 1) {
                        in_data.collection = "yes";
                        in_data.collection_date = in_data.date_end;
                    }
                    if (admin_data.checkbox_long_term) {
                        in_data.long_term_hire = 1;
                        in_data.billing_cycle = admin_data.default_billing_period;
                        in_data.billing_date_start = new Date();
                        in_data.check_box_billing_set = admin_data.set_billing || 0;
                    }
                    if (admin_data.default_time_out)
                        in_data.time_start = admin_data.default_time_out;
                    if (admin_data.default_time_in)
                        in_data.time_end = admin_data.default_time_in;
                    if (admin_data._rate_config_id_fk)
                        in_data._rate_config_id_fk = admin_data._rate_config_id_fk;
                }
                in_data.billing_due_date = new Date();
                in_data.sub_rental_delivery_pickup_date = new Date();
            } else {
                if (in_data.delivery_date) {
                    del.date_end = in_data.delivery_date;
                    del.date_start = in_data.delivery_date;
                }
                if (in_data.delivery_time) { }
                del.time_start = in_data.delivery_time;
                if (in_data.collection_date) {
                    col.date_start = in_data.collection_date;
                    col.date_end = in_data.delivery_date;
                }
                if (in_data.collection_time)
                    col.time_start = in_data.collection_time;
            }

            let out_data = await handy.create_update_table(in_data, user, Rental, "Rental", "__rental_id_pk");
            if (out_data.status && out_data.data.rental_id) {
                if (Object.keys(del).length) {
                    await Task.update(del, { where: { _rental_id_fk: out_data.data.rental_id, is_deleted: 0, is_delivery: 1 } });
                }
                if (Object.keys(col).length) {
                    await Task.update(col, { where: { _rental_id_fk: out_data.data.rental_id, is_deleted: 0, is_collection: 1 } });
                }
                if (in_data.selected_company_no) {
                    await RentalItems.update({ selected_company_no: in_data.selected_company_no }, { where: { _rental_id_fk: out_data.data.rental_id } });
                }
                if (in_data.period_no >= 0) {
                    await SubRent.update({ period_no: in_data.period_no, total_cost: Sequelize.literal('cost *' + in_data.period_no) }, { where: { _rental_id_fk: out_data.data.rental_id } });
                }
                const billing_dates_data = await handy.update_rental_billing_dates(out_data.data.rental_id, user);
                out_data.data = { ...out_data.data, ...billing_dates_data }
                var filteredData;
                for (var find in in_data) {
                    if (rental_history.indexOf(find) > -1) {
                        filteredData = find;
                    }
                }
                if (filteredData) {
                    var notes_obj = {
                        "rental_id": out_data.data.rental_id,
                        "notes": lang('History.' + filteredData + "_" + in_data[filteredData], user.lang)
                    }
                    if (filteredData == 'stepper') {
                        notes_obj.notes = lang('History.' + filteredData + "_" + stepper_values[in_data.stepper], user.lang)
                    }
                    const notes_data = await handy.create_notes(notes_obj, user);
                    out_data.history = notes_data.data.dataValues;
                }
                if (!in_data.rental_id) {
                    const task = {
                        rental_id: out_data.data.rental_id
                    };
                    if (in_data.delivery == "yes") {
                        task.delivery_date = in_data.delivery_date;
                        task.delivery = "yes";
                    }
                    if (in_data.collection == "yes") {
                        task.collection_date = in_data.collection_date;
                        task.collection = "yes";
                    }
                    await lgc.delivery_collection_task_create_or_delete(task, user)
                }
            }
            return out_data;
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }

    }

    /**
     * @author Kirankumar
     * @summary This function is used to create or update the rental item
     * @param {Rental item data} data 
     * @param {Logged in user details} user 
     * @returns status and updated rental item data
     */
    async function create_or_update_rental_item(data, user) {
        //let item = "";

        if (!(data && data.rental_item_id)) {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
        const item = await RentalItems.findOne({ raw: true, attributes: [["_inventory_id_fk", "inventory_id"], "type"], where: { __rental_item_id_pk: data.rental_item_id } })
        if (!item) {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
        if (data.rate_config_id != undefined && item.inventory_id) {
            data.unit_price = 0;
            const inventory_rate = await InventoryRate.findOne({ attributes: ["price_extra_tax"], where: { _inventory_id_fk: item.inventory_id, _rate_config_id_fk: data.rate_config_id } })
            if (inventory_rate) {
                data.unit_price = inventory_rate.price_extra_tax || 0;
            }
        }

        //if (data.rental_item_id && (data.qty || data.unit_price || data.units || data.discount_rate)) {
        //item = await RentalItems.findOne({ attributes: ["_rental_id_fk", "qty", "unit_price", "units", "discount_rate"], where: { __rental_item_id_pk: data.rental_item_id } });
        // if (item) {
        //     let qty = data.qty || item.qty; qty = qty ? parseInt(qty) : 0;
        //     let units = data.units || item.units; units = units ? parseInt(units) : 0;
        //     let unit_price = data.unit_price || item.unit_price; unit_price = unit_price ? parseFloat(unit_price) : 0;
        //     let discount_rate = data.discount_rate || item.discount_rate;
        //     discount_rate = discount_rate ? parseFloat(discount_rate) : 0;
        //     discount_rate = discount_rate > 1 ? (discount_rate / 100) : discount_rate;
        //     qty = (qty && units) ? qty * units : (qty || units);
        //     const total = qty * unit_price;
        //     const discount_amount = total * discount_rate;
        //     data.discount_amount = discount_amount;
        //     data.total_price = Number(total - discount_amount).toFixed(2);
        // }
        //}
        if (!data.rental_item_id) {
            data.status = "PENDING";
        }
        const out_data = await handy.create_update_table(data, user, RentalItems, "RentalItems", "__rental_item_id_pk");
        //old calculations
        // if (item && item._rental_id_fk) {
        //     calculate_rental_update(item._rental_id_fk, user);
        // }
        return out_data;
    }

    /**
     * @deprecated 1.0.0
     * @author Kirankumar
     * @summary This function will update rental calculated data to rental table
     * @param {Rental id} rental_id 
     * @param {Logged in user data} user 
     * @returns Void
     */
    async function calculate_rental_update(rental_id, user, update = true) {
        try {
            let rental_data = await Rental.findOne({ where: { __rental_id_pk: rental_id } });
            rental_data.items = await RentalItems.findAll({ where: { _rental_id_fk: rental_id } })
            rental_data = await handy.transformnames('LTR', rental_data, "Rental", { RentalItems: "rental_item" }, user);
            const cal_data = await calculate_rental_data(rental_data, user, rental_id)
            rental_data = await handy.transformnames('RTL', cal_data, "Rental", { RentalItems: "rental_item" }, user);
            if (update)
                await Rental.update(rental_data, { where: { __rental_id_pk: rental_id } });
            return cal_data;
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * @author Kirankumar
     * @summary This function will check the off haire conditions
     * @param {rental id} rentalID 
     * @returns status and message or empty string
     */
    async function offhire_set_in_out(rentalID) {
        //Pending
        const pending_str = await RentalItems.count({ where: { _rental_id_fk: rentalID, status: "PENDING" } })
        //Out
        const out_str = await RentalItems.count({ where: { _rental_id_fk: rentalID, status: { [Op.ne]: "IN" } } })
        //Hours in
        const hrs_in_str = await RentalItems.findAll({ raw: true, attributes: ["hours_in", "lineitemserial"], where: { _rental_id_fk: rentalID, hours_in: { [Op.ne]: 'NULL' } } });
        //Hours out
        let hours_out = { [Op.and]: [{ [Op.ne]: 0 }, { [Op.ne]: 'NULL' }] }
        const hrs_out_str = await RentalItems.findAll({ raw: true, attributes: ["hours_in", "lineitemserial"], where: { _rental_id_fk: rentalID, hours_out } });
        let message = "";
        if (hrs_out_str.length > 1 && hrs_in_str.length === 0) {
            message = "There are items set with hours out and no hours in! These amounts are updated to the inventory and need to be completed prior to off hiring the job."
            return { status: true, alert: message };
        }

        if (pending_str) {
            message = "There are items set to the status of Pending in the Logistics tab. Please click the OUT button or SCAN OUT the item to set status to OUT before returning items back into the software";
            return { status: true, alert: message };
        }

        if (out_str) {
            message = "Have all items been returned?";
            return { status: true, alert: message };
        }
        return message;
    }

    /**
     * @author Kirankumar
     * @summary This function is usefull to update the out status for rental(offhair) 
     * @param {Logged in user data} user 
     * @param {Rental data} data 
     * @param {Rental id} rentalID 
     * @param {check the request from witch rout} table 
     * @returns Status and message
     */
    async function offhire_out(user, data, rentalID, table) {
        if (!data.off_hire_number) {
            let returntab_get = await Return.findAll({ raw: true, attributes: ["balance", "qty_in"], where: { _rental_id_fk: rentalID } });
            let hrs_get = await RentalItems.findAll({ raw: true, attributes: ["hours_in", "lineitemserial"], where: { _rental_id_fk: rentalID, hours_in: { [Op.ne]: 'NULL' }, hours_out: { [Op.ne]: 'NULL' } } });
            // if (returntab_get.length > 0) {
            //     let set_id_invoice = rentalID;
            //     let set_rental_id_fk = rentalID;
            // }
            for (let rtr = 0; rtr < returntab_get.length; rtr++) {
                let set_qty_in = "";
                let set_return_date = "";
                if (returntab_get[rtr].balance != 0) {
                    if (returntab_get[rtr].qty_in) {
                        set_qty_in = returntab_get[rtr].qty_in + returntab_get[rtr].balance;
                    }
                    else {
                        set_qty_in = returntab_get[rtr].balance;
                    }
                    set_return_date = new Date().toISOString().split('T')[0];
                }
                let ret_fields = { qty_in: set_qty_in, return_date: set_return_date }
                if (returntab_get.length > 0) {
                    ret_fields = { ...ret_fields, id_invoice: rentalID, _rental_id_fk: rentalID }
                    //ret_fields = { ...ret_fields, id_invoice: set_id_invoice, _rental_id_fk: set_rental_id_fk }
                }
                //update return table
                let update_currReturn = await Return.update(ret_fields, { where: { _rental_id_fk: rentalID } })

                //update asset
                if (hrs_get.length > 0) {
                    for (let rst = 0; rst < hrs_get.length; rst++) {
                        let asset_update = await AssetManagement.update({ hours_used: hrs_get[rst].hours_in }, { where: { __asset_management_id_pk: hrs_get[rst].lineitemserial } })
                    }
                }
            }
            let re_hirefunc = await update_offhire(user, data, rentalID, table)
            return re_hirefunc;
        }
        else {
            return { status: false, message: lang('Validation.record_not_updated', user.lang) }
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used to update off hair for rental
     * @param {Logged in user data} user 
     * @param {Rental data or off hair data} data 
     * @param {Rental id} rentalID 
     * @param {check the request from witch rout} table 
     * @returns Status and message and if update data refresh as true
     */
    async function update_offhire(user, data, rentalID, table) {
        let return_data = [];
        if (data.is_all_returned) {
            return_data = await return_all_items(rentalID, user);
            return_data = return_data.data;
        }
        if (!data.off_hire_number) {
            if (table == "Rental") {
                let ps_offhire_set_in = await offhire_set_in_out(user, data, rentalID);
                if (ps_offhire_set_in && ps_offhire_set_in.status != undefined) {
                    return ps_offhire_set_in;
                }
            }
            let get_val_rentals = await Rental.findAll({ raw: true, attributes: ["_invoice_id_fk"], where: { __rental_id_pk: rentalID } });
            let get_config_status = await ConfigRentalStatus.findAll({ raw: true, attributes: ["__config_rental_status_id_pk"], where: { _company_id_fk: user.company_id, status_label: { [Op.in]: ['Completed'] } } })
            let off_invoice_id_fk = rentalID.toString().padStart(6, '0') + "/" + new Date().getTime();
            let status_dispatch = 3;
            let off_hire_date = new Date().toISOString().split('T')[0];
            if (data.off_hire_date) {
                off_hire_date = data.off_hire_date;
            }
            let off_hired = 1;
            let off_hire_staff = user.username;
            let _config_rental_status_id_fk = get_config_status[0].__config_rental_status_id_pk;
            let off_hire_comments = data.off_hire_comments ? data.off_hire_comments : "";
            let off_hire_contact = data.off_hire_contact ? data.off_hire_contact : "";
            //Rental update
            let update_data = { off_hire_number: off_invoice_id_fk, status_dispatch: status_dispatch, off_hire_date: off_hire_date, off_hired: off_hired, off_hire_staff: off_hire_staff, off_hire_comments: off_hire_comments, off_hire_contact: off_hire_contact };
            if (table == "outpopup") {
                update_data._config_rental_status_id_fk = _config_rental_status_id_fk;
            }
            let rentals_updt = await Rental.update(update_data, { where: { __rental_id_pk: rentalID } });

            //Items update
            let prorata_period = 1;
            let prorata_date = new Date().toISOString().split('T')[0];
            let update_ritems = await RentalItems.update({ off_hire_date: off_hire_date, prorata_period: prorata_period, prorata_date: prorata_date }, { where: { _rental_id_fk: rentalID } })
            update_data = await handy.transformnames('LTR', update_data, "Rental", {}, user);
            //Get items and update in loss table
            // const items_find = await RentalItems.findAll({ raw: true, attributes: ["_inventory_id_fk", "sku", "item", "loss"], where: { _rental_id_fk: rentalID, loss: { [Op.gte]: 1 } } })
            // if (items_find.length > 0) {
            //     let temp_loss = [];
            //     for (let itm = 0; itm < items_find.length; itm++) {
            //         let loss_set = { id_product: items_find[itm]._inventory_id_fk, sku: items_find[itm].sku, item: items_find[itm].item, qty: items_find[itm].loss };
            //         temp_loss.push(loss_set);
            //     }
            //     const loss_update = await InventoryLoss.bulkCreate(temp_loss);
            // }
            await updateLoss(rentalID);
            return { status: true, refresh: true, data: update_data, return_data };
        }
        else if (data.off_hire_number) {
            const get_val_rentals = await Rental.findAll({ raw: true, attributes: ["balance"], where: { __rental_id_pk: rentalID } });
            const get_config_status = await ConfigRentalStatus.findAll({ raw: true, attributes: ["__config_rental_status_id_pk", "status_label"], where: { _company_id_fk: user.company_id, status_label: { [Op.in]: ['Active Job Paid', 'Reserved Unpaid'] } } })
            let status_set = "";
            if (get_val_rentals[0].balance > 0) {
                let filter_config_status = get_config_status.filter(obj => obj.status_label == 'Reserved Unpaid');
                if (filter_config_status.length > 0) {
                    status_set = filter_config_status[0].__config_rental_status_id_pk;
                }
            }
            else {
                let filter_config_status = get_config_status.filter(obj => obj.status_label == 'Active Job Paid');
                if (filter_config_status.length > 0) {
                    status_set = filter_config_status[0].__config_rental_status_id_pk;
                }
            }
            let update_data = { _config_rental_status_id_fk: status_set, off_hire_number: "", off_hire_date: "", off_hire_staff: "", off_hire_contact: "" };
            const rentals_updt = await Rental.update(update_data, { where: { __rental_id_pk: rentalID } })
            update_data = await handy.transformnames('LTR', update_data, "Rental", {}, user);
            return { status: true, refresh: true, data: update_data, return_data }
        }
        else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
    }


    /**
     * @author Kirankumar
     * @summary This functio used to get rental data by rental id
     * @param {HTTP ressponds} res 
     * @param {Rental id} rental_id 
     * @param {Logged in user data} user 
     * @returns status and Rental data
     */
    async function get_rental_data(rental_id, user) {
        if (rental_id) {
            //let get_data = ["__rental_id_pk", "_address_id_fk", "_client_id_fk", "_invoice_id_fk", "_project_id_fk", "_rate_config_id_fk", "_config_rental_status_id_fk", "_config_term_id_fk", "_staff_id_fk", "_company_id_fk", "_task_id_fk", ["_tax_rate_id_fk", "tax_rate_id"], "selected_business_id", "serial_no", "account_type", "attach_images", "attach_terms", "time_end", "time_start", "billing_cycle", "billing_date_end_ts", "billing_date_start", "billing_date_start_ts", "billing_due_date", "billing_period_amount", "bond", "bond_paid_amount", "booking_period", "check_box_billing_set", "check_box_on_hire", "collection", "collection_date", "collection_date_end", "collection_notes", "collection_time", "collection_time_end", "collection_zone", "collection_charge", "collection_priorty", "collection_range", "color", "commission", "company", "company_discount", "company_address", "company_contact", "address_full", "rental_type", "contact_email", "contact_phone", "company_contact_mobile", "company_contact_phone", "company_email", "contact_first_name", "contract_finalisation_amount", "contract_finalisation_date", "contract_pdf", "contract_version", "credit_card_label", "credit_card_rate", "customer_notes", "damage", "damage_description", "date_start", "date_payment", "date_end", "de_prep_date", "de_prep_time", "pickup", "return", "delivery", "delivery_address", "delivery_date", "delivery_date_end", "delivery_notes", "delivery_time", "delivery_time_end", "delivery_zone", "delivery_charge", "delivery_priorty", "delivery_range", "deposit", "deposit_balance_date_received", "deposit_balance_due", "deposit_balance_received", "deposit_date_received", "deposit_due_date", "deposit_received", "deposit_received_by", "deposit_req", "description", "discount_cash", "discount_selector", "disp_balance", "disp_profit", "document_container", "drag_and_drop_tree_json", "driver", "driver_collection", "driver_name", "due_date", "emailed_by", "emailed_on", "event_venue", "hourly", "installation_date", "installation_time", "contract_no", "invoice_sent", "invoiced_by", "invoiced_on", "job_name", "job_status", "job_type", "last_billing_date", "location", "long_term_hire", "meterage_charge", "method", "mod_date", "notes", "off_hire_comments", "is_meterage_charge", "prep_date", "prep_time", "option1", "option2", "option3", "option4", "option5", "option6", "is_rental", "is_quote", "off_hire_contact", "off_hired", "use_surcharge", "period_no"]
            let client_get = ["name_full", "account_customer", "account_name", "email", ["parent_id", "contact_parent_id"]];
            let address_get = ["address1", "city", "state", "country", "zip", "is_active", "is_billing", "is_delivery"]
            Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
            Rental.belongsTo(Address, { targetKey: '__address_id_pk', foreignKey: '_address_id_fk' });
            let rental_get = await Rental.findOne({ attributes: { exclude: ["updated_by", "created_at", "updated_at"] }, where: { is_deleted: 0, _company_id_fk: user.company_id, __rental_id_pk: rental_id }, include: [{ model: Client, attributes: client_get }, { model: Address, attributes: address_get }] })
            rental_get = await handy.transformnames('LTR', rental_get, "Rental", { address: "Address", client: "Client" }, user);
            if (rental_get) {
                //rental_get[0].address = [];
                // let temp_add = {};
                // temp_add['address_id'] = rental_get[0].address_id;
                // temp_add['address'] = rental_get[0].address1;
                // temp_add['city'] = rental_get[0].city;
                // temp_add['state'] = rental_get[0].state;
                // temp_add['country'] = rental_get[0].country;
                // temp_add['zip'] = rental_get[0].zip;
                // temp_add['is_billing'] = rental_get[0].is_billing;
                // temp_add['is_active'] = rental_get[0].is_active;
                // temp_add['is_delivery'] = rental_get[0].is_delivery;
                // rental_get[0].address.push(temp_add);
                //Notes
                let get_notes = await ClientNotes.findAll({ order: [['__client_notes_id_pk', 'DESC']], attributes: [["__client_notes_id_pk", "rental_notes_id"], "notes", "created_at", "created_by"], where: { _rental_id_fk: rental_id } })
                for (let gtn = 0; gtn < get_notes.length; gtn++) {
                    let get_notes_staff = await Auth.findOne({ raw: true, attributes: ["display_staff_name"], where: { __staff_id_pk: get_notes[gtn].created_by, is_deleted: 0 } })
                    get_notes[gtn].created_by = get_notes_staff ? get_notes_staff.display_staff_name : "";
                }
                rental_get.notes = get_notes;
                let rental_staff_name = await Auth.findOne({ raw: true, attributes: ["display_staff_name"], where: { __staff_id_pk: rental_get.created_by, is_deleted: 0 } })
                if (rental_staff_name) {
                    rental_get.display_staff_name = rental_staff_name.display_staff_name;
                }
                //Items
                let get_data_item = ["__rental_item_id_pk", "_rental_item_id_fk", "_rate_config_id_fk", "is_track_serial_no", "is_asset_no_added", "asset_no", "file_ref", "_client_id_fk", "_inventory_id_fk", "_project_id_fk", "_rental_id_fk", "account_code", "amount", "bin_no", "category", "date", "date_end", "discount_rate", "header", "hours_in", "hours_out", "hours_total", "hours_used", "isfromweb", "item", "item_serialised", "jobstatus", "last_service_hours", "level", "lineitemserial", "metre_charge", "metres", "off_hire_cost", "off_hire_date", "off_hire_period", "orders", "prorata_cost", "prorata_date", "prorata_period", "qty", "quantity_dispatched", "replacement_cost", "resource", "service_period", "servicestatus", "sku", "sort", "source", "sub_item", "sub_rent", "sub_rental_cost", "taxable", "time_end", "time_start", "total_price", "type", "unit_price", "unit_type", "units", "year", "is_header", "is_details"]
                let get_items = await RentalItems.findAll({ order: [["sort", "ASC"]], attributes: get_data_item, where: { _rental_id_fk: rental_id } })
                rental_get.item = await handy.transformnames('LTR', get_items, "RentalItems", {}, user);
                //rental_get.item = get_items;
                //rental_get.stepper = await handy.update_stepper(rental_id);
                //rental_get = await calculate_rental_data(rental_get, user, rental_id)
                let bondVal = parseFloat(rental_get.bond);
                rental_get.rental_calculated_data = await handy.auto_update_or_calculate_rental(rental_id, false, user)
                rental_get.bond = (!bondVal) ? rental_get.rental_calculated_data.bond_rate : rental_get.bond
                return { status: true, data: rental_get }
            }
            else {
                return { status: false, message: lang('Validation.record_not_exist', user.lang) };
            }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }

    }


    /**
     * @deprecated 1.0.0
     * @author Kirankumar
     * @summary This function is used to calculate rental data
     * @param {Rental data with items} data 
     * @param {Logged in user data} user 
     * @param {Rental id} rentalID 
     * @returns caclculated data
     */
    async function calculate_rental_data(data, user, rentalID) {
        try {
            if (data) {
                let rental_id = rentalID ? parseInt(rentalID) : 0;
                let credit_card_rate = data.credit_card_rate = data.credit_card_rate ? parseFloat(data.credit_card_rate) / 100 : 0.00;
                let tax_rate = data.tax_rate = data.tax_rate ? parseFloat(data.tax_rate) / 100 : 0.00;
                let insurance = data.insurance = data.insurance ? parseFloat(data.insurance) : 0.00;
                let use_surcharge = data.use_surcharge = data.use_surcharge ? parseFloat(data.use_surcharge) : 0.00;
                let bond = data.bond = data.bond ? parseFloat(data.bond) : 0.00;
                let delivery_charge = data.delivery_charge = data.delivery_charge ? parseFloat(data.delivery_charge) : 0.00;
                let collection_charge = data.collection_charge = data.collection_charge ? parseFloat(data.collection_charge) : 0.00;
                let long_term_hire = data.long_term_hire = data.long_term_hire ? parseFloat(data.long_term_hire) : 0.00;
                let bond_paid_amount = data.bond_paid_amount = data.bond_paid_amount ? parseFloat(data.bond_paid_amount) : 0.00;
                let damage = data.damage = data.damage ? parseFloat(data.damage) : 0.00;
                let discount_cash = data.discount_cash = data.discount_cash ? parseFloat(data.discount_cash) : 0.00;
                let items = data.item ? data.item : [];

                let payment_results = [];
                let total_invoices = 0;
                let sub_rent_cost = 0;

                if (rental_id) {
                    payment_results = await Payment.findAll({ attributes: ['payment_amount', 'payment_type'], where: { _rental_id_fk: rental_id } });
                    total_invoices = await Invoice.sum('total', { where: { _rental_id_fk: rental_id } });
                    sub_rent_cost = await SubRent.sum('cost', { where: { id_invoice: rental_id } });
                }

                let balance = commission_cost = credit_card_charge = discount = items_amount = items_discount_amount =
                    loss_cost = pament_amount = profit = status_dispatch = status_invoiced = status_overbooked =
                    status_payment = staff_cost = sur_charge = sub_total = taxable_amount = total = total_invoices =
                    total_refund = total_services = total_rental = total_balence = total_kit = total_loss = total_subrent =
                    total_due = total_costs = total_paid = tax = 0;

                let satus_var1 = 0;
                let satus_var2 = 0;
                let satus_var3 = 0;

                for (let payt = 0; payt < payment_results.length; payt++) {
                    let currpayt = payment_results[payt];
                    total_refund = total_refund + currpayt.payment_amount;
                    if (currpayt.payment_type !== "REFUND BOND") {
                        pament_amount += currpayt.payment_amount;
                    }
                    if (currpayt.payment_type !== "REFUND BOND" && currpayt.payment_type !== "BOND") {
                        total_paid += currpayt.payment_amount;
                    }
                }
                total_paid = total_paid ? total_paid : 0;
                pament_amount = pament_amount ? pament_amount : 0;
                total_refund = total_refund ? total_refund : 0;

                for (let itms = 0; itms < items.length; itms++) {
                    let curr_item = Object.assign({}, items[itms]);
                    curr_item.amount = curr_item.amount ? parseFloat(curr_item.amount) : 0.00;
                    curr_item.unstored_loss = curr_item.unstored_loss ? parseFloat(curr_item.unstored_loss) : 0.00;
                    curr_item.credit_card_label = curr_item.credit_card_label ? parseFloat(curr_item.credit_card_label) : "";
                    curr_item.rate_tax_id = curr_item.rate_tax_id ? parseInt(curr_item.rate_tax_id) : 0;
                    curr_item.status = curr_item.status ? curr_item.status : "";
                    curr_item.taxable_amount = curr_item.taxable_amount ? parseFloat(curr_item.taxable_amount) : 0.00;
                    curr_item.total_service_cost = curr_item.total_service_cost ? parseFloat(curr_item.total_service_cost) : 0.00;
                    curr_item.loss = curr_item.loss ? parseFloat(curr_item.loss) : 0.00;
                    curr_item.cost = curr_item.cost ? parseFloat(curr_item.cost) : 0.00;
                    curr_item.metre_charge = curr_item.metre_charge ? parseFloat(curr_item.metre_charge) : 0.00;
                    curr_item.unit_price = curr_item.unit_price ? parseFloat(curr_item.unit_price) : 0.00;
                    curr_item.qty = curr_item.qty ? parseFloat(curr_item.qty) : 0;
                    curr_item.type = curr_item.type ? parseFloat(curr_item.type) : 0;
                    curr_item.units = curr_item.units ? parseFloat(curr_item.units) : 0;
                    curr_item.metres = curr_item.metres ? parseFloat(curr_item.metres) : 0;
                    curr_item.discount_rate = curr_item.discount_rate ? parseFloat(curr_item.discount_rate / 100) : 0.00;
                    curr_item.commission_cost = curr_item.commission_cost ? parseFloat(curr_item.commission_cost / 100) : 0.00;
                    curr_item.discount_amount = 0;

                    if (curr_item.type == "RENTAL") {
                        total_balence += curr_item.amount;
                    }
                    if (curr_item.type == "KIT") {
                        total_kit += curr_item.amount;
                    }
                    if (curr_item.type == "SUBRENT") {
                        total_subrent += curr_item.amount;
                    }
                    if (curr_item.type == "SERVICE") {
                        total_services += curr_item.amount;
                    }
                    total_loss += curr_item.unstored_loss;
                    taxable_amount += curr_item.taxable_amount;
                    staff_cost += curr_item.total_service_cost;

                    if (curr_item.loss > 0) {
                        loss_cost += curr_item.cost;
                    }
                    commission_cost += curr_item.commission_cost;

                    if (curr_item.type !== "SERVICE" && curr_item.type !== "SELL") {
                        if (curr_item.status == "PENDING") {
                            satus_var1 += 1;
                        }
                        if (curr_item.status == "OUT") {
                            satus_var2 += 1;
                        }
                        if (curr_item.status == "IN") {
                            satus_var3 += 1;
                        }
                    }

                    if (curr_item.units > 0) {
                        curr_item.discount_amount = (curr_item.qty * curr_item.unit_price * curr_item.units) * curr_item.discount_rate;
                    }
                    else {
                        curr_item.discount_amount = (curr_item.qty * curr_item.unit_price) * curr_item.discount_rate;
                    }
                    items_discount_amount += curr_item.discount_amount;
                    items[itms]["discount_amount"] = curr_item.discount_amount;

                    switch (true) {
                        case curr_item.metre_charge == 1 && !curr_item.metres && curr_item.units <= 0:
                            items_amount += (curr_item.unit_price * curr_item.qty) - curr_item.discount_amount;
                            break;
                        case curr_item.metre_charge == 1 && !curr_item.metres && curr_item.units >= 1:
                            items_amount += (curr_item.unit_price * curr_item.qty * curr_item.units) - curr_item.discount_amount;
                            break;
                        case curr_item.metre_charge == 1 && curr_item.metres && curr_item.units >= 1:
                            items_amount += (curr_item.unit_price * curr_item.metres * curr_item.units) - curr_item.discount_amount;
                            break;
                        case curr_item.metre_charge == 1 && curr_item.metres && curr_item.units <= 0:
                            items_amount += (curr_item.unit_price * curr_item.metres) - curr_item.discount_amount;
                            break;
                        case curr_item.units > 0:
                            items_amount += (curr_item.unit_price * curr_item.qty * curr_item.units) - curr_item.discount_amount;
                            break;
                        case curr_item.units <= 0:
                            items_amount += (curr_item.unit_price * curr_item.qty) - curr_item.discount_amount;
                            break;
                    }
                }

                if (satus_var1 !== 0) {
                    status_dispatch = 1;
                } else if (satus_var2 > 0) {
                    status_dispatch = 2;
                } else if (satus_var2 == 0 && satus_var3 > 0) {
                    status_dispatch = 3;
                }

                total_rental = total_balence > 0 ? total_balence + total_kit + total_subrent : 0.00;
                sur_charge = use_surcharge ? total_rental * 0.1 : 0.00;
                discount = items_discount_amount + discount_cash;

                if ((items_amount + bond + delivery_charge + collection_charge + sur_charge)) {
                    sub_total = Math.round((items_amount + bond + delivery_charge + collection_charge + sur_charge + damage + total_loss - discount_cash) / 0.05) * 0.05;
                }

                if (credit_card_rate) {
                    credit_card_charge = Math.round(((sub_total - bond) * credit_card_rate) / 0.05) * 0.05;
                }

                if (tax_rate) {
                    tax = Math.round(((taxable_amount + delivery_charge + collection_charge + total_loss + damage + sur_charge + credit_card_charge - discount_cash) * tax_rate) / 0.5) * 0.5;
                }
                total_costs = staff_cost + commission_cost + tax + loss_cost;
                sub_total_tax = Math.round(sub_total + tax) ? Math.round((sub_total + tax) * 100) / 100 : 0.00;
                if (long_term_hire > 1 && (total_invoices > sub_total_tax || total_invoices > 2)) {
                    total = total_invoices;
                } else {
                    total = Math.round(sub_total + tax + credit_card_charge) ? Math.round((sub_total + tax + credit_card_charge) * 100) / 100 : 0.00;
                }
                profit = total + total_costs + bond;
                paid = total_paid + bond_paid_amount - Math.abs(total_refund);
                if (total_invoices > 1) {
                    balance = total - paid;
                } else if (bond_paid_amount == bond) {
                    balance = total_invoices - paid;
                } else {
                    balance = total_invoices + bond - paid;
                }

                if (bond > 0 && bond_paid_amount == 0) {
                    total_due = Math.round((balance + bond) * 100) / 100;
                } else if (bond > 0 && bond_paid_amount > 0) {
                    total_due = Math.round((total_invoices - total_refund) * 100) / 100;
                } else if (bond == 0 && bond_paid_amount == 0) {
                    total_due = Math.round(balance * 100) / 100;
                }
                // 2 = Paid, 1 = Part payment, 0 = Unpaid
                if (pament_amount == 0) {
                    status_payment = 0;
                } else if (pament_amount && balance > 0) {
                    status_payment = 1;
                } else if (pament_amount && balance <= 0) {
                    status_payment = 2;
                }

                // data['use_surcharge'] = use_surcharge;
                // data['bond_paid_amount'] = bond_paid_amount;
                // data['damage'] = damage;
                // data['long_term_hire'] = long_term_hire;
                data['rental_id'] = rental_id;
                data["total_paid"] = total_paid;
                data["pament_amount"] = pament_amount;
                data["total_refund"] = total_refund;
                data["balance"] = balance;
                data["total_due"] = total_due;
                data["total_costs"] = total_costs;
                data["discount"] = discount;
                data["total"] = total;
                data["profit"] = profit;
                data["total_invoices"] = total_invoices;
                data["total_services"] = total_services;
                data["status_dispatch"] = status_dispatch;
                data["status_invoiced"] = status_invoiced;
                data["status_overbooked"] = status_overbooked;
                data["status_payment"] = status_payment;
                data["sur_charge"] = sur_charge;
                data["total_rental"] = total_rental;
                data["sub_total"] = sub_total;
                data["total_balence"] = total_balence;
                data["total_kit"] = total_kit;
                data["total_loss"] = total_loss;
                data["total_subrent"] = total_subrent;
                data["credit_card_charge"] = credit_card_charge;
                data["tax"] = tax;
                data["paid"] = paid;
                data["taxable_amount"] = taxable_amount;
                data["item"] = items;
                return data;
            }
            else {
                return data;
                //res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) })
            }
        }
        catch (e) {
            //res.status(500).send({ status: false, message: e.message })
            return data;
        }
    }

    /**
     * @author JoysanJawahar
     * @summary This route used to update the sub_rent
     * @input  {sub_rent_id} sub_rent_id,
     * @returns Status and updated data
     */
    fastify.post('/subrental/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.body && req.body.sub_rent_id) {
                if (req.body.is_deleted) {
                    delete req.body.is_deleted;
                }
                let rental = {};
                if (req.body.period_no) {
                    let subrent = await SubRent.findOne({ attributes: ["_rental_id_fk"], where: { __sub_rent_id_pk: req.body.sub_rent_id } })
                    if (subrent && subrent._rental_id_fk)
                        rental = await update_rental_root({ body: { period_no: req.body.period_no, rental_id: subrent._rental_id_fk } }, user);
                    //have to remove period_no from sub rent and use directly in main rental period no
                }
                const data = await handy.create_update_table(req.body, user, SubRent, "SubRent", "__sub_rent_id_pk")
                if (data.status) {
                    const dateUpdate = await updateStatus(data, user);
                    if (Object.keys(rental).length)
                        dateUpdate.rental = rental.data;
                    res.status(200).send(dateUpdate);
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
     * @author JoysanJawahar
     * @summary This function is used for set the status for sub rental
     * @param {sub rental} data 
     * @returns status updated subrental rental data
     */

    async function updateStatus(data, user) {
        try {
            SubRent.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk' })
            let subId = data.sub_rent_id;
            const get_data = await SubRent.findOne({
                raw: true,
                attributes: ["_rental_id_fk", "qty", "qty_received", "sent_date"],
                where: {
                    "__sub_rent_id_pk": subId ? subId : data.data.sub_rent_id
                },
                include: {
                    model: Rental,
                    attributes: ["__rental_id_pk", "status_overbooked"]
                }
            });
            let subrentStatus = "";
            if (get_data) {
                let status = get_data['rental.status_overbooked']
                let overbooked = get_data.qty
                let received = get_data.qty_received
                let sent = get_data.sent_date
                switch (true) {
                    case status == 1 && received == 0 && !sent:
                        subrentStatus = "PENDING";
                        break;
                    case status == 2 && received == overbooked:
                        subrentStatus = "IN";
                        break;
                    case status == 2 && received == overbooked && !sent:
                        subrentStatus = "PENDING";
                        break;
                    case status == 2:
                        subrentStatus = "ORDERED";
                        break;
                    case status == 3 && received == overbooked:
                        subrentStatus = "IN";
                        break;
                    default:
                        subrentStatus = "PENDING";
                        break;
                }
            }
            let updatedData = await SubRent.update({ "status": subrentStatus }, { where: { __sub_rent_id_pk: subId ? subId : data.data.sub_rent_id } });
            if (get_data) {
                await handy.auto_update_or_calculate_rental(get_data._rental_id_fk, true, user);
            }
            if (subId) {
                data.status = subrentStatus;
            } else {
                data.data.status = subrentStatus;
            }
            return data;
        }
        catch (e) {
            return data;
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used for set the color codes for rental data
     * @param {Rental data} data 
     * @returns Color code updated rental data
     */
    async function set_color_codes(data) {
        try {
            if (data && data.length > 0) {
                let default_val = {
                    "btn1": {
                        "btn-bg": "#FFFFFF-#CDCDCD",
                        "icon": "#558E28",
                        "icon-hover": "#72A331",
                        "btn-hovr": "#FFFFFF-#FBFBFB",
                        "btn-click": "#F4F4F4"
                    },
                    "btn2": {
                        "btn-bg": "#FFFFFF-#CDCDCD",
                        "icon": "#CDCDCD",
                        "icon-hover": "#72A331",
                        "btn-hovr": "#FFFFFF-#FBFBFB",
                        "btn-click": "#F9F9F9-#EBEBEB"
                    },
                    "btn3": {
                        "btn-bg": "#FFFFFF-#CDCDCD",
                        "icon": "#558E28",
                        "icon-hover": "#72A331",
                        "btn-hovr": "#FFFFFF-#FBFBFB",
                        "btn-click": "#F9F9F9-#EBEBEB"
                    },
                    "btn4": {
                        "btn-bg": "#FFFFFF-#CDCDCD",
                        "icon": "#ADADAD",
                        "icon-hover": "#72A331",
                        "btn-hovr": "#FFFFFF-#FBFBFB",
                        "btn-click": "#F9F9F9-#EBEBEB"
                    },
                    "btn5": {
                        "btn-bg": "#FFFFFF-#CDCDCD",
                        "icon": "#ADADAD",
                        "icon-hover": "#72A331",
                        "btn-hovr": "#FFFFFF-#FBFBFB",
                        "btn-click": "#F9F9F9-#EBEBEB"
                    },
                    "btn6": {
                        "btn-bg": "#FFFFFF-#CDCDCD",
                        "icon": "#ADADAD",
                        "icon-hover": "#72A331",
                        "btn-hovr": "#FFFFFF-#FBFBFB",
                        "btn-click": "#F9F9F9-#EBEBEB"
                    },
                    "btn7": {
                        "btn-bg": "#FFFFFF-#CDCDCD",
                        "icon": "#ADADAD",
                        "icon-hover": "#72A331",
                        "btn-hovr": "#FFFFFF-#FBFBFB",
                        "btn-click": "#F9F9F9-#EBEBEB"
                    }
                }

                for (let scod = 0; scod < data.length; scod++) {
                    data[scod]["color_codes"] = {};
                    data[scod]["sub_items"] = [];
                    let color_code = default_val;
                    if (data[scod].flag_record == 1) {
                        color_code["btn2"]["icon"] = "#A30800";
                    }

                    if (data[scod].status_payment == 0) {
                        color_code["btn4"]["icon"] = "#A30800";
                    }
                    if (data[scod].status_payment == 1) {
                        color_code["btn4"]["icon"] = "#FD9A00";
                    }
                    if (data[scod].status_payment == 2) {
                        color_code["btn4"]["icon"] = "#72A331";
                    }

                    if (data[scod].status_invoiced == 1) {
                        color_code["btn5"]["icon"] = "#A30800";
                    }
                    if (data[scod].status_invoiced == 2) {
                        color_code["btn5"]["icon"] = "#72A331";
                    }

                    if (data[scod].status_dispatch == 1) {
                        color_code["btn6"]["icon"] = "#A30800";
                    }
                    if (data[scod].status_dispatch == 2) {
                        color_code["btn6"]["icon"] = "#FD9A00";
                    }
                    if (data[scod].status_dispatch == 3) {
                        color_code["btn6"]["icon"] = "#72A331";
                    }

                    if (data[scod].status_overbooked == 1) {
                        color_code["btn7"]["icon"] = "#A30800";
                    }
                    if (data[scod].status_overbooked == 2) {
                        color_code["btn7"]["icon"] = "#FD9A00";
                    }
                    if (data[scod].status_overbooked == 3) {
                        color_code["btn7"]["icon"] = "#72A331";
                    }

                    data[scod]["color_codes"] = color_code;
                    data[scod]["sub_items"] = await sequelizeQuery.query("SELECT `amount`,`units`,`qty`,`type`,`item`,`sku`,`unit_price`,`discount_rate`,`total_price`,`is_header`,`is_details`, CASE WHEN `_rental_item_id_fk`= 0 THEN FALSE ELSE TRUE END AS `is_subitem` FROM `rental_item` WHERE `_rental_id_fk` = :_rental_id_fk ORDER BY `sort` ASC", { model: RentalItems, replacements: { _rental_id_fk: data[scod].rental_id } })
                }
            }
            return data;
        } catch (e) {
            return data;
        }
    }
    /**
     * @author Kirankumar
     * @summary This function is usefull to update Loss for Rental
     * @param {Rental id} rentalID 
     * @returns True or False
     */
    async function updateLoss(rentalID) {
        //Get items and update in loss table
        let count = 0;
        const items_find = await RentalItems.findAll({ raw: true, attributes: ["_inventory_id_fk", "sku", "item", "loss"], where: { _rental_id_fk: rentalID, loss: { [Op.gte]: 1 } } })
        if (items_find.length > 0) {
            for (let itm in items_find) {
                let loss_set = { _inventory_id_fk: items_find[itm]._inventory_id_fk, sku: items_find[itm].sku, item: items_find[itm].item, qty: items_find[itm].loss };
                await InventoryLoss.create(loss_set);
                if (items_find[itm]._inventory_id_fk) {
                    await handy.updateStock(items_find[itm]._inventory_id_fk)
                }
                count++;
            }
        }
        return !!count;
    }
    /**
     * @author Kirankumar
     * @summary This rout is usefull to update subrental actions like Receive, Process and Single in.
     * @inpit rental item data
     * @returns status and updated subrental and rental data
     */
    fastify.post('/subrental/item/actions', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await update_subrent_actions(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is usefull to update subrental with check button.
     * @inpit rental item data
     * @returns status and updated subrental and rental data
     */
    fastify.post('/rental/items/check', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await subrent_check(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is used for check availability of rental items
     * @param {Http input} body 
     * @param {Logged in user details} user 
     * @returns status and message.
     */
    async function subrent_check(body, user) {
        if (body.rental_id) {
            const rental_items = await RentalItems.findAll({ where: { _rental_id_fk: body.rental_id } });
            let rental = await Rental.findOne({ attributes: ["_rate_config_id_fk", "is_quote"], where: { __rental_id_pk: body.rental_id } });
            if (rental && !rental.is_quote) {
                let _rate_config_id_fk = rental ? rental._rate_config_id_fk : 0;
                let sub_rent_cost_pice = 0;
                if (rental_items.length) {
                    for (let item of rental_items) {
                        if (!item.is_header) {
                            const inventory = await handy.inventory_available_stock({ inventory_ids: [item._inventory_id_fk], rental_id: body.rental_id }, user);
                            const availQty = inventory && inventory.data && inventory.data.length ? inventory.data[0].zz_available_qty : 0;
                            item.type = item.type ? item.type : "";
                            if (item.qty > availQty || item.type.toLowerCase() == "sub rent") {
                                if (item.type.toLowerCase() != "service") {
                                    if (_rate_config_id_fk) {
                                        const inventory_rate = await InventoryRate.findOne({ attributes: ["cost"], where: { _inventory_id_fk: item._inventory_id_fk, _rate_config_id_fk } })
                                        sub_rent_cost_pice = inventory_rate ? inventory_rate.cost : 0;
                                    }
                                    let overbooked = availQty <= 0 ? item.qty : item.qty - availQty;
                                    const sub_rent_data = {
                                        cost: sub_rent_cost_pice,
                                        qty: item.type.toLowerCase() == "sub rent" ? item.qty : overbooked,
                                        item: item.item,
                                        _rental_id_fk: body.rental_id,
                                        id_parent_item: item.__rental_item_id_pk,
                                        id_product: item._inventory_id_fk,
                                        sku: item.sku,
                                        status: "PENDING",
                                        use_date: item.date,
                                        use_time: item.time,
                                        period_no: item.period_no
                                    }
                                    if (item.sub_rent) {
                                        //update = 1;
                                        await SubRent.update(sub_rent_data, { where: { id_parent_item: item.__rental_item_id_pk } });
                                    } else {
                                        //have to check
                                        await SubRent.create(sub_rent_data);
                                        await RentalItems.update({ sub_rent: 1 }, { where: { __rental_item_id_pk: item.__rental_item_id_pk } });
                                    }
                                }
                            } else {
                                if (item.sub_rent) {
                                    await SubRent.destroy({ where: { _rental_item_id_fk: item.__rental_item_id_pk } });
                                    await RentalItems.update({ sub_rent: 0 }, { where: { __rental_item_id_pk: item.__rental_item_id_pk } });
                                }
                            }
                        }
                    }
                } else {
                    return { status: true, alert: lang('Validation.items_not_found_job', user.lang) };
                }
                let rental_update = {
                    //"Last checked by: "& Get(AccountName) &" at " & Get(CurrentTimestamp)
                    check_avails_last_run: "Last checked by: " + user.username + " at " + moment().format('D/M/yyyy, hh:mm:ss a'),
                }
                await Rental.update(rental_update, { where: { __rental_id_pk: body.rental_id } });
                const rental_calculated_data = await handy.auto_update_or_calculate_rental(body.rental_id, true, user);
                return { status: true, data: rental_update, rental_calculated_data };
            } else {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }


    /**
     * @author Kirankumar
     * @summary This function is used for update Subrent related actions
     * @param {HTTP input data} data 
     * @param {Logged in user details} user 
     * @returns Json updated data
     */
    async function update_subrent_actions(data, user) {
        let return_data = [];
        if (data && data.rental_id && data.action_type) {
            const rental = await Rental.findOne({ attributes: ["sub_rental_comments"], where: { __rental_id_pk: data.rental_id } });
            if (rental) {
                if (data.action_type == "subrent") {
                    const sub_rents = await SubRent.findAll({ attributes: ["__sub_rent_id_pk", "qty"], where: { _rental_id_fk: data.rental_id } });
                    for (sub_rent of sub_rents) {
                        const update_data = {
                            received_date: new Date(),
                            qty_received: sub_rent.qty
                        }
                        await SubRent.update(update_data, { where: { __sub_rent_id_pk: sub_rent.__sub_rent_id_pk } });
                        update_data.sub_rent_id = sub_rent.__sub_rent_id_pk;
                        await updateStatus(update_data, user);
                        return_data.push(update_data);
                    }
                    let sub_rental_comments = moment(new Date()).format('D/M/yyyy, hh:mm:ss a') + ", " + user.username + ": Received Subrental Inventory";
                    sub_rental_comments = rental.sub_rental_comments ? rental.sub_rental_comments + "\r\n" + sub_rental_comments : sub_rental_comments;
                    let rental_update = {
                        sub_rental_comments,
                        sub_rental_received: new Date()
                    };
                    await Rental.update(rental_update, { where: { __rental_id_pk: data.rental_id } });
                    return { status: true, data: { subrent_data: return_data, rental_update_data: rental_update } };
                }
                else if (data.action_type == "subrent_singleIn" && data.sub_rent_id) {
                    const sub_rents = await SubRent.findAll({ attributes: ["__sub_rent_id_pk"], where: { __sub_rent_id_pk: data.sub_rent_id } });
                    const update_data = {
                        received_date: new Date(),
                        qty_received: data.qty
                    }
                    await SubRent.update(update_data, { where: { __sub_rent_id_pk: data.sub_rent_id } });
                    update_data.sub_rent_id = data.sub_rent_id;
                    let sub_rental_comments = moment(new Date()).format('D/M/yyyy, hh:mm:ss a') + ", " + user.username + ": Received Subrental Inventory";
                    sub_rental_comments = rental.sub_rental_comments ? rental.sub_rental_comments + "\r\n" + sub_rental_comments : sub_rental_comments;
                    let rental_update = {
                        sub_rental_comments,
                        sub_rental_received: new Date()
                    };
                    await Rental.update(rental_update, { where: { __rental_id_pk: data.rental_id } });
                    await updateStatus(update_data, user);
                    return { status: true, data: { subrent_data: update_data, rental_update_data: rental_update } };
                }
                else if (data.action_type == "process") {
                    let subrent_count = await SubRent.count({ where: { _rental_id_fk: data.rental_id } });
                    let supplier_count = await SubRent.count({ where: { _rental_id_fk: data.rental_id, id_supplier: { [Op.ne]: 'NULL' } } });
                    if (subrent_count > supplier_count) {
                        return { status: true, alert: lang('Validation.subrent_count_alert', user.lang) };
                    }
                    let rental_data = await Rental.findOne({ raw: true, attributes: ["sub_rental_delivery_pickup", "sub_rental_delivery_pickup_date", "sub_rental_date_sent", "delivery", "delivery_address", "is_quote", "_invoice_id_fk"], where: { __rental_id_pk: data.rental_id, is_deleted: 0 } });
                    if (rental_data) {
                        if (!rental_data.sub_rental_delivery_pickup) {
                            return { status: true, alert: lang('Validation.subrent_delivery_pickup_alert', user.lang) };
                        }
                        if (!rental_data.sub_rental_delivery_pickup_date) {
                            return { status: true, alert: lang('Validation.subrent_delivery_pickup_date_alert', user.lang) };
                        }
                        if (rental_data.sub_rental_date_sent && data.confirmation != "purchase_order") {
                            return { status: true, confirmation_type: "purchase_order", confirmation: lang('Validation.subrent_date_sent_confirmation', user.lang) };
                        }
                        if (rental_data.is_quote && data.confirmation != "quote") {
                            return { status: true, confirmation_type: "quote", confirmation: lang('Validation.subrent_type_status', user.lang) };
                        }
                        if (rental_data.delivery && rental_data.delivery == 'yes' && !rental_data.delivery_address) {
                            return { status: true, alert: lang('Validation.subrent_delivery_confirmation', user.lang) }
                        }
                        let pdf = 'PO#' + rental_data._invoice_id_fk + '.pdf';
                        let list = await SubRent.findAll({ raw: true, attributes: [Sequelize.fn('DISTINCT', Sequelize.col('supplier')), "__sub_rent_id_pk"], where: { _rental_id_fk: data.rental_id } });
                        let listCount = list.length;
                        if (list.length == 0) {
                            return { status: true, alert: lang('Validation.subrent_supplier_empty', user.lang) }
                        }
                        for (var i in list) {
                            let client_data = await Client.findOne({ raw: true, attributes: ["first_name", "last", "email", "telephone", "address_billing"], where: { account_name: list[i].supplier, is_deleted: 0 } });
                            const update_data = {
                                first: client_data.first_name ? client_data.first_name : '',
                                last: client_data.last ? client_data.last : '',
                                email: client_data.email ? client_data.email : '',
                                moblie: client_data.telephone ? client_data.telephone : '',
                                address: client_data.address_billing ? client_data.address_billing : ''
                            }
                            update_data.sub_rent_id = list[i].__sub_rent_id_pk;
                            await updateStatus(update_data, user);
                            return_data.push(update_data);
                        }
                        let sub_rental_comments = moment(new Date()).format('D/M/yyyy, hh:mm:ss a') + ", " + user.username + ": SENT PO";
                        sub_rental_comments = rental.sub_rental_comments ? rental.sub_rental_comments + "\r\n" + sub_rental_comments : sub_rental_comments;
                        let rental_update = {
                            sub_rental_comments,
                            sub_rental_date_sent: new Date(),
                            status_overbooked: "2"
                        };
                        await Rental.update(rental_update, { where: { __rental_id_pk: data.rental_id } });
                        return { status: true, data: { subrent_data: return_data, rental_update_data: rental_update } };
                    }
                }
                else {
                    return { status: false, message: lang('Validation.invalid_data', user.lang) };
                }
            } else {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }

    // fastify.put('/rental/update/:rental_id', async (req, res) => {
    //     try {
    //         let user = await handy.verfiytoken(req, res);
    //         if (!user) return;
    //         let res_data = await insert_update_rentals(res, req.body, user, req.params.rental_id);
    //         res.status(200).send(res_data)
    //     }
    //     catch (e) {
    //         res.status(500).send({ status: false, message: e.message })
    //     }
    // })
    // fastify.post('/rentalitem/create', async (req, res) => {
    //     try {
    //         let user = await handy.verfiytoken(req, res);
    //         if (!user) return;
    //         let insert_record = await insert_update_rentals_itemdata(res, user, req.body);
    //         res.status(200).send(insert_record)
    //     }
    //     catch (e) {
    //         res.status(500).send({ status: false, message: e.message });
    //     }
    // })
    //insert or update items
    // async function insert_update_rentals_itemdata(res, user, data, rental_item_id, rental_id) {
    //     try {
    //         if (data) {
    //             if (data.rental_id) {
    //                 let check_validate = await Rental.count({ where: { __rental_id_pk: data.rental_id, _company_id_fk: user.company_id } })
    //                 if (check_validate) {
    //                     let get_rental_details = await Rental.findAll({ raw: true, attributes: ["_client_id_fk", "_project_id_fk"], where: { __rental_id_pk: data.rental_id } });
    //                     let client_id = "";
    //                     let project_id = "";
    //                     if (get_rental_details.length > 0) {
    //                         client_id = get_rental_details[0]._client_id_fk;
    //                         project_id = get_rental_details[0]._project_id_fk;
    //                     }
    //                     data.rental_item_id = rental_item_id;
    //                     let update_item = await insert_update_item("rentalItem", user, [data], data.rental_id, client_id, project_id)
    //                     if (update_item) {
    //                         let get_data_item = ["__rental_item_id_pk", "_rental_item_id_fk", "_client_id_fk", "_inventory_id_fk", "_project_id_fk", "_rental_id_fk", "account_code", "bin_no", "category", "date", "date_end", "discount_rate", "header", "hours_in", "hours_out", "hours_total", "hours_used", "isfromweb", "item", "item_serialised", "jobstatus", "last_service_hours", "level", "lineitemserial", "metre_charge", "metres", "off_hire_cost", "off_hire_date", "off_hire_period", "orders", "prorata_cost", "prorata_date", "prorata_period", "qty", "quantity_dispatched", "replacement_cost", "resource", "service_period", "servicestatus", "sku", "sort", "source", "sub_item", "sub_rent", "sub_rental_cost", "taxable", "time_end", "time_start", "total_price", "type", "unit_price", "unit_type", "units", "year", "is_header", "is_details"]
    //                         let get_items = await RentalItems.findAll({ order: [["sort", "ASC"]], attributes: get_data_item, where: { is_deleted: 0, _rental_id_fk: data._rental_id_fk, __rental_item_id_pk: update_item } })
    //                         get_items = await handy.transformnames('LTR', get_items, "RentalItems");
    //                         return { status: true, data: get_items }
    //                     }
    //                     else {
    //                         if (!data.rental_id) {
    //                             res.status(501).send({ status: false, message: lang('Validation.record_not_inserted', user.lang) })
    //                         }
    //                         else {
    //                             res.status(501).send({ status: false, message: lang('Validation.record_not_updated', user.lang) })
    //                         }
    //                     }
    //                 }
    //                 else {
    //                     res.status(501).send({ status: false, message: lang('Validation.invalid_rental', user.lang) })
    //                 }
    //             }
    //             else {
    //                 res.status(501).send({ status: false, message: lang('Validation.rental_id_mandatory', user.lang) })
    //             }
    //         }
    //         else {
    //             res.status(501).send({ status: false, message: lang('Validation.invalid_data', user.lang) })
    //         }
    //     }
    //     catch (e) {
    //         res.status(501).send({ status: false, message: e.message })
    //     }
    // }
    //insert or update rentals
    // async function insert_update_rentals(res, data, user, rental_id) {
    //     try {
    //         if (rental_id) {
    //             let check_validate = await Rental.count({ where: { __rental_id_pk: rental_id, _company_id_fk: user.company_id } })
    //             if (!check_validate) {
    //                 res.status(501).send({ status: false, message: lang('Validation.invalid_rental', user.lang) })
    //             }
    //         }else{

    //         }

    //         data = await calculate_rental_data(data, user, rental_id)
    //         let input_request = Object.assign({}, data);
    //         if (input_request.item) {
    //             delete input_request.item;
    //         }
    //         if (input_request.notes) {
    //             delete input_request.notes;
    //         }
    //         input_request = await handy.transformnames('RTL', input_request, "Rental");
    //         let valid_client = "";
    //         let rental_get_id = "";
    //         if (input_request._client_id_fk) {
    //             valid_client = await Client.count({ where: { __client_id_pk: input_request._client_id_fk } })
    //         }
    //         else if (input_request.is_quick_quote) {
    //             valid_client = true;
    //         }else{
    //             valid_client = true;
    //         }
    //         if (valid_client) {
    //             //address get from client and save in rental
    //             if (input_request.client_addr_id) {
    //                 let address = "";
    //                 let address_records = await Address.findAll({ raw: true, attributes: ["__address_id_pk", "address1", "city", "state", "country", "zip", "is_active", "is_billing", "is_delivery", "is_default"], where: { _client_id_fk: input_request._client_id_fk, __address_id_pk: input_request.client_addr_id } });
    //                 if (address_records.length > 0) {
    //                     address = await handy.format_address(address_records[0], user.company_id);
    //                 }
    //                 input_request.address_full = address;
    //                 input_request._address_id_fk = input_request.client_addr_id;
    //             }
    //             if (!rental_id) {
    //                 let serial_count = await Rental.count({ where: { _company_id_fk: user.company_id } });
    //                 serial_count = serial_count + 1;
    //                 input_request.serial_no = serial_count;
    //                 input_request.created_by = user.company_id;
    //                 input_request.created_at = new Date();
    //                 input_request._staff_id_fk = user.company_id;
    //                 input_request._company_id_fk = user.company_id;
    //                 if (input_request.is_quote) {
    //                     input_request.rental_type = 'Quote';
    //                 }
    //                 if (input_request.is_rental) {
    //                     input_request.rental_type = 'Rental';
    //                 }
    //                 let rental_saved = await Rental.create(input_request);
    //                 rental_get_id = rental_saved.get("__rental_id_pk");
    //             }
    //             else {
    //                 input_request.updated_by = user.company_id;
    //                 let rental_saved = await Rental.update(input_request, { where: { __rental_id_pk: rental_id } });
    //                 rental_get_id = rental_id;
    //             }
    //             if (rental_saved) {
    //                 //Notes
    //                 if (data.notes) {
    //                     for (let cnot = 0; cnot < data.notes.length; cnot++) {
    //                         data.notes[cnot]._rental_id_fk = rental_get_id;
    //                         data.notes[cnot].created_by = user.company_id;
    //                         data.notes[cnot].created_at = new Date();
    //                         let notes_save = await ClientNotes.create(data.notes[cnot]);
    //                     }
    //                 }

    //                 //Item
    //                 let create_item = await insert_update_item("rental", user, data.item, rental_get_id, input_request._client_id_fk, input_request._project_id_fk);

    //                 let get_all_data = await get_rental_data(res, rental_get_id, user);
    //                 return get_all_data
    //             }
    //             else {
    //                 if (!rental_id) {
    //                     res.status(501).send({ status: false, message: lang('Validation.record_not_inserted', user.lang) })
    //                 }
    //                 else {
    //                     res.status(501).send({ status: false, message: lang('Validation.record_not_updated', user.lang) })
    //                 }
    //             }
    //         }
    //         else {
    //             res.status(501).send({ status: false, message: lang('Validation.invalid_client', user.lang) })
    //         }
    //     }
    //     catch (e) {
    //         res.status(501).send({ status: false, message: e.message })
    //     }
    // }

    //Items insert or update
    // async function insert_update_item(table, user, rental_item_data, rental_get_id, _client_id_fk, _project_id_fk, rental_item_id) {
    //     let mainItem = rental_item_data;
    //     if (mainItem && mainItem.length > 0) {
    //         let rental_item_id_arr = [];
    //         let rental_item_id_fk = "";
    //         let rental_item_inserted_id = "";
    //         mainItem = await handy.transformnames('RTL', mainItem, "RentalItems");
    //         for(comt in mainItem){
    //         //for (let comt = 0; comt < mainItem.length; comt++) {
    //             rental_item_id = "";
    //             mainItem[comt]._rental_id_fk = rental_get_id;
    //             mainItem[comt]._client_id_fk = _client_id_fk;
    //             mainItem[comt]._project_id_fk = _project_id_fk;
    //             if (mainItem[comt].__rental_item_id_pk) {
    //                 rental_item_id = mainItem[comt].__rental_item_id_pk;
    //             }
    //             if (mainItem[comt].is_main_item !== undefined && !mainItem[comt].is_main_item && rental_item_id_fk && (mainItem[comt].is_header !== undefined || !mainItem[comt].is_header)) {
    //                 mainItem[comt]._rental_item_id_fk = rental_item_id_fk;
    //             }

    //             if (mainItem[comt].is_main_item !== undefined && mainItem[comt].is_main_item) {
    //                 mainItem[comt]._rental_item_id_fk = 0;
    //             }

    //             if (!rental_item_id) {
    //                 mainItem[comt].created_by = user.company_id;
    //                 mainItem[comt].created_at = new Date();
    //                 mainItem[comt].date = new Date();
    //                 let rental_item_inserted = await RentalItems.create(mainItem[comt]);
    //                 rental_item_id_arr.push(rental_item_inserted.__rental_item_id_pk);
    //                 rental_item_inserted_id = rental_item_inserted.__rental_item_id_pk;
    //                 if (mainItem[comt].is_main_item !== undefined && mainItem[comt].is_main_item) {
    //                     rental_item_id_fk = rental_item_inserted.__rental_item_id_pk;
    //                 }
    //             }
    //             else {
    //                 mainItem[comt].updated_by = user.company_id;
    //                 let rental_item_inserted = await RentalItems.update(mainItem[comt], { where: { __rental_item_id_pk: rental_item_id, _rental_id_fk: rental_get_id } });
    //                 rental_item_id_arr.push(rental_item_id);
    //                 rental_item_inserted_id = rental_item_id;
    //                 if (mainItem[comt].is_main_item !== undefined && mainItem[comt].is_main_item) {
    //                     rental_item_id_fk = rental_item_id;
    //                 }
    //             }
    //         }

    //         // if (rental_item_id_arr.length > 0 && table == "rental") {
    //         //     let items_delete = await RentalItems.destroy({ where: { __rental_item_id_pk: { [Op.notIn]: rental_item_id_arr }, _rental_id_fk: rental_get_id } });
    //         // }

    //         if (mainItem.length == 1) {
    //             return rental_item_inserted_id;
    //         } else {
    //             return rental_get_id;
    //         }
    //     }
    //     else {
    //         //let item_delete_all = await RentalItems.destroy({ where: { _rental_id_fk: rental_get_id } });
    //     }
    // }

}

module.exports = RentalRouter;
