const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Client = sequelize.define('client', {
    // Model attributes are defined here
    __client_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        get() {
            const rawValue = this.getDataValue("__client_id_pk");
            return rawValue ? rawValue.toString().padStart(6, '0') : '';
        }
    },
    _company_id_fk: {
        type: DataTypes.INTEGER, validate: { isNumeric: true, }
    },
    _config_term_id_fk: {
        type: DataTypes.INTEGER,
    },
    balance: {
        type: DataTypes.DOUBLE,
    },
    email: {
        type: DataTypes.STRING
    },
    telephone: {
        type: DataTypes.STRING
    },
    parent_id: {
        type: DataTypes.INTEGER, validate: { isNumeric: true, }
    },
    account_bsb: {
        type: DataTypes.INTEGER, validate: { isNumeric: true, }
    },
    account_customer: {
        type: DataTypes.STRING
    },
    account_name: {
        type: DataTypes.STRING
    },
    account_number: {
        type: DataTypes.STRING
    },
    account_type: {
        type: DataTypes.STRING
    },
    address_billing: {
        type: DataTypes.STRING
    },
    address_delivery: {
        type: DataTypes.STRING
    },
    biller_code: {
        type: DataTypes.INTEGER, validate: { isNumeric: true, }
    },
    biller_reference_number: {
        type: DataTypes.INTEGER, validate: { isNumeric: true, }
    },
    birth_date: {
        type: DataTypes.DATE
    },
    car_registration_no: {
        type: DataTypes.STRING
    },
    city: {
        type: DataTypes.STRING
    },
    commision: {
        type: DataTypes.DOUBLE, validate: { isDecimal: true, }
    },
    company: {
        type: DataTypes.STRING
    },
    company_discount: {
        type: DataTypes.DOUBLE, validate: { isDecimal: true, }
    },
    company_number: {
        type: DataTypes.STRING
    },
    creation_host_timestamp: {
        type: DataTypes.DATE
    },
    driver_license: {
        type: DataTypes.STRING
    },
    driver_license_expriy: {
        type: DataTypes.STRING
    },
    driver_license_issued: {
        type: DataTypes.STRING
    },
    first_name: {
        type: DataTypes.STRING
    },
    initial: {
        type: DataTypes.STRING
    },
    is_updated: {
        type: DataTypes.TINYINT, validate: { isDecimal: true, }
    },
    job_title: {
        type: DataTypes.STRING
    },
    last: {
        type: DataTypes.STRING
    },
    modification_host_timestamp: {
        type: DataTypes.DATE
    },
    name_full: {
        type: DataTypes.STRING,
        set() {
            const rawValue = (this.getDataValue("first_name") ? this.getDataValue("first_name") : "") + ' ' + (this.getDataValue("last") ? this.getDataValue("last") : "");
            return this.setDataValue('name_full', rawValue);
        }
    },
    notes: {
        type: DataTypes.STRING
    },
    pay_commision: {
        type: DataTypes.STRING
    },
    photo: {
        type: DataTypes.STRING
    },
    referral: {
        type: DataTypes.STRING
    },
    serial_no: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { isNumeric: true, },
        get() {
            const rawValue = this.getDataValue("serial_no");
            return rawValue.toString().padStart(6, '0');
        }
    },
    supplier: {
        type: DataTypes.STRING
    },
    supplier_display: {
        type: DataTypes.STRING
    },
    terms: {
        type: DataTypes.STRING
    },
    total_credit_note: {
        type: DataTypes.DOUBLE
    },
    total_invoice: {
        type: DataTypes.DOUBLE
    },
    total_paid: {
        type: DataTypes.DOUBLE
    },
    website: {
        type: DataTypes.STRING
    },
    insurance_exp_date: {
        type: DataTypes.DATE
    },
    insurance_policy_no: {
        type: DataTypes.STRING
    },
    position: {
        type: DataTypes.STRING
    },
    deleted_date_time: {
        type: DataTypes.DATE
    },
    is_supplier: {
        type: DataTypes.TINYINT, validate: { isDecimal: true, }
    },
    is_pay_comm: {
        type: DataTypes.TINYINT, validate: { isDecimal: true, }
    },
    is_insurance: {
        type: DataTypes.TINYINT, validate: { isDecimal: true, }
    },
    is_send_alert: {
        type: DataTypes.TINYINT, validate: { isDecimal: true, }
    },
    is_deleted: {
        type: DataTypes.TINYINT, validate: { isDecimal: true, }
    },
    is_active: {
        type: DataTypes.TINYINT, validate: { isDecimal: true, }
    },
    Is_integrapay_auto_payment_enabled: {
        type: DataTypes.TINYINT
    },
    delivery_add_id: {
        type: DataTypes.INTEGER
    },
    billing_add_id: {
        type: DataTypes.INTEGER
    },
    updated_at: {
        type: DataTypes.NOW
    },
    created_at: {
        type: DataTypes.DATE
    },
    updated_by: {
        type: DataTypes.STRING
    },
    created_by: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { isNumeric: true, }
    }
},
    {
        tableName: 'client',
        timestamps: false
    });

module.exports = Client;