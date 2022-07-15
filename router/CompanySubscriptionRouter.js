const Sequelize = require("../config/database");
const { Auth, ConfigCalendarStatus, Administration, MasterCompany, CompanySubscription, ConfigBusiness, Rate, ConfigRentalStatus, Terms, AccountypeModel, MessagesCanned, CreditCardRate, TaxRate, ConfigCalendar, JobStatus } = require("../models/Model")(
    ["Auth", "ConfigCalendarStatus", "Administration", "MasterCompany", "CompanySubscription", "ConfigBusiness", "Rate", "ConfigRentalStatus", "Terms", "AccountypeModel", "MessagesCanned", "CreditCardRate", "TaxRate", "ConfigCalendar", "JobStatus"]
);
const handy = require("../config/handy");
var commonchange = require("../config/common");
var translate = require('../language/translate').validationMsg;
var md5 = require('md5');

async function CompanySubscriptionRouter(fastify, opts) {
    fastify.post('/company/create', async (req, res) => {
        try {
            if (req.body.company && req.body.user_email) {
                var checkEmail = await Auth.findAll({ attributes: ['email'], where: { email: req.body.user_email, is_deleted: 0 } });
                if (checkEmail.length > 0) {
                    res.status(400).send({ status: false, message: translate('Validation.user_email_exist') })
                }
                else {
                    var createCompData = {
                        address_full: "{address1}, {city}-{state}, {country}",
                        first_name: "",
                        last_name: "",
                        title: "",
                        company: "",
                        gst_number: "",
                        config_smtp_host: "smtp.gmail.com",
                        config_smtp_username: "test123.kiran123@gmail.com",
                        config_smtp_password: "kiran.k11",
                        config_smtp_secure: "tsl",
                        config_smtp_port: "587",
                        config_smtp_from_email: "test123.kiran123@gmail.com",
                        config_smtp_from_username: "Tigeen",
                        config_smtp_replay_to_mail: "",
                        trading_number: "",
                        billing_address_1: "",
                        billing_address_2: "",
                        billing_zip_code: "50001",
                        billing_city: "Hydrabad",
                        billing_state: "Telangana",
                        billing_country: "India",
                        trading_address_1: "",
                        trading_address_2: "",
                        trading_zip_code: "",
                        trading_city: "Hydrabad",
                        trading_state: "Telangana",
                        trading_country: "India",
                        no_of_users: 100,
                        is_active: 1,
                        created_at: new Date()
                    }


                    var create_company = await MasterCompany.create(createCompData);
                    if (create_company) {
                        const get_companyId = create_company.get("__company_id_pk");
                        var compSub_tempData = {
                            _company_id_fk: get_companyId,
                            config_date_format: "DD-MM-YY",
                            config_db_date_format: "%d.%m.%Y",
                            config_db_invoice_summary_date_format: "ddd DD MMM YYYY",
                            no_of_users: 50,
                            file_max_size: 7000,
                            active: 1,
                            subscription_date: new Date(),
                            created_at: new Date()
                        }
                        var create_company_sub_data = await CompanySubscription.create(compSub_tempData); //company_subscription create

                        const smtp = {
                            _company_id_fk: get_companyId,
                            config_smtp_host: "smtp.gmail.com",
                            config_smtp_username: "test123.kiran123@gmail.com",
                            config_smtp_password: "kiran.k11",
                            config_smtp_secure: "tsl",
                            config_smtp_port: "587",
                            config_smtp_from_email: "test123.kiran123@gmail.com",
                            config_smtp_from_username: "Tigeen",
                        }
                        const create_smtp = Administration.create(smtp);
                        const staff_password = Math.random().toString(36).substr(2, 8);
                        var staffData = {
                            _company_id_fk: get_companyId,
                            access_rights: "",
                            address: "",
                            city: "",
                            comments: "",
                            country: "india",
                            date_end: "2022-11-24",
                            date_started: new Date().toISOString().split('T')[0],
                            display_staff_name: "Test user",
                            email: req.body.user_email,
                            first: "Tigeen",
                            initial: "",
                            job_title: "Program Manager",
                            last: "",
                            login_created: "",
                            login_created_date: "",
                            login_created_staff: "",
                            mobile_phone: "",
                            password: staff_password,
                            phone: "",
                            photo: "",
                            pin: "",
                            postal_code: "",
                            privilege_set: "",
                            rate: "",
                            resource: "",
                            state: "",
                            status: "",
                            tax_number: "",
                            time_employed: "",
                            username: "Tigeen solutions",
                            website: "https://tigeensolutions.com/",
                            created_at: new Date()
                        }

                        var creatStaffRecord = await Auth.create(staffData); // staff create
                        const password = staffData.password;

                        var business_data = {
                            _company_id_fk: get_companyId,
                            company: "cloudrent PTY LTD",
                            trading_as: "",
                            company_no: "ABN 1234 1234 123",
                            office_phone: "12 1212 1212",
                            after_hours: "",
                            office_email: "sales@cloudrent.me",
                            website: "www.cloudrent.me",
                            address: "45 hayle st",
                            city: "Burleigh Heads",
                            state: "QLD",
                            zip: "4200",
                            country: "AU",
                            country_code: "+61",
                            warehouse_address: "",
                            warehouse_city: "",
                            warehouse_state: "",
                            warehouse_zip: "",
                            created_at: new Date()
                        }
                        var creatBusinessRecord = await ConfigBusiness.create(business_data);

                        var RateConfig_data = [
                            { 'compeny_id': get_companyId, 'label': 'Hourly', 'label_name': 'HRS', 'in_hours': '1', 'in_days': '0.0417', 'price': '1.00', 'is_hourly': '1', 'is_half_day': '0', 'is_daily': '0', 'is_weekly': '0', 'is_monthly': '0', 'is_quarterly': '0', 'is_half_yearly': '0', 'is_yearly': '0', 'created_by': '1', 'updated_by': '1', 'created_at': new Date() },
                            { 'compeny_id': get_companyId, 'label': 'Half Day', 'label_name': 'HDAYS', 'in_hours': '12', 'in_days': '0.5', 'price': '2.00', 'is_hourly': '0', 'is_half_day': '1', 'is_daily': '0', 'is_weekly': '0', 'is_monthly': '0', 'is_quarterly': '0', 'is_half_yearly': '0', 'is_yearly': '0', 'created_by': '1', 'updated_by': '1', 'created_at': new Date() },
                            { 'compeny_id': get_companyId, 'label': 'Daily', 'label_name': 'DAYS', 'in_hours': '24', 'in_days': '1', 'price': '4.00', 'is_hourly': '0', 'is_half_day': '0', 'is_daily': '1', 'is_weekly': '0', 'is_monthly': '0', 'is_quarterly': '0', 'is_half_yearly': '0', 'is_yearly': '0', 'created_by': '1', 'updated_by': '1', 'created_at': new Date() },
                            { 'compeny_id': get_companyId, 'label': 'Weekly', 'label_name': 'WKS', 'in_hours': '168', 'in_days': '7', 'price': '24.00', 'is_hourly': '0', 'is_half_day': '0', 'is_daily': '0', 'is_weekly': '1', 'is_monthly': '0', 'is_quarterly': '0', 'is_half_yearly': '0', 'is_yearly': '0', 'created_by': '1', 'updated_by': '1', 'created_at': new Date() },
                            { 'compeny_id': get_companyId, 'label': 'Monthly', 'label_name': 'MTHS', 'in_hours': '720', 'in_days': '30', 'price': '120.00', 'is_hourly': '0', 'is_half_day': '0', 'is_daily': '0', 'is_weekly': '0', 'is_monthly': '1', 'is_quarterly': '0', 'is_half_yearly': '0', 'is_yearly': '0', 'created_by': '1', 'updated_by': '1', 'created_at': new Date() },
                            { 'compeny_id': get_companyId, 'label': 'Quarterly', 'label_name': 'QTRS', 'in_hours': '2160', 'in_days': '90', 'price': '480.00', 'is_hourly': '0', 'is_half_day': '0', 'is_daily': '0', 'is_weekly': '0', 'is_monthly': '0', 'is_quarterly': '1', 'is_half_yearly': '0', 'is_yearly': '0', 'created_by': '1', 'updated_by': '1', 'created_at': new Date() },
                            { 'compeny_id': get_companyId, 'label': 'Half Yearly', 'label_name': 'HYS', 'in_hours': '4320', 'in_days': '180', 'price': '720.00', 'is_hourly': '0', 'is_half_day': '0', 'is_daily': '0', 'is_weekly': '0', 'is_monthly': '0', 'is_quarterly': '0', 'is_half_yearly': '1', 'is_yearly': '0', 'created_by': '1', 'updated_by': '1', 'created_at': new Date() },
                            { 'compeny_id': get_companyId, 'label': 'Yearly', 'label_name': 'YRS', 'in_hours': '8760', 'in_days': '365', 'price': '1440.00', 'is_hourly': '0', 'is_half_day': '0', 'is_daily': '0', 'is_weekly': '0', 'is_monthly': '0', 'is_quarterly': '0', 'is_half_yearly': '0', 'is_yearly': '1', 'created_by': '1', 'updated_by': '1', 'created_at': new Date() }
                        ]
                        var creatRate_record = await Rate.bulkCreate(RateConfig_data);


                        const config_calendar_status_data = [
                            { '_company_id_fk': get_companyId, "name": "ACCOUNT", "color_rgb_value": "rgba(236,186,254,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "PAID NOT DELIVERED", "color_rgb_value": "rgba(230,148,21,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "ACTIVE JOB PAID", "color_rgb_value": "rgba(108,166,61,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "REFUND", "color_rgb_value": "rgba(98,147,254,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "UNPAID DELIVERED", "color_rgb_value": "rgba(71,204,252,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "OUTSTANDING ITEMS", "color_rgb_value": "rgba(130,8,0,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "RESERVED UNPAID", "color_rgb_value": "rgba(164,8,0,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "QUOTE", "color_rgb_value": "rgba(252,189,0,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "COMPLETED", "color_rgb_value": "rgba(98,147,254,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "VOID", "color_rgb_value": "rgba(205,205,205,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "IN PROGRESS", "color_rgb_value": "rgba(230,148,21,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "PENDING", "color_rgb_value": "RGBA(164,8,0,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "FINISHED", "color_rgb_value": "rgba(108,166,61,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "OUT", "color_rgb_value": "rgba(230,148,21,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "IN", "color_rgb_value": "rgba(108,166,61,0.85)", 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, "name": "EXISTING JOB", "color_rgb_value": "rgba(108,166,61,0.85)", 'created_at': new Date() },
                        ]
                        await ConfigCalendarStatus.bulkCreate(config_calendar_status_data);
                        var stausConfig_data = [
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(236,186,254,0.85)', 'status_label': 'Account', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(108,166,61,0.85)', 'status_label': 'Active Job Paid', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(230,148,21,0.85)', 'status_label': 'C.O.D', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(98,147,254,0.85)', 'status_label': 'Completed', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(108,166,61,0.85)', 'status_label': 'Includes Trailer', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(130,8,0,0.85)', 'status_label': 'Outstanding Items', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(252,189,0,0.85)', 'status_label': 'Quote', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(252,0,0,0.85)', 'status_label': 'Refund', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(164,8,0,0.85)', 'status_label': 'Reserved Unpaid', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(98,147,254,0.85)', 'status_label': 'Sydney', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(71,204,252,0.85)', 'status_label': 'Unpaid Delivered', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(205,205,205,0.85)', 'status_label': 'Void', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(230,148,21,0.85)', 'status_label': 'In Progress', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(164,8,0,0.85)', 'status_label': 'Pending', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(108,166,61,0.85)', 'status_label': 'Finished', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(230,148,21,0.85)', 'status_label': 'Out', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'color_code': 'RGBA(108,166,61,0.85)', 'status_label': 'In', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() }
                        ]
                        var creatStatus_record = await ConfigRentalStatus.bulkCreate(stausConfig_data);

                        var createTerm_record = [
                            { '_company_id_fk': get_companyId, 'term_label': 'Due On Date Specified', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'term_label': 'Due On Receipt', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'term_label': 'Net 7', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'term_label': 'Net 15', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'term_label': 'Net 30', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'term_label': 'Net 45', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'term_label': 'Net 60', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'term_label': 'Net 90', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'term_label': 'Eom 20', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'term_label': 'Eom 30', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() }
                        ]
                        var creatTerm_record = await Terms.bulkCreate(createTerm_record);

                        var account_type_record = [
                            { '_company_id_fk': get_companyId, 'is_active': '1', 'name': 'Venue', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'is_active': '1', 'name': 'Contractor', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'is_active': '1', 'name': 'Company', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'is_active': '1', 'name': 'Individual', 'created_at': new Date() }
                        ]
                        var creatAccount_record = await AccountypeModel.bulkCreate(account_type_record);

                        var message_data = [
                            { '_company_id_fk': get_companyId, 'template_name': "Cloud Rent", 'template_body': "<div><span ><span >Dear <<Clients::First>>,</span></span></div><div><span ><span >This is from cloud rent. we are happy you being a member in cloud rent. If you get any difficulty please contact the support.</span></span></div><div><span ><span >Thanks regards,</span></span></div><div><span ><span >Cloud Rent</span></span></div>", 'type': "email" },
                            { '_company_id_fk': get_companyId, 'template_name': "Cloud Rent", 'template_body': "Welcome to cloud rent.", 'type': "sms" }
                        ]
                        var creatMessage_record = await MessagesCanned.bulkCreate(message_data);

                        var credit_data = [
                            { '_company_id_fk': get_companyId, 'card_name': 'VISA', 'card_percentage': '0.0125', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'card_name': 'AMEX', 'card_percentage': '0.0400', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'card_name': 'MASTERCARD', 'card_percentage': '0.0175', 'created_by': '1', 'updated_by': 'NULL', 'created_at': new Date() }
                        ]
                        var creatCredit_record = await CreditCardRate.bulkCreate(credit_data);

                        var tax_data = [
                            { '_company_id_fk': get_companyId, 'default_n': 'NULL', 'percentage': '0.10', 'tax_code': 'GST', 'tax_name': 'GOODS AND SERVICES', 'updated_by': 'NULL', 'created_at': new Date() },
                            { '_company_id_fk': get_companyId, 'default_n': 'NULL', 'percentage': '0.00', 'tax_code': 'FRE', 'tax_name': 'TAX FREE', 'updated_by': 'NULL', 'created_at': new Date() }
                        ]
                        var creatTax_record = await TaxRate.bulkCreate(tax_data);
                        //Calendar
                        var config_calendar_settings = {
                            "_company_id_fk": get_companyId,
                            "created_by": get_companyId,
                            "created_at": new Date(),
                            "default_time": "15:00:00",
                            "earliest_time": "15:00:00",
                            "latest_time": "15:00:00",
                            "time_scale": 5,
                            "is_show_weekends": 1,
                            "is_long_term_rentals": 1,
                            "is_compressed_view": 0,
                            "is_fluid_months": 1,
                            "is_show_distance": 0,
                            "breakout_by": "nothing"
                        }
                        var insert_calendar_config = await ConfigCalendar.create(config_calendar_settings);
                        //create Default Job status records for company 
                        let job_status_data = [
                            { _company_id_fk: get_companyId, color: 'rgb(105, 167, 58)', job_status: 'MONEY OWING', created_at: new Date() },
                            { _company_id_fk: get_companyId, color: 'rgb(135, 6, 0)', job_status: 'OUTSTANDING ITEMS', created_at: new Date() },
                            { _company_id_fk: get_companyId, color: 'rgb(228, 146, 25)', job_status: 'PAID NOT DELIVERED', created_at: new Date() },
                            { _company_id_fk: get_companyId, color: 'rgb(91, 146, 254)', job_status: 'REFUND', created_at: new Date() },
                            { _company_id_fk: get_companyId, color: 'rgb(233, 6, 0)', job_status: 'SITE VISIT', created_at: new Date() },
                            { _company_id_fk: get_companyId, color: 'rgb(71, 203, 254)', job_status: 'UNPAID DELIVERED', created_at: new Date() },
                        ]

                        await JobStatus.bulkCreate(job_status_data);
                        res.status(200).send({ status: true, message: translate('Validation.company_create'), data: [{ user_name: req.body.user_email, password: staff_password }] })
                    }
                    else {
                        res.status(500).send({ status: false, message: translate('Validation.company_not_create') })
                    }
                }
            }
            else {
                res.status(500).send({ status: false, message: translate('Validation.invalid_data') })
            }
        }
        catch (e) {
            res.status(404).send({ status: false, message: translate('Validation.Exception') });
        }
    })
}
module.exports = CompanySubscriptionRouter;