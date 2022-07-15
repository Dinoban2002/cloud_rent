const Sequelize = require("../config/database");
const { InventoryRate, Invoice, InvoiceItems, RentalItems, Terms, Rental, TaxRate, Rate, Payment, OffHire, Return, Administration, Inventory } = require("../models/Model")(
    ["InventoryRate", "Invoice", "InvoiceItems", "RentalItems", "Terms", "Rental", "TaxRate", "Rate", "Payment", "OffHire", "Return", "Inventory", "Administration"]
);
const ivc = require("../controllers/InvoiceController");
var handy = require("../config/common");
var translate = require('../language/translate').validationMsg;
const Op = require('sequelize').Sequelize.Op;
let moment = require('moment');


async function InvoiceRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary This rout is used for create the booking invoice and blank  invoice
     * @returns Status and Created data
     */
    fastify.post('/invoice/create', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            //const data = await createInvoice(req.body, user);
            const data = await ivc.createInvoice(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (error) {
            res.status(501).send(error);
        }
    });

    


    /**
     * @author Kirankumar
     * @summary This rout is used for get invoice by invoice id
     * @returns Status and invoice id
     */
    fastify.get('/invoice/get/:invoice_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.invoice_id) {
                const data = await handy.getInvoice(0, req.params.invoice_id, 0, user);
                if (data && data.data && data.data.length) {
                    data.data = data.data[0];
                } else if (data && data.data && data.data.length == 0) {
                    data.data = {};
                }
                if (data.status) {
                    res.status(200).send(data);
                } else {
                    res.status(500).send(data);
                }
            } else {
                res.status(404).send({ status: false, message: translate('Validation.invalid_data', user.lang) });
            }

        } catch (error) {
            res.status(501).send(error);
        }
    });



    /**
     * @author Kirankumar
     * @summary This function is used for create the invoice for rental
     * @param {Rental id} rental_id
     * @returns Status and Created data
     */
    async function createInvoice(data, user) {

        const { rental_id, action_type, action_method } = data;
        let invoice_count = "";
        if (!rental_id) {
            return { status: false, message: translate('Validation.invalid_data', user.lang) };
        }
        let invoice_data = {};
        let set_rental_data = {};
        //get rental data
        const rental = await Rental.findOne({ where: { '__rental_id_pk': rental_id } });
        if (!rental) {
            return { status: false, message: translate('Validation.invalid_data', user.lang) };
        }
        let invoice_serial_no = await Invoice.max("invoice_serial_no", { where: { _rental_id_fk: rental_id } }) || 0;
        const term = await Terms.findOne({ where: { '__config_term_id_pk': rental.get("_config_term_id_fk") } });
        const rate_config = await Rate.findOne({ where: { '__rate_config_id_pk': rental.get("_rate_config_id_fk") } });
        const tax_rate_config = await TaxRate.findOne({ where: { '__tax_rate_id_pk': rental.get("_tax_rate_id_fk") } });
        const term_name = term ? term.get("term_label") : "0";
        const period_num = term_name.slice(-2);
        const type = term_name ? term_name.split(" ")[0] : term_name;


        var due_date = new Date();
        invoice_data.terms = rental.get("_config_term_id_fk");
        let rental_date = new Date(rental.get("date"));
        const rental_date_month_end = handy.get_last_date_of_month(rental_date);
        const eom = (await rental_date_month_end).getDate() - rental_date.getDate();
        if (rental.get("date") && type == "EOM") {
            rental_date.setDate(rental_date.getDate() + eom + parseInt(period_num));
            due_date = rental_date;
        } else if (type == "Due") {
            due_date = rental.get("date");
        } else if (period_num > 0) {
            //rental.get("date") + Number.isInteger(parseInt(term_name)) &&
            if (rental.get("date"))
                due_date = rental_date.setDate(rental_date.getDate() + parseInt(period_num));
        }

        if (rental.get("long_term_hire") > 1 && !rental.get("billing_date_start")) {
            return { status: true, message: translate('Validation.billing_date_not_found', user.lang) };
        }

        invoice_data._client_id_fk = rental.get("_client_id_fk");
        invoice_data._staff_id_fk = user.user_id;
        let invoice_date = new Date();
        invoice_data.date = invoice_date;
        invoice_data.type = "INVOICE";
        invoice_data.bond = rental.get("bond");
        invoice_data.selected_company_no = rental.get("selected_company_no");
        invoice_data.invoice_no = rental.get("_invoice_id_fk");
        invoice_data.collection_charge = rental.get("collection_charge");
        invoice_data._tax_rate_id_fk = rental.get("_tax_rate_id_fk");
        invoice_data.tax_rate = tax_rate_config && tax_rate_config.get("percentage") ? tax_rate_config.get("percentage") : 0;
        invoice_data.discount_cash = rental.get("discount_cash");
        invoice_data.delivery_charge = rental.get("delivery_charge");
        invoice_data.credit_card_rate = rental.get("credit_card_rate");
        invoice_data._credit_card_rate_id_fk = rental._credit_card_rate_id_fk;
        invoice_data.due_date = due_date;
        invoice_data.is_updated = 1;

        if (rental.get("long_term_hire") == 1) {
            set_rental_data = { invoiced_on: new Date(), _staff_id_fk: user.user_id, invoiced_by: user.user_id };
            invoice_data.date_start = rental.get("billing_date_start");
            invoice_data.date_end = rental.get("billing_due_date");
            if (rental.get("unstored_count_invoices") > 0) {
                if (rental.get("unstored_count_invoices") <= invoice_serial_no) {
                    invoice_count = "." + ++invoice_serial_no;
                    invoice_data.invoice_serial_no = invoice_serial_no;
                } else {
                    id_invoice = "." + rental.get("unstored_count_invoices");
                    invoice_data.invoice_serial_no = rental.get("unstored_count_invoices");
                }
            } else {
                invoice_count = "";
            }
            //invoice_count = rental.get("unstored_count_invoices") > 0 ? "." + rental.get("unstored_count_invoices") : "";
        } else {
            invoice_data.date_start = rental.get("date_start");
            invoice_data.date_end = rental.get("date_end");
        }
        if (rental.get("long_term_hire") != 1 && action_method != "duplicate") {
            if (rental.get("unstored_count_invoices") > 0) {
                if (rental.get("unstored_count_invoices") <= invoice_serial_no) {
                    invoice_count = "." + ++invoice_serial_no;
                    invoice_data.invoice_serial_no = invoice_serial_no;
                } else {
                    invoice_count = "." + rental.get("unstored_count_invoices");
                    invoice_data.invoice_serial_no = rental.get("unstored_count_invoices");
                }
            } else {
                invoice_count = "";
            }
            //invoice_count = rental.get("unstored_count_invoices") > 0 ? "." + rental.get("unstored_count_invoices") : "";
        }

        set_rental_data.unstored_count_invoices = rental.get("unstored_count_invoices") + 1;
        if (Object.keys(set_rental_data).length) {
            var rental_data = await Rental.update(set_rental_data, { where: { '__rental_id_pk': rental_id } });
        }
        invoice_data._rental_id_fk = rental_id;
        let rental_items = [];
        let damage_items = [];
        if (action_type == "booking") {
            //get rental items
            rental_items = await RentalItems.findAll({ attributes: ['balance', 'discount_rate', 'item', 'sku', 'taxable', 'type', 'qty', 'unit_price', 'units', 'amount', 'sort', 'metres', 'status', 'account_code'], where: { '_rental_id_fk': rental_id } });
            if (rental_items.length == 0) {
                return { status: true, alert: translate('Validation.invoice_item_not_found', user.lang) };
            }
            //need to do some more
            if (action_method != "clean") {
                invoice_data.summary = "Period: " + moment(invoice_data.date_start).format(user.inv_date_format) + " - " + moment(invoice_data.date_end).format(user.inv_date_format);
            }
            if (new Date(rental.get("billing_date_start")) != "Invalid Date")
                await Rental.update({ billing_date_prev: rental.get("billing_date_start"), billing_date_start: rental.get("billing_date_next") }, { where: { __rental_id_pk: rental_id } });
        }
        invoice_data.invoice_id_no = rental.get("__rental_id_pk") + invoice_count;
        let invoice = await Invoice.create(invoice_data);
        let invoice_id = 0;
        let invoice_items = [];
        if (invoice && invoice_data) {
            invoice_id = invoice.get("__invoice_id_pk");
        } else {
            return { status: false, message: translate('Validation.invoice_not_create', user.lang) };
        }
        if (action_type == "booking" && action_method != "clean") {
            let rental_item_total_discount = 0;
            let total_amount = 0;
            let taxable_amount = 0;
            // const cycle = rental.billing_cycle;
            // const period = rental.check_box_billing_set;
            // const number = rental.billing_period_amount;
            // const proRata = rental.prorata_billing;
            // const startDate = rental.billing_date_start;
            // const endDate = rental.date_end;
            // const count = await Invoice.count({ where: { _rental_id_fk: rental.__rental_id_pk } });
            // const start_date_obj = new Date(startDate);
            // const daysInMonth2 = new Date(start_date_obj.getFullYear(), start_date_obj.getMonth() + 1, 0).getDate();
            // const daysInMonth = new Date(start_date_obj.getFullYear(), start_date_obj.getMonth(), 0).getDate();
            //const invoiceCount = Interface::unstored_countInvoices ;
            //const amount = Case ( number = 1 ; "" ; cycle = "Weekly" ;  7  ; cycle = "Fortnightly" ; 14 ; cycle = "Monthly" ; daysInMonth  ; cycle = "2 Monthly" ;  daysInMonth + daysInMonth2 ) ;
            //const lastDay = Interface::unstored_lastDayBillingMonth

            rental_items.forEach(rental_item => {
                rental_item_total_discount += rental_item.get("discount_amount") ? rental_item.get("discount_amount") : 0;
                total_amount += rental_item.get("amount") ? rental_item.get("amount") : 0;
                taxable_amount += rental_item.get("taxable_amount") ? rental_item.get("taxable_amount") : 0;
                var invoice_item = {};
                const taxable = rental_item.get("taxable");
                const item_type = rental_item.get("type");
                const status = rental_item.get("status");
                const is_re_occur = rental_item.get("is_re_occur");
                const balance = rental_item.get("balance") ? rental_item.get("balance") : 0;
                //const ri_qty = (balance == 0 &&  (status == "PENDING" || status == "IN"))?rental_item.get("qty"):balance;
                const ri_qty = rental_item.get("qty");
                //invoice_items
                let key = (rental.unstored_count_invoices > 0 && !is_re_occur && item_type == "SELL" || item_type == "SERVICE") && action_method != "duplicate" ? 1 : 0;
                if (key != 1) {
                    if (ri_qty != 0) {
                        if (balance == 0 && status == "IN") {
                            invoice_item.sku = rental_item.get("sku");
                            invoice_item.qty = ri_qty;
                            if (taxable)
                                invoice_item.taxable = taxable;
                            invoice_item.item = rental_item.get("item");
                            invoice_item.unit_price = rental_item.get("unit_price");
                        } else if (balance == 0 && status != "PENDING") {
                        } else {
                            invoice_item.sku = rental_item.get("sku");
                            invoice_item.qty = ri_qty;
                            if (taxable)
                                invoice_item.taxable = taxable;
                            invoice_item.item = rental_item.get("item");
                            invoice_item.unit_price = rental_item.get("unit_price");
                        }
                        let days = 0;
                        if (rental.get("billing_due_date") != '0000-00-00' && rental.get("billing_date_start") != '0000-00-00') {
                            days = (Math.abs(new Date(rental.get("billing_date_end")) - new Date(rental.get("billing_date_start"))) / (1000 * 3600 * 24)) + 1;
                        }
                        var rate = rental.get("rate");
                        invoice_item.type = item_type;
                        invoice_item.sort_index = rental_item.get("sort");
                        invoice_item.discount_rate = rental_item.get("discount_rate") ? parseFloat(rental_item.get("discount_rate")) : 0;
                        //invoice_item._invoice_id_fk = invoice_id;
                        if (rental.get("long_term_hire") == 1 && item_type != "SERVICE") {
                            if (rental.get("check_box_billing_set") == 1 && rental.get("unstored_count_invoices") < 1) {
                                invoice_item.units = rental.get("period_no");
                            } else if (rental.get("prorata_billing")) {
                                invoice_item.units = rental.get("prorata_billing");
                            } else if (rate_config && rate_config.get("is_daily")) {
                                invoice_item.units = rental.get("billing_period_no");
                            } else if (rate_config && rate_config.get("is_weekly")) {
                                invoice_item.units = days ? Math.round(days / 7, 2) : 0;
                            } else {
                                invoice_item.units = 1;
                            }
                        } else {
                            invoice_item.units = rental_item.get("units");
                        }
                    } else {
                        key = 0;
                    }
                }

                if (Object.keys(invoice_item).length) {
                    invoice_items.push(invoice_item);
                }
            });
        }
        invoice_items.map(value => {
            value._invoice_id_fk = invoice_id;
            return value;
        })
        if (invoice_items.length) {
            invoice_items = await InvoiceItems.bulkCreate(invoice_items);
            // const responds = await getInvoice(0,invoice_id,0,user);
            // return responds;
        }
        await handy.update_rental_billing_dates(rental_id, user);
        const responds = await handy.getInvoice(0, invoice_id, 0, user, true);
        return responds;
    }

    /**
     * @author Kirankumar
     * @summary This rout is used for create the damage invoice
     * @returns Status and Created data
     */
    fastify.post('/invoice/damage/create', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await ivc.createDamageInvoice(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (error) {
            res.status(501).send(error);
        }
    });




    /**
     * @author Kirankumar
     * @summary This rout is used for create the off hire full invoice
     * @returns Status and Created data
     */
    fastify.post('/invoice/offhirefull/create', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            req.body.action_type = "offhire";
            const data = await ivc.createInvoice(req.body, user);

            //const data = await createOffHireFull(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (error) {
            res.status(501).send(error);
        }
    });

    /**
     * @deprecated 1.0.0
     * @author Kirankumar
     * @summary This function is used for update off hire full
     * @param {Rental id} rental_id
     * @returns Status and Created data
     */
    async function createOffHireFull(data, user) {
        const { rental_id } = data;
        if (!rental_id) {
            return { status: false, message: translate('Validation.invalid_data', user.lang) };
        }
        // if option came as clean then call createInvoice.
        if (data.action_method && data.action_method == "clean") {
            data.action_type = "booking";
            return createInvoice(data, user);
        }

        //get rental data
        const rental = await Rental.findOne({ where: { '__rental_id_pk': rental_id, is_deleted: 0 } });
        if (!rental) {
            return { status: false, message: translate('Validation.invalid_data', user.lang) };
        }
        let invoice_serial_no = await Invoice.max("invoice_serial_no", { where: { _rental_id_fk: rental_id } }) || 0;
        // set account code
        // if(rental.selected_company_no == 1){

        // }
        if (!rental.off_hire_number) {
            return { status: true, alert: translate('Validation.rental_off_hire_full_alert', user.lang) };
        }
        if (rental.long_term_hire == 1 && (new Date(rental.billing_date_start) == "Invalid Date" || !rental.billing_date_start)) {
            return { status: true, alert: translate('Validation.rental_off_hire_full_billing_date_alert', user.lang) };
        }

        const summary = "OFF RENTAL INVOICE: " + (new Date(rental.billing_date_start) == "Invalid Date" ? "" : moment(rental.billing_date_start).format(user.inv_date_format)) + " - " + moment(rental.off_hire_date).format(user.inv_date_format);
        const rental_update = {
            invoiced_by: user.user_id,
            invoiced_on: new Date()
        }

        //const invoice_count = rental.unstored_count_invoices > 0 ? "." + rental.unstored_count_invoices : "";
        //not modifiable
        if (rental.unstored_count_invoices <= 0) {
            rental_update.billing_date_end = rental.off_hire_date;
        }
        let invoice_data = {
            _client_id_fk: rental._client_id_fk,
            _rental_id_fk: rental.__rental_id_pk,
            date: new Date(),
            type: "INVOICE",
            selected_company_no: rental.selected_company_no,
            reference_xero: rental.job_name,
            _tax_rate_id_fk: rental._tax_rate_id_fk,
            discount_cash: rental.discount_cash,
            //credit_card_rate : _credit_card_rate_id_fk
            _credit_card_rate_id_fk: rental._credit_card_rate_id_fk,
            terms: rental.terms,
            summary,
            due_date: new Date(),
            is_updated: 1,
        }
        let invoice_count = "";
        if (rental.unstored_count_invoices > 0) {
            if (rental.unstored_count_invoices <= invoice_serial_no) {
                invoice_count = "." + ++invoice_serial_no;
                invoice_data.invoice_serial_no = invoice_serial_no;
            } else {
                invoice_count = "." + rental.unstored_count_invoices;
                invoice_data.invoice_serial_no = rental.unstored_count_invoices;
            }
        }
        invoice_data.invoice_id_no = rental.get("__rental_id_pk") + invoice_count;
        if (rental.long_term_hire == 1) {
            invoice_data.date_start = rental.billing_date_start;
            invoice_data.date_end = rental.off_hire_date
        } else {
            invoice_data.date_start = rental.date_start;
            invoice_data.date_end = rental.date_end;
        }
        invoice_data = await Invoice.create(invoice_data);
        await Rental.update({ unstored_count_invoices: rental.unstored_count_invoices + 1 }, { where: { '__rental_id_pk': rental_id, is_deleted: 0 } })
        const invoice_id = invoice_data.__invoice_id_pk;
        const rental_items = await RentalItems.findAll({ where: { _rental_id_fk: rental_id } });
        const invoice_items = [];
        for (const item of rental_items) {
            let qty = 0;
            if ((item.balance == 0 && item.status == "PENDING") || item.status == "IN") {
                qty = item.qty;
            } else {
                qty = item.balance;
            }
            let key = 0;
            if (rental.unstored_count_invoices > 0 && !item.is_re_occur && item.type == "SELL" && item.type == "SERVICE") {
                key = 1;
            }
            if (!key && qty != 0) {
                let invoice_item = {};
                if (!(item.balance == 0 && item.status != "PENDING")) {
                    invoice_item = {
                        _invoice_id_fk: invoice_id,
                        _client_id_fk: rental._client_id_fk,
                        _rental_id_fk: rental.__rental_id_pk,
                        qty,
                        sku: item.sku,
                        taxable: item.taxable,
                        item: item.item,
                        unit_price: item.unit_price,

                    }
                } else {
                    continue;
                }
                invoice_item.type = item.type;
                //invoice_item.sort_index = item.sort_index
                invoice_item._inventory_id_fk = item._inventory_id_fk;
                invoice_item.discount_rate = item.discount_rate;
                if (rental.long_term_hire == 1 && item.type != "SERVICE") {
                    if (rental.unstored_count_invoices < 1) {
                        invoice_item.units = item.period_no;
                    } else if (rental.off_hire_partial_return_percentage && rental.prorata_billing == 1) {
                        invoice_item.units = rental.off_hire_partial_return_percentage;
                    } else if (rental.rate && rental.rate.toLowerCase() == "daily") {
                        invoice_item.units = rental.billing_period_no;
                    } else if (rental.rate && rental.rate.toLowerCase() == "weekly") {//need to check this functionality
                        invoice_item.units = rental.off_hire_partial_return_percentage;
                    } else {
                        invoice_item.units = 1;
                    }
                } else {
                    invoice_item.units = item.units;
                }

                if (item.account_code) {
                    invoice_item.account_code_xero = item.account_code;
                } else {
                    //need to check with linga
                    invoice_item.account_code_xero = item.account_code;
                }
                invoice_items.push(invoice_item);
            }
        }
        if (rental.delivery_charge) {
            let invoice_item = {
                _invoice_id_fk: invoice_id,
                _client_id_fk: rental._client_id_fk,
                _rental_id_fk: rental.__rental_id_pk,
                qty: 1,
                sku: 'DEL',
                //taxable:item.taxable,
                item: 'Delivery Charge',
                unit_price: rental.delivery_charge,
                //invoice_item.account_code_xero = $$surcharge.code
                type: "SERVICE",
                //invoice_run:$$invoice.run
            }
            invoice_items.push(invoice_item);
        }
        if (rental.collection_charge) {
            let invoice_item = {
                _invoice_id_fk: invoice_id,
                _client_id_fk: rental._client_id_fk,
                _rental_id_fk: rental.__rental_id_pk,
                qty: 1,
                sku: 'COL',
                //taxable:item.taxable,
                item: 'Collection Charge',
                unit_price: rental.collection_charge,
                //invoice_item.account_code_xero = $$surcharge.code
                type: "SERVICE",
                //invoice_run:$$invoice.run
            }
            invoice_items.push(invoice_item);
        }
        //need to check with linga
        // if(surcharge){
        //     let invoice_item = {
        //         qty:1,

        //         //invoice_item.account_code_xero = $$surcharge.code
        //         type:"SERVICE",
        //         //invoice_run:$$invoice.run
        //     }
        //     invoice_items.push(invoice_item);
        // }
        const off_hire_items = await OffHire.findAll({
            where: {
                _rental_id_fk: rental_id, billed: 0, pro_rata_percent: {
                    [Op.gt]: 0
                }
            }
        })

        if (off_hire_items.length) {
            for (const item of off_hire_items) {

                const invoice_item = {
                    _invoice_id_fk: invoice_id,
                    _client_id_fk: rental._client_id_fk,
                    _rental_id_fk: rental.__rental_id_pk,
                    sku: item.sku,
                    //invoice_run : $$INVOICE.RUN
                    units: item.pro_rata_percent,
                    unit_price: item.price,
                    qty: item.qty_in,
                    taxable: 1
                }
                if (item.is_stand_down) {
                    invoice_item.item = item.item_name + " - Stand Down " + item.days + " day/s " + rental.date_start + " - " + rental.date_end;
                } else {
                    if (item.metre_charge) {
                        invoice_item.qty = item.panels,
                            invoice_item.item = item.qty_in + " METRES PARTIAL RETURN: " + rental.date_start + " - " + rental.date_end + " - " + item.days + " days " + rental.date_start + " - " + rental.date_end
                        invoice_item.metres = item.qty_in;
                    } else {
                        invoice_item.qty = item.qty,
                            invoice_item.item = item.item_name + " - " + item.days + " day/s " + rental.date_start + " - " + rental.date_end
                    }
                }

                invoice_items.push(invoice_item);
            }
        }
        if (invoice_items.length) {
            const items = await InvoiceItems.bulkCreate(invoice_items);
        }
        //await handy.calculate_invoice_update(invoice_id, user);
        const responds = await handy.getInvoice(0, invoice_id, 0, user, true);
        return responds;
    }
    /**
     * @author Kirankumar
     * @summary This rout is used for create the off hire partial invoice
     * @returns Status and Created data
     */
    fastify.post('/invoice/offhirepartial/create', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await createOffHirePartial(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (error) {
            res.status(501).send(error);
        }
    });

    /**
     * @author Kirankumar
     * @summary This function is used for update off hire partial
     * @param {Rental id} rental_id
     * @returns Status and Created data
     */
    async function createOffHirePartial(data, user) {
        const { rental_id } = data;
        const invoice_data = [];
        if (!rental_id) {
            return { status: false, message: translate('Validation.invalid_data', user.lang) };
        }
        //get rental data
        Rental.belongsTo(Terms, { targetKey: '__config_term_id_pk', foreignKey: '_config_term_id_fk' })
        const rental = await Rental.findOne({
            raw: true, where: { '__rental_id_pk': rental_id, is_deleted: 0 },
            include: {
                model: Terms
            }
        });
        if (rental) {
            rental.__rental_id_pk = rental.__rental_id_pk.toString().padStart(6, '0');
            const off_hire_items = await OffHire.findAll({
                where: {
                    _rental_id_fk: rental_id, billed: 0, pro_rata_percent: {
                        [Op.gt]: 0
                    }
                }
            })
            if (off_hire_items.length) {
                const terms = rental["config_term.term_label"];
                let days = 0;
                if (terms.toLowerCase() == "due on receipt") {
                    days = 0;
                } else if (terms.toLowerCase() == "eom 30") {
                    const total_days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                    const remaining_count = total_days - new Date().getDate();
                    days = remaining_count + 30;
                } else if (terms.toLowerCase() == "net 15") {
                    days = 15;
                } else if (terms.toLowerCase() == "net 30") {
                    days = 30;
                } else if (terms.toLowerCase() == "net 45") {
                    days = 45;
                } else if (terms.toLowerCase() == "net 60") {
                    days = 60;
                } else if (terms.toLowerCase() == "net 90") {
                    days = 90;
                }
                const due_date = new Date().setDate(new Date().getDate() + days);
                const invoice_data = {
                    _client_id_fk: rental._client_id_fk,
                    _rental_id_fk: rental_id,
                    selected_company_no: rental.selected_company_no,
                    _tax_rate_id_fk: rental._tax_rate_id_fk,
                    summary: "PARTIAL RETURN: " + (new Date(rental.billing_date_start) == "Invalid Date" ? "" : moment(rental.billing_date_start).format(user.inv_date_format)) + " - " + (new Date(rental.off_hire_date) == "Invalid Date" ? "" : moment(rental.off_hire_date).format(user.inv_date_format)),
                    date_start: rental.date_start,
                    date_end: rental.date_end,
                    due_date,
                    type: "INVOICE",
                    date: new Date(),
                    is_updated: 1,
                    is_off_hire: 1
                }
                const invoice_count = rental.unstored_count_invoices > 0 ? "." + rental.unstored_count_invoices : "";
                invoice_data.invoice_id_no = rental.__rental_id_pk + invoice_count;
                let invoice_patial = await Invoice.create(invoice_data);
                if (off_hire_items.length && invoice_patial.__invoice_id_pk) {
                    const invoice_items = [];
                    for (item of off_hire_items) {
                        const invoice_item = {
                            _invoice_id_fk: invoice_patial.__invoice_id_pk,
                            _client_id_fk: rental._client_id_fk,
                            sku: item.sku,
                            units: item.pro_rata_percent,
                            qty: item.panels || 1,
                            unit_price: item.price,
                            //taxable:item.taxable
                        }
                        if (item.metre_charge) {
                            invoice_item.item = item.qty_in + " METRES PARTIAL RETURN: " + moment(rental.date_start).format(user.inv_date_format) + " - " + moment(rental.date_end).format(user.inv_date_format);
                            invoice_item.metres = item.qty_in;
                        } else {
                            invoice_item.item = item.item_name + " " + item.summary || "";
                        }
                        invoice_items.push(invoice_item);
                    }
                    const items = await InvoiceItems.bulkCreate(invoice_items);
                } else {
                    return { status: false, message: translate('Validation.invalid_data', user.lang) };
                }
                //await handy.calculate_invoice_update(invoice_patial.__invoice_id_pk, user);
                const responds = await handy.getInvoice(0, invoice_patial.__invoice_id_pk, 0, user, true);
                return responds;
            } else {
                return { status: true, alert: translate('Validation.no_items_found', user.lang) };
            }
        } else {
            return { status: false, message: translate('Validation.invalid_data', user.lang) };
        }
    }


    /**
     * @author Kirankumar
     * @summary This Rout is usefull to update the Invoice
     * @returns Status and Updated data
     */
    fastify.post('/invoice/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await updateInvoice(req.body, user);
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
     * @summary This Rout is usefull to update the first Invoice
     * @returns Status and Updated data
     */
    fastify.post('/rentalinvoice/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await update_rental_invoice(req.body, user);
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
     * @summary This Rout is usefull to create the client credit note
     * @returns Status and created invoice data
     */
    fastify.post('/client/creditnote/create', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_credit_note(req.body, user);
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
     * @summary This function is used for update first invoice in rental
     * @param {Request body} body 
     * @param {Logged in user data} user 
     * @returns Status and updated data
     */
    async function update_rental_invoice(body, user) {
        if (body && body.rental_id) {
            const rental = await Rental.findOne({ where: { __rental_id_pk: body.rental_id, is_deleted: 0 } })
            const rental_invoices_first = await Invoice.findOne({ where: { _rental_id_fk: body.rental_id } });
            if (rental_invoices_first) {
                const invoice_id = rental_invoices_first.__invoice_id_pk;
                const delete_count = await InvoiceItems.destroy({ where: { _invoice_id_fk: rental_invoices_first.__invoice_id_pk } });
                const rental_items = await RentalItems.findAll({ where: { _rental_id_fk: rental_invoices_first._rental_id_fk } });
                const invoice_items = [];
                if (rental_items.length) {
                    for (const item of rental_items) {
                        let key = 0;
                        let qty = 0;
                        const invoice_item = {};
                        if (!rental.long_term_hire) {
                            qty = item.qty;
                        } else {
                            if (!item.balance) {
                                qty = item.qty;
                            } else {
                                qty = item.balance;
                            }
                            if (rental.unstored_count_invoices > 0 && !item.is_re_occur && item.type == "SELL" || item.type == "SERVICE") {
                                key = 1
                            }
                        }
                        if (qty && !key) {
                            invoice_item.qty = qty;
                            invoice_item.sku = item.sku;
                            invoice_item.taxable = item.taxable;
                            invoice_item.item = item.item;
                            invoice_item.unit_price = item.unit_price;
                            invoice_item.type = item.type;
                            invoice_item._inventory_id_fk = item._inventory_id_fk;
                            invoice_item.discount_rate = item.discount_rate;
                            invoice_item._invoice_id_fk = invoice_id;
                            if (!rental.long_term_hire) {
                                invoice_item.units = item.units;
                            }
                            if (item.metres) {
                                //invoice_data.meterage_charge = 1;
                                invoice_item.metres = item.metres;
                            }
                            invoice_items.push(invoice_item);
                        }
                    }
                } else {
                    return { status: false, alert: translate('Validation.damage_items_not_found', user.lang) }
                }

                if (rental.delivery_charge) {
                    let invoice_item = {
                        _invoice_id_fk: invoice_id,
                        _client_id_fk: rental._client_id_fk,
                        _rental_id_fk: rental.__rental_id_pk,
                        qty: 1,
                        sku: 'DEL',
                        //taxable:item.taxable,
                        item: 'Delivery Charge',
                        unit_price: rental.delivery_charge,
                        //invoice_item.account_code_xero = $$surcharge.code
                        //type:"SERVICE",
                        //invoice_run:$$invoice.run
                    }
                    invoice_items.push(invoice_item);
                }
                if (rental.collection_charge) {
                    //invoice_data.collection_charge = rental.collection_charge;
                    let invoice_item = {
                        _invoice_id_fk: invoice_id,
                        _client_id_fk: rental._client_id_fk,
                        _rental_id_fk: rental.__rental_id_pk,
                        qty: 1,
                        sku: 'COL',
                        //taxable:item.taxable,
                        item: 'Collection Charge',
                        unit_price: rental.collection_charge,
                        //invoice_item.account_code_xero = $$surcharge.code
                        //type:"SERVICE",
                        //invoice_run:$$invoice.run
                    }
                    invoice_items.push(invoice_item);
                }
                //need to check with linga
                // if(surcharge){
                //     let invoice_item = {
                //         qty:1,

                //         //invoice_item.account_code_xero = $$surcharge.code
                //         type:"SERVICE",
                //         //invoice_run:$$invoice.run
                //     }
                //     invoice_items.push(invoice_item);
                // }
                const return_items = await Return.findAll({
                    where: {
                        _rental_id_fk: body.rental_id, billed: 0, pro_rata_percent: {
                            [Op.gt]: 0
                        }
                    }
                });
                for (const item of return_items) {
                    const return_item = {
                        sku: item.sku,
                        qty: item.qty_in,
                        units: item.pro_rata_percent,
                        item: item.item_name + " returned - " + item.days + " days " + item.billing_date_start + " - " + item.billing_date_end + " by " + item.return_contact,
                        unit_price: item.price,
                        taxable: 1,
                        _invoice_id_fk: invoice_id
                    }
                    invoice_items.push(return_item);
                }
                await InvoiceItems.bulkCreate(invoice_items);
                //await handy.calculate_invoice_update(invoice_id, user);
                const responds = await handy.getInvoice(0, invoice_id, 0, user, true);
                return responds;
            } else {
                return { status: true, alert: translate('Validation.damage_items_not_found', user.lang) }
            }
        } else {
            return { status: false, message: translate('Validation.invalid_data', user.lang) }
        }


    }

    /**
     * @author Kirankumar
     * @summary This function is used for update the Invoice
     * @param {Invoice data} data 
     * @param {Logged in user data} user 
     * @requires Status and updated data
     */
    async function updateInvoice(data, user) {
        const out_data = await handy.create_update_table(data, user, Invoice, "Invoice", "__invoice_id_pk");
        if (out_data.data && out_data.data.invoice_id) {
            out_data.data.invoice_calculated_data = await handy.calculate_invoice_update(out_data.data.invoice_id, user, true);
        }
        return out_data;
    }

    /**
     * @author Kirankumar
     * @summary This Rout is usefull to create or update the Invoice item
     * @requires Status and Updated data
     */
    fastify.post('/invoiceitem/update', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_or_update_invoice_item(req.body, user);
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
     * @summary This Rout is usefull to create bulk invoice items
     * @requires Status and created data
     */
    fastify.post('/invoice/item/create', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_invoice_items(req.body, user);
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
     * @summary This function is used for create bulk invoice items.
     * @param {inventory item ids} body 
     * @param {Logged in user details} user 
     * @returns status and created data.
     */
    async function create_invoice_items(body, user) {
        if (body.item_ids && body.item_ids.length && body.invoice_id) {
            const item_data = await Inventory.findAll({
                raw: true, attributes: [
                    ["__inventory_id_pk", "_inventory_id_fk"],
                    "item", "sku", "taxable"
                ], where: { __inventory_id_pk: body.item_ids, is_deleted: 0 }
            });
            if (item_data.length) {
                Invoice.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk' })
                const invoice_Data = await Invoice.findOne({
                    raw: true, attributes: ["_rental_id_fk", "_client_id_fk"], where: { __invoice_id_pk: body.invoice_id },
                    include: {
                        model: Rental,
                        attributes: ["_client_id_fk", "_rate_config_id_fk"],
                    }
                });
                const admin_data = await Administration.findOne({ attributes: ["default_rate"], where: { _company_id_fk: user.company_id } });
                for (let key in item_data) {
                    let unit_price = 0;
                    item_data[key]._invoice_id_fk = body.invoice_id;
                    item_data[key]._client_id_fk = invoice_Data._client_id_fk;
                    item_data[key]._rental_id_fk = invoice_Data._rental_id_fk;
                    item_data[key].qty = 1;
                    item_data[key].pos = 1;
                    item_data[key].units = 1;
                    if (invoice_Data["rental._rate_config_id_fk"]) {
                        const rate_data = await InventoryRate.findOne({ where: { _rate_config_id_fk: invoice_Data["rental._rate_config_id_fk"], _inventory_id_fk: item_data[key]["_inventory_id_fk"] } })
                        unit_price = rate_data ? rate_data.price_extra_tax : 0;
                    } else {
                        if (admin_data && admin_data.default_rate) {
                            const rate_data = await InventoryRate.findOne({ where: { rate_name: admin_data.default_rate, _inventory_id_fk: item_data[key]["_inventory_id_fk"] } })
                            unit_price = rate_data ? rate_data.price_extra_tax : 0;
                        }
                    }
                    item_data[key].unit_price = unit_price;
                }
                if (item_data && item_data.length) {
                    let data = await InvoiceItems.bulkCreate(item_data);
                    data = await handy.transformnames('LTR', data, "InvoiceItems");
                    data = { items: data }
                    let invoice_calculated_data = await handy.calculate_invoice_update(body.invoice_id, user, true);
                    return { status: true, data, invoice_calculated_data }
                } else {
                    return { status: false, message: translate('Validation.item_not_found', user.lang) }
                }
            } else {
                return { status: false, message: translate('Validation.invalid_data', user.lang) }
            }
        } else {
            return { status: false, message: translate('Validation.invalid_data', user.lang) }
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used for create or update the invoice item
     * @param {Invoice item data} body 
     * @param {Logged in user} user 
     * @requires Status and Updated data
     */
    async function create_or_update_invoice_item(data, user) {
        if (!(data && (data.invoice_item_id || data.invoice_id))) {
            return { status: false, message: translate('Validation.invalid_data', user.lang) }
        }
        const out_data = await handy.create_update_table(data, user, InvoiceItems, "InvoiceItems", "__invoice_item_id_pk");
        if (out_data.data && out_data.data.invoice_item_id) {
            const invoice_item = await InvoiceItems.findOne({ attributes: ["_invoice_id_fk"], where: { __invoice_item_id_pk: out_data.data.invoice_item_id } });
            if (invoice_item._invoice_id_fk)
                out_data.invoice_calculated_data = await handy.calculate_invoice_update(invoice_item._invoice_id_fk, user, true);
        }
        return out_data;
    }

    /**
     * @author Kirankumar
     * @summary This rout is used for create  credit note invoice
     * @param {input data} data 
     * @param {Loggedin user data} user 
     * @returns status and created invoice data
     */
    async function create_credit_note(data, user) {
        if (data.client_id && (data.amount || data.amount == 0)) {
            const date = new Date();
            const date_string = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
            const invoice_update = {
                _client_id_fk: data.client_id,
                summary: "CREDIT NOTE: " + date_string,
                type: "CREDIT NOTE",
                disp_total: data.amount,
                comments: "CREDIT NOTE: " + date_string,
                due_date: date,
                date: date,
                creation_timestamp: date,
                created_at: date,
                created_by: user.user_id
            }
            const invoice_data = await Invoice.create(invoice_update);
            if (invoice_data.__invoice_id_pk) {
                const invoice_item = {
                    _invoice_id_fk: invoice_data.__invoice_id_pk,
                    qty: 1,
                    taxable: 1,
                    units: 1,
                    unit_price: -data.amount,
                    sku: "CNOTE",
                    item: "CREDIT NOTE",
                    created_at: date,
                    created_by: user.user_id
                }
                await InvoiceItems.create(invoice_item);
            } else {
                return { status: false, message: translate('Validation.record_not_inserted', user.lang) }
            }
            //await handy.calculate_invoice_update(invoice_data.__invoice_id_pk, user);
            const responds = await handy.getInvoice(0, invoice_data.__invoice_id_pk, 0, user, true);
            return responds;
        } else {
            return { status: false, message: translate('Validation.invalid_data', user.lang) }
        }
    }

    /**
     * @author Kirankumar
     * @summary This rout used to create pdf and will send mail body
     * @returns status and pdf ref  and mail body
     */
    fastify.post('/invoice/mail', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            //const data = await handy.get_pdf(req.body, user);
            //need to do later
            let data = {
                status: true, data: {
                    ref_id: "170da40a-b1ed-4bd2-b94c-0356692c9d7a",
                    mail_body: `Hi, and thank you for your business, \n\nHere's invoice 000001 for $100.00 AUD due on 21-12-2022.\n\nIf paying by EFT here are our account details: \nBSB: BSB  \nAccount: 123456789 \n\n(please use the invoice number as the reference) \n\nIf you have any questions, please let us know. \n\nThanks, \nfooter \noffice email`
                }
            }
            if (!(req.body && req.body.invoice_id)) {
                data = { status: false, message: translate('Validation.invalid_data', user.lang) }
            }
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
     * @summary This function will calculate invoice data
     * @param {Invoice id} invoice_id 
     * @param {Logged in user data} user 
     * @returns Void
     */
    //  async function calculate_invoice_update(invoice_id, user) {
    //     try {
    //         let data = await Invoice.findOne({ where: { __invoice_id_pk: invoice_id } });
    //         data.items = await InvoiceItems.findAll({ where: { _invoice_id_fk: invoice_id } })
    //         data = await handy.transformnames('LTR', data, "Invoice", { InvoiceItems: "invoice_item" });
    //         let invoice_items = [];
    //         let discount = subtotal = tax = summary = 0;
    //         let {tax_rate, credit_card_rate, discount_cash, surcharge, bond,date_start,date_end,delivery_charge,meterage_charge,collection_charge} = data;
    //         let  items_discount_amount= items_amount = 0;
    //         const taxable_amount = 0;
    //         if(data.invoice_items){
    //             invoice_items = data.invoice_items;
    //             delete data.invoice_items;
    //             for(let i = 0; i<invoice_items.length;i++){
    //                 let item = invoice_items[i];
    //                 let  discount_amount= 0;
    //                 let {qty,units,unit_price,taxable,discount_rate,metres} = item;
    //                 discount_rate = discount_rate > 1 ? (discount_rate / 100) : discount_rate;
    //                 if(units > 0){
    //                     discount_amount = (qty*unit_price*units)*discount_rate;
    //                 }else{
    //                     discount_amount = (qty*unit_price)*discount_rate;
    //                 }
    //                 if(meterage_charge == 1 && !metres && units <= 0){
    //                     items_amount += (unit_price*qty) - discount_amount;
    //                 }else if(meterage_charge == 1 && !metres && units >= 1){
    //                     items_amount += (unit_price*qty*units) - discount_amount;
    //                 }else if(meterage_charge == 1 && metres && units >= 1){
    //                     items_amount += (unit_price*metres*qty*units) - discount_amount;
    //                 }else if(meterage_charge == 1 && metres && units <= 0){
    //                     items_amount += (unit_price*metres*qty) - discount_amount;
    //                 }else if(units > 0){
    //                     items_amount += (unit_price*qty*units) - discount_amount;
    //                 }else if(units < 0){
    //                     items_amount += (unit_price*qty) - discount_amount;
    //                 }
    //                 items_discount_amount += discount_amount;
    //                 item = handy.transformnames('RTL',item,"InvoiceItems");
    //                 if(item.__invoice_item_id_pk){
    //                     await InvoiceItems.update(item,{where:{__invoice_item_id_pk : item.__invoice_item_id_pk}});
    //                 }
    //             }
    //         } 
    //         discount = items_discount_amount + discount_cash;
    //         if(!delivery_charge){
    //             subtotal = Math.round((items_amount + bond + delivery_charge+collection_charge + surcharge - discount_cash)/0.05)*0.05;
    //         }
    //         if(credit_card_rate){
    //             credit_card_charge = Math.round(((subtotal - bond)*credit_card_rate)/0.05)*0.05;
    //         }else{
    //             credit_card_charge = 0;
    //         }
    //         if(tax_rate){
    //             tax = (((taxable_amount+credit_card_charge+delivery_charge+collection_charge-discount)*tax_rate)/0.05)*0.05
    //         }
    //         if(!data.summary)
    //         data.summary = "Rental Period: "+date_start + " - " + date_end;
    //         data.total = subtotal + tax + credit_card_charge;
    //         data.status = "";
    //         const amount_paid = await Payment.sum("payment_amount",{where:{_invoice_id_fk:invoice_id}})
    //         const diff_days = Math.round((new Date() - new Date(data.due_date))/(1000 * 60 * 60 * 24));
    //         if(diff_days < 0 && data.total != amount_paid){
    //             data.status = "NOT DUE";
    //         }else if((amount_paid != 0 || data.invoice_type == "CREDIT NOTE") && data.total <=  amount_paid){
    //             data.status = "PAID";
    //         }else if(diff_days == 0 && data.total != amount_paid){
    //             data.status = "UNPAID";
    //         }else if(diff_days >= 0){
    //             data.status = "UNPAID OVERDUE";
    //         }
    //         data = handy.transformnames('RTL',data,"Invoice");
    //         data.updated_by = user.user_id;
    //         await Invoice.update(data,{where:{__invoice_id_pk :invoice_id}});
    //         //const responds = await getInvoice(0, req.params.invoice_id);
    //         //res.status(200).send(responds);
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }

    /**
     * @author Kirankumar
     * @summary This rout is used for get invoice data for Rental by rental id
     * @param {Rental id} rental_id
     * @returns Status and List of invoice data
     */
    fastify.get('/invoice/rental/:rental_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const responds = await ivc.getInvoice(req.params.rental_id, user);
            res.status(200).send(responds);
        } catch (e) {
            res.status(501).send({ status: false, message: translate('Validation.Exception', user.lang) });
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for get invoice data for client by client id
     * @param {client id} client_id
     * @returns Status and List of invoice data
     */
    fastify.get('/invoice/client/:client_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const responds = await handy.getInvoice(0, 0, req.params.client_id, user);
            res.status(200).send(responds);
        } catch (e) {
            res.status(501).send({ status: false, message: translate('Validation.Exception', user.lang) });
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is used to delete the invoice
     * @param {invoice id} invoice_id
     * @requires invoice_id
     * @returns status and message
     */
    fastify.delete('/invoice/delete/:invoice_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = {};
            if (req.params && req.params.invoice_id) {
                const invoice = await Invoice.findOne({ attributes: ["_client_id_fk", "_rental_id_fk"], where: { __invoice_id_pk: req.params.invoice_id } })
                if (invoice) {
                    await Invoice.destroy({ where: { __invoice_id_pk: req.params.invoice_id } });
                    await InvoiceItems.destroy({ where: { _invoice_id_fk: req.params.invoice_id } });
                    await handy.client_calculations(invoice._client_id_fk, user, true);
                    if (invoice._rental_id_fk) {
                        const rental = await Rental.findOne({ attributes: ["billing_date_start", "billing_date_prev", "long_term_hire", "off_hire_number"], where: { __rental_id_pk: invoice._rental_id_fk, is_deleted: 0 } })
                        if (rental) {
                            if (rental.long_term_hire && rental.billing_date_start && new Date(rental.billing_date_start) != "Invalid Date") {
                                //let billing_date_start = new Date(new Date(rental.billing_date_start).getDate() -1 1)
                                if (rental.long_term_hire) {
                                    //if (!rental.off_hire_number) {
                                    await Rental.update(
                                        {
                                            billing_date_start: rental.billing_date_prev
                                        },
                                        {
                                            where: {
                                                __rental_id_pk: invoice._rental_id_fk, is_deleted: 0
                                            }
                                        }
                                    );
                                    //}
                                    await handy.update_rental_billing_dates(invoice._rental_id_fk, user);
                                }
                                //const count = await Invoice.count({ where: { _rental_id_fk: invoice._rental_id_fk } })
                            }
                            data.rental_calculated_data = await handy.auto_update_or_calculate_rental(invoice._rental_id_fk, true, user, true)
                        }

                    }
                    //data.stepper = await handy.update_stepper(invoice._rental_id_fk);
                    res.status(200).send({ status: true, data, message: translate('Validation.record_deleted', user.lang) });
                } else {
                    res.status(404).send({ status: false, message: translate('Validation.record_not_exist', user.lang) });
                }
            } else {
                res.status(501).send({ status: false, message: translate('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This function is used to delete the invoice
     * @param {invoice id} invoice_id
     * @requires invoice_id
     * @returns status and message
     */
    fastify.delete('/invoiceitem/delete/:invoice_item_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            let invoice_calculated_data = {};
            if (req.params && req.params.invoice_item_id) {
                const invoice_item = await InvoiceItems.findOne({ attributes: ["_invoice_id_fk"], where: { __invoice_item_id_pk: req.params.invoice_item_id } })
                if (invoice_item) {
                    await InvoiceItems.destroy({ where: { __invoice_item_id_pk: req.params.invoice_item_id } });
                    if (invoice_item._invoice_id_fk) {
                        invoice_calculated_data = await handy.calculate_invoice_update(invoice_item._invoice_id_fk, user, true);
                    }
                    res.status(200).send({ status: true, invoice_calculated_data, message: translate('Validation.record_deleted', user.lang) });
                } else {
                    res.status(404).send({ status: false, message: translate('Validation.record_not_exist', user.lang) });
                }
            } else {
                res.status(501).send({ status: false, message: translate('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @summary This function is used for get invoice data by client id or rental id or invoice id
     * @param {Rental id} rental_id 
     * @param {Invoice id} invoice_id 
     * @param {Client id} client_id 
     * @returns Status and List of invoice data
     */
    // async function getInvoice(rental_id = 0,invoice_id = 0, client_id = 0,user){
    //     var where_con = {};
    //     if(rental_id){
    //         where_con = {_rental_id_fk:rental_id};
    //     }else if(invoice_id){
    //         where_con = {__invoice_id_pk:invoice_id};
    //     }else if(client_id){
    //         where_con = {_client_id_fk:client_id};
    //     }else{
    //         return {status:false,data:[]}
    //     }
    //     let attributes = ["_tax_rate_id_fk","__invoice_id_pk","_company_id_fk","_task_id_fk","_invoice_quickbook_id_fk","_invoice_xero_id_fk","_client_id_fk","_inventory_id_fk","_rental_id_fk","_staff_id_fk","age_of_invoice_stored","amount_tendered","amount_due_xero","amount_paid_xero","bond","collection_charge","comments","credit_card_rate","currency_code_xero","currency_rate_xero","date","date_closed","date_end","date_payment","date_reminder_sent","date_start","date_month","date_year","delivery_charge","delivery_charge_tax","delivery_method","delivery_notes","discount_cash","discount_selector","disp_amount_paid","disp_balance","disp_company","disp_total","due_date","invoice_no","invoice_json","invoice_number_xero","invoice_type_xero","invoice_url","invoice_type","is_created_from_xero","is_updated","is_updated_q","is_xero_id_manual","key_payment_repetition","key__pos","key_pos","key_product_list","line_amount_types_xero","line_items_json","meterage_charge","method","month","month_name","payment_amount","payment_method","payments","process_invoice","quickbook_created_by","quickbook_created_date","quickbook_currency_code","quickbook_currency_rate","quickbook_modified_by","quickbook_modified_date","quickbook_push_status","quickbook_sync_token","reference_xero","selected_company_no","sent_on","staff_member","sub_total_xero","summary","surcharge","status","tax_name","tax_rate","tax_rate_label","tax_rate_label_2","temp_id_payment","temp_applied","temp_applied_last","terms","total_all_sql","total_tax_xero","total","type","xero_created_by","zz_constant_zero","xero_created_date","xero_modified_by","xero_modified_date","xero_push_status","xero_status","year"]
    //     attributes = handy.setDateFormat(attributes, ["date"], user.date_format);
    //     var invoice_data = await Invoice.findAll({ raw: true, attributes, where:where_con});
    //     invoice_data = handy.transformnames('LTR',invoice_data,"Invoice");
    //     for(let key = 0; key <invoice_data.length; key++){
    //         const incoice_id = invoice_data[key].invoice_id;
    //         var invoice_item_data = await InvoiceItems.findAll({raw: true,where:{_invoice_id_fk:incoice_id}});
    //         invoice_item_data = handy.transformnames('LTR',invoice_item_data,"InvoiceItems");
    //         invoice_data[key].invoice_items = invoice_item_data;
    //     }
    //     return {status:true,data:invoice_data};
    // }

    /**
    * @author Kirankumar
    * @summary This Rout is usefull to update the Invoice
    * @requires Status and Updated data
    */
    // fastify.put('/invoice/update/:invoice_id', async(req,res)=>{
    //     try{
    //          var user = await handy.verfiytoken(req,res);
    //          if(!user)return;

    //         //const responds = await getInvoice(req.params.invoice_id);
    //         var data = req.body;
    //         var invoice_items = [];
    //         var discount = subtotal = tax = summary = 0;
    //         var {tax_rate, credit_card_rate, discount_cash, surcharge, bond,date_start,date_end,delivery_charge,meterage_charge,collection_charge} = data;
    //         var  items_discount_amount= items_amount = 0;
    //         if(data.invoice_items){
    //             invoice_items = data.invoice_items;
    //             delete data.invoice_items;

    //             for(var i = 0; i<invoice_items.length;i++){
    //                 var item = invoice_items[i];
    //                 var  discount_amount= 0;
    //                 var {qty,units,unit_price,taxable,discount_rate,metres} = item;
    //                 if(units > 0){
    //                     discount_amount = (qty*unit_price*units)*(discount_rate/100);
    //                 }else{
    //                     discount_amount = (qty*unit_price)*(discount_rate/100);
    //                 }
    //                 if(meterage_charge == 1 && !metres && units <= 0){
    //                     items_amount += (unit_price*qty) - discount_amount;
    //                 }else if(meterage_charge == 1 && !metres && units >= 1){
    //                     items_amount += (unit_price*qty*units) - discount_amount;
    //                 }else if(meterage_charge == 1 && metres && units >= 1){
    //                     items_amount += (unit_price*metres*qty*units) - discount_amount;
    //                 }else if(meterage_charge == 1 && metres && units <= 0){
    //                     items_amount += (unit_price*metres*qty) - discount_amount;
    //                 }else if(units > 0){
    //                     items_amount += (unit_price*qty*units) - discount_amount;
    //                 }else if(units < 0){
    //                     items_amount += (unit_price*qty) - discount_amount;
    //                 }

    //                 items_discount_amount += discount_amount;
    //                 item = handy.transformnames('RTL',item,"InvoiceItems");
    //                 if(item.__invoice_item_id_pk){
    //                     await InvoiceItems.update(item,{where:{__invoice_item_id_pk : item.__invoice_item_id_pk}});
    //                 }else{
    //                     item._inventory_id_fk = req.params.invoice_id;
    //                     await InvoiceItems.create(item);
    //                 }
    //             }
    //         } 

    //         discount = items_discount_amount + discount_cash;

    //         if(!delivery_charge){
    //             subtotal = Math.round((items_amount + bond + delivery_charge+collection_charge + surcharge - discount_cash)/0.05)*0.05;
    //         }

    //         if(credit_card_rate){
    //             credit_card_charge = Math.round(((subtotal - bond)*credit_card_rate)/0.05)*0.05;
    //         }else{
    //             credit_card_charge = 0;
    //         }

    //         if(tax_rate){
    //             tax = (((taxable_amount+credit_card_charge+delivery_charge+collection_charge-discount)*tax_rate)/0.05)*0.05
    //         }
    //         if(!data.summary)
    //         data.summary = "Rental Period:"+date_start + " - " + date_end;
    //         data.total = subtotal + tax + credit_card_charge;
    //         data = handy.transformnames('RTL',data,"Invoice");
    //         data.updated_by = user.user_id;
    //         await Invoice.update(data,{where:{__invoice_id_pk : req.params.invoice_id}});
    //         const responds = await getInvoice(0, req.params.invoice_id);
    //         res.status(200).send(responds);
    //     }catch(e){
    //         res.status(501).send({status:false, message: translate('Validation.Exception', user.lang )});
    //     }
    // })

}

module.exports = InvoiceRouter;
