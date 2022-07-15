const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const SubRent = sequelize.define('sub_rent', {
    // Model attributes are defined here
    __sub_rent_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _rental_id_fk: {
        type: DataTypes.INTEGER
    },
    _rate_config_id_fk: {
        type: DataTypes.INTEGER
    },
    comments: {
        type: DataTypes.STRING
    },
    cost: {
        type: DataTypes.DOUBLE
    },
    creation_host_timestamp: {
        type: DataTypes.DATE
    },
    id_parent_item: {
        type: DataTypes.INTEGER
    },
    id_invoice: {
        type: DataTypes.STRING
    },
    id_product: {
        type: DataTypes.STRING
    },
    id_supplier: {
        type: DataTypes.STRING
    },
    item: {
        type: DataTypes.STRING
    },
    modification_host_timestamp: {
        type: DataTypes.DATE
    },
    period_no: {
        type: DataTypes.INTEGER,
    },
    qty: {
        type: DataTypes.INTEGER,
    },
    qty_received: {
        type: DataTypes.INTEGER,
    },
    received_date: {
        type: DataTypes.DATE
    },
    send: {
        type: DataTypes.INTEGER,
    },
    sent_date: {
        type: DataTypes.DATE
    },
    sku: {
        type: DataTypes.STRING
    },
    supplier: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.STRING
    },
    total_cost: {
        type: DataTypes.DOUBLE,
    },
    use_date: {
        type: DataTypes.DATE
    },
    use_time: {
        type: DataTypes.TIME
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
    tableName: 'sub_rent',
    timestamps: false
});

module.exports = SubRent;
