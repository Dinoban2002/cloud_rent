const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const InventoryLoss = sequelize.define('inventory_loss', {
    __inventory_loss_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    }, 
    _client_id_fk: {
        type: DataTypes.INTEGER
    },
    _rental_id_fk: {
        type: DataTypes.INTEGER
    },
    _rental_item_id_fk: {
        type: DataTypes.INTEGER
    },
    _inventory_id_fk: {
        type: DataTypes.INTEGER
    },
    contract_no: {
        type: DataTypes.STRING
    },
    cost: {
        type: DataTypes.DOUBLE
    },
    creation_host_timestamp: {
        type: DataTypes.DATE
    },
    item: {
        type: DataTypes.STRING
    },
    modification_host_timestamp: {
        type: DataTypes.DATE
    },
    qty: {
        type: DataTypes.INTEGER
    },
    sku: {
        type: DataTypes.STRING
    },
    staff_member: {
        type: DataTypes.STRING
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
        tableName: 'inventory_loss',
        timestamps: false
    });
module.exports = InventoryLoss;