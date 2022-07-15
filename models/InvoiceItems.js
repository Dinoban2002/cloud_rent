const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const InvoiceItem = sequelize.define('invoice_item', {
    __invoice_item_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _invoice_item_quickbook_id_fk: {
        type: DataTypes.INTEGER,
    },
    _invoice_item_xero_id_fk: {
        type: DataTypes.INTEGER,
    },
    _client_id_fk: {
        type: DataTypes.INTEGER,
    },
    _inventory_component_quickbook_id_fk: {
        type: DataTypes.INTEGER,
    },
    _inventory_id_fk: {
        type: DataTypes.INTEGER,
    },
    _invoice_id_fk: {
        type: DataTypes.INTEGER,
    },
    _invoice_xero_id_fk: {
        type: DataTypes.INTEGER,
    },
    _rental_id_fk: {
        type: DataTypes.INTEGER,
    },
    account_code_xero: {
        type: DataTypes.INTEGER,
    },
    address: {
        type: DataTypes.STRING,
    },
    amount: {
        type: DataTypes.DOUBLE,
    },
    city: {
        type: DataTypes.STRING,
    },
    date: {
        type: DataTypes.DATEONLY,
    },
    description_xero: {
        type: DataTypes.TEXT,
    },
    discount_rate: {
        type: DataTypes.DOUBLE,
    },
    get_qty_as_text: {
        type: DataTypes.STRING,
    },
    invoice_run: {
        type: DataTypes.STRING,
    },
    item: {
        type: DataTypes.STRING,
    },
    metres: {
        type: DataTypes.INTEGER,
    },
    month: {
        type: DataTypes.INTEGER,
    },
    pos: {
        type: DataTypes.TINYINT,
    },
    qty: {
        type: DataTypes.INTEGER,
    },
    quickbook_tax_type: {
        type: DataTypes.STRING,
    },
    sku: {
        type: DataTypes.STRING,
    },
    sort_index: {
        type: DataTypes.INTEGER,
    },
    state: {
        type: DataTypes.STRING,
    },
    tax_name: {
        type: DataTypes.STRING,
    },
    tax_amount_xero: {
        type: DataTypes.DOUBLE,
    },
    tax_type_xero: {
        type: DataTypes.STRING,
    },
    taxable: {
        type: DataTypes.TINYINT,
    },
    type: {
        type: DataTypes.STRING,
    },
    unit_price: {
        type: DataTypes.DOUBLE,
    },
    units: {
        type: DataTypes.DOUBLE,
    },
    year: {
        type: DataTypes.INTEGER,
    },
    zip: {
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
    }
}, {
    tableName: 'invoice_item',
    timestamps: false
});

module.exports = InvoiceItem;