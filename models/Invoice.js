const sequelize = require("../config/database");

const { Sequelize, DataTypes } = require('sequelize');
//const sequelize = new Sequelize('sqlite::memory:');

const invoice = sequelize.define('invoice', {
    // Model attributes are defined here
    __invoice_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _company_id_fk: {
        type: DataTypes.INTEGER,
    },
    _invoice_quickbook_id_fk: {
        type: DataTypes.INTEGER,
    },
    _invoice_xero_id_fk: {
        type: DataTypes.INTEGER,
    },
    _client_id_fk: {
        type: DataTypes.INTEGER,
    },
    _inventory_id_fk: {
        type: DataTypes.INTEGER,
    },
    _rental_id_fk: {
        type: DataTypes.INTEGER,
    },
    _staff_id_fk: {
        type: DataTypes.INTEGER,
    },
    _task_id_fk: {
        type: DataTypes.INTEGER,
    },
    _tax_rate_id_fk: {
        type: DataTypes.INTEGER,
    },
    _credit_card_rate_id_fk: {
        type: DataTypes.INTEGER,
    },
    age_of_invoice_stored: {
        type: DataTypes.INTEGER,
    },
    amount_tendered: {
        type: DataTypes.INTEGER,
    },
    amount_due_xero: {
        type: DataTypes.INTEGER,
    },
    amount_paid: {
        type: DataTypes.DOUBLE,
    },
    amount_paid_xero: {
        type: DataTypes.DOUBLE,
    },
    balance: {
        type: DataTypes.DOUBLE,
    },
    bond: {
        type: DataTypes.INTEGER,
    },
    collection_charge: {
        type: DataTypes.INTEGER,
    },
    comments: {
        type: DataTypes.STRING,
    },
    credit_card_charge: {
        type: DataTypes.DOUBLE,
    },
    credit_note_invoice_id: {
        type: DataTypes.INTEGER,
    },
    credit_card_rate: {
        type: DataTypes.DOUBLE,
    },
    creation_timestamp: {
        type: DataTypes.DATE,
    },
    currency_code_xero: {
        type: DataTypes.STRING,
    },
    currency_rate_xero: {
        type: DataTypes.DOUBLE,
    },
    date: {
        type: DataTypes.DATEONLY,
        get() {
            return this.getDataValue("date") ? this.getDataValue("date") : "";
        }
    },
    date_closed: {
        type: DataTypes.DATEONLY,
    },
    date_end: {
        type: DataTypes.DATEONLY,
        get() {
            return this.getDataValue("date_end") ? this.getDataValue("date_end") : "";
        }
    },
    date_payment: {
        type: DataTypes.DATEONLY,
    },
    date_reminder_sent: {
        type: DataTypes.DATEONLY,
    },
    date_start: {
        type: DataTypes.DATEONLY,
        get() {
            return this.getDataValue("date_start") ? this.getDataValue("date_start") : "";
        }
    },
    date_month: {
        type: DataTypes.INTEGER,
    },
    date_year: {
        type: DataTypes.INTEGER
    },
    delivery_charge: {
        type: DataTypes.DOUBLE,
    },
    delivery_charge_tax: {
        type: DataTypes.DOUBLE,
    },
    delivery_method: {
        type: DataTypes.STRING,
    },
    delivery_notes: {
        type: DataTypes.STRING,
    },
    discount_cash: {
        type: DataTypes.DOUBLE,
    },
    discount_selector: {
        type: DataTypes.INTEGER,
    },
    disp_amount_paid: {
        type: DataTypes.DOUBLE,
    },
    disp_balance: {
        type: DataTypes.DOUBLE,
    },
    disp_company: {
        type: DataTypes.STRING,
    },
    disp_total: {
        type: DataTypes.DOUBLE,
    },
    due_date: {
        type: DataTypes.DATEONLY,
    },
    freight: {
        type: DataTypes.INTEGER,
    },
    invoice_id_no: {
        type: DataTypes.STRING,
    },
    invoice_no: {
        type: DataTypes.INTEGER,
    },
    invoice_json: {
        type: DataTypes.TEXT,
    },
    invoice_number_xero: {
        type: DataTypes.STRING,
    },
    invoice_serial_no: {
        type: DataTypes.INTEGER,
    },
    invoice_type_xero: {
        type: DataTypes.STRING,
    },
    invoice_url: {
        type: DataTypes.STRING,
    },
    invoice_type: {
        type: DataTypes.INTEGER,
    },
    is_created_from_xero: {
        type: DataTypes.TINYINT,
    },
    is_updated: {
        type: DataTypes.TINYINT,
    },
    is_off_hire: {
        type: DataTypes.TINYINT,
    },
    is_updated_q: {
        type: DataTypes.TINYINT,
    },
    is_xero_id_manual: {
        type: DataTypes.TINYINT,
    },
    key_payment_repetition: {
        type: DataTypes.STRING,
    },
    key__pos: {
        type: DataTypes.INTEGER,
    },
    key_pos: {
        type: DataTypes.INTEGER,
    },
    key_product_list: {
        type: DataTypes.STRING,
    },
    line_amount_types_xero: {
        type: DataTypes.STRING,
    },
    line_items_json: {
        type: DataTypes.TEXT,
    },
    meterage_charge: {
        type: DataTypes.TINYINT,
        defaultValue: 0
    },
    method: {
        type: DataTypes.STRING,
    },
    month: {
        type: DataTypes.INTEGER,
    },
    month_name: {
        type: DataTypes.STRING,
    },
    payment_amount: {
        type: DataTypes.DOUBLE,
    },
    payment_method: {
        type: DataTypes.STRING,
    },
    payments: {
        type: DataTypes.INTEGER,
    },
    process_invoice: {
        type: DataTypes.INTEGER,
    },
    quickbook_created_by: {
        type: DataTypes.STRING,
    },
    quickbook_created_date: {
        type: DataTypes.DATE,
    },
    quickbook_currency_code: {
        type: DataTypes.STRING,
    },
    quickbook_currency_rate: {
        type: DataTypes.INTEGER,
    },
    quickbook_modified_by: {
        type: DataTypes.STRING,
    },
    quickbook_modified_date: {
        type: DataTypes.DATE,
    },
    quickbook_push_status: {
        type: DataTypes.STRING,
    },
    quickbook_sync_token: {
        type: DataTypes.INTEGER,
    },
    reference_xero: {
        type: DataTypes.STRING,
    },
    selected_company_no: {
        type: DataTypes.INTEGER,
    },
    sent_on: {
        type: DataTypes.DATE,
    },
    staff_member: {
        type: DataTypes.STRING,
    },
    sub_total_xero: {
        type: DataTypes.INTEGER,
    },
    summary: {
        type: DataTypes.STRING,
    },
    surcharge: {
        type: DataTypes.INTEGER,
    },
    status: {
        type: DataTypes.STRING,
    },
    tax: {
        type: DataTypes.DOUBLE,
    },
    tax_name: {
        type: DataTypes.STRING,
    },
    tax_rate_label: {
        type: DataTypes.STRING,
    },
    tax_rate_label_2: {
        type: DataTypes.STRING,
    },
    temp_id_payment: {
        type: DataTypes.STRING,
    },
    temp_applied: {
        type: DataTypes.INTEGER,
    },
    temp_applied_last: {
        type: DataTypes.INTEGER,
    },
    terms: {
        type: DataTypes.INTEGER,
    },
    total_all_sql: {
        type: DataTypes.DOUBLE,
    },
    total_tax_xero: {
        type: DataTypes.DOUBLE,
    },
    total: {
        type: DataTypes.DOUBLE,
    },
    type: {
        type: DataTypes.STRING,
    },
    xero_created_by: {
        type: DataTypes.STRING,
    },
    xero_created_date: {
        type: DataTypes.DATE,
    },
    xero_modified_by: {
        type: DataTypes.STRING,
    },
    xero_modified_date: {
        type: DataTypes.DATE,
    },
    xero_push_status: {
        type: DataTypes.STRING,
    },
    xero_status: {
        type: DataTypes.STRING,
    },
    year: {
        type: DataTypes.INTEGER,
    },
    zz_constant_zero: {
        type: DataTypes.INTEGER,
    },
    created_by: {
        type: DataTypes.STRING,
    },
    updated_by: {
        type: DataTypes.STRING,
    },
    created_at: {
        type: DataTypes.DATE,
    },
    updated_at: {
        type: DataTypes.NOW,
    },
}, {
    tableName: 'invoice',
    timestamps: false
});

module.exports = invoice;