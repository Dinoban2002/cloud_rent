const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Return = sequelize.define('return', {
    __return_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _rental_id_fk: {
        type: DataTypes.INTEGER
    },
    balance: {
        type: DataTypes.INTEGER
    },
    billed: {
        type: DataTypes.TINYINT,
    },
    billing_cycle: {
        type: DataTypes.STRING,
    },
    billing_date_end: {
        type: DataTypes.DATE,
    },
    billing_date_start: {
        type: DataTypes.DATE,
    },
    comments: {
        type: DataTypes.STRING,
    },
    creation_date: {
        type: DataTypes.DATE,
    },
    creation_time: {
        type: DataTypes.TIME,
    },
    days: {
        type: DataTypes.INTEGER,
    },
    id_customer: {
        type: DataTypes.STRING,
    },
    id_invoice: {
        type: DataTypes.STRING,
    },
    id_lineitem: {
        type: DataTypes.STRING,
    },
    id_parent: {
        type: DataTypes.STRING,
    },
    id_product: {
        type: DataTypes.STRING,
    },
    item_name: {
        type: DataTypes.STRING,
    },
    loss: {
        type: DataTypes.INTEGER,
    },
    metres_in: {
        type: DataTypes.INTEGER,
    },
    price: {
        type: DataTypes.DOUBLE,
    },
    pro_rata_percent: {
        type: DataTypes.DOUBLE,
    },
    qty_in: {
        type: DataTypes.INTEGER,
    },
    qty_out: {
        type: DataTypes.INTEGER,
    },
    return_contact: {
        type: DataTypes.STRING,
    },
    return_count: {
        type: DataTypes.INTEGER,
    },
    return_date: {
        type: DataTypes.DATE,
    },
    sku: {
        type: DataTypes.STRING,
    },
    staff_member: {
        type: DataTypes.STRING,
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
}, {
    tableName: 'return',
    timestamps: false
});

module.exports = Return;