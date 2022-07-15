const sequelize = require("../config/database");
const { DataTypes } = require('sequelize');

const Payment = sequelize.define('payment', {
    // Model attributes are defined here
    __payment_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        get() {
            const rawValue = this.getDataValue("__payment_id_pk");
            return rawValue ? rawValue.toString().padStart(6, '0') : '';
        }
    },
    _payment_quickbook_id_fk: {
        type: DataTypes.INTEGER
    },
    _payment_xero_id_fk: {
        type: DataTypes.INTEGER
    },
    _quickbook_deposit_to_accid_fk: {
        type: DataTypes.INTEGER
    },
    _account_xero_id_fk: {
        type: DataTypes.INTEGER
    },
    _client_id_fk: {
        type: DataTypes.INTEGER
    },
    _invoice_id_fk: {
        type: DataTypes.INTEGER
    },
    _payment_id_fk: {
        type: DataTypes.INTEGER
    },
    _rental_id_fk: {
        type: DataTypes.INTEGER
    },
    amount_to_apply: {
        type: DataTypes.DOUBLE
    },
    bank_amount_xero: {
        type: DataTypes.DOUBLE
    },
    bond_amount: {
        type: DataTypes.DOUBLE
    },
    bond_payment_method: {
        type: DataTypes.STRING
    },
    comments: {
        type: DataTypes.STRING
    },
    creation_host_timestamp: {
        type: DataTypes.DATE
    },
    currency_rate_xero: {
        type: DataTypes.DOUBLE
    },
    invoice_payment: {
        type: DataTypes.DOUBLE
    },
    is_reconciled_xero: {
        type: DataTypes.TINYINT
    },
    is_updated: {
        type: DataTypes.TINYINT
    },
    is_updated_q: {
        type: DataTypes.TINYINT
    },
    key_multiple: {
        type: DataTypes.INTEGER
    },
    month: {
        type: DataTypes.INTEGER
    },
    month_name: {
        type: DataTypes.STRING
    },
    payment_amount: {
        type: DataTypes.DOUBLE
    },
    payment_amount_due: {
        type: DataTypes.DOUBLE
    },
    payment_amount_x_tax: {
        type: DataTypes.DOUBLE
    },
    payment_date: {
        type: DataTypes.DATEONLY
    },
    payment_method: {
        type: DataTypes.STRING
    },
    payment_number: {
        type: DataTypes.STRING
    },
    payment_total: {
        type: DataTypes.DOUBLE
    },
    payment_type: {
        type: DataTypes.STRING
    },
    quickbook_created_by: {
        type: DataTypes.STRING
    },
    quickbook_created_date: {
        type: DataTypes.DATE
    },
    quickbook_currency: {
        type: DataTypes.STRING
    },
    quickbook_currency_rate: {
        type: DataTypes.DOUBLE
    },
    quickbook_modified_by: {
        type: DataTypes.STRING
    },
    quickbook_modified_date: {
        type: DataTypes.DATE
    },
    quickbook_payment_reference: {
        type: DataTypes.STRING
    },
    quickbook_push_status: {
        type: DataTypes.STRING
    },
    quickbook_sync_token: {
        type: DataTypes.STRING
    },
    reference_xero: {
        type: DataTypes.STRING
    },
    tax_amount: {
        type: DataTypes.DOUBLE
    },
    tax_label: {
        type: DataTypes.STRING
    },
    tax_rate: {
        type: DataTypes.DOUBLE
    },
    week: {
        type: DataTypes.INTEGER
    },
    xero_account_code: {
        type: DataTypes.INTEGER
    },
    xero_created_by: {
        type: DataTypes.STRING
    },
    xero_created_date: {
        type: DataTypes.DATE
    },
    xero_pull_status: {
        type: DataTypes.STRING
    },
    xero_push_status: {
        type: DataTypes.STRING
    },
    xero_status: {
        type: DataTypes.STRING
    },
    year: {
        type: DataTypes.INTEGER
    },
    created_by: {
        type: DataTypes.STRING
    },
    updated_by: {
        type: DataTypes.STRING
    },
    created_at: {
        type: DataTypes.DATE
    },
    updated_at: {
        type: DataTypes.DATE
    }
},
    {
        tableName: 'payment',
        timestamps: false
    });

module.exports = Payment;