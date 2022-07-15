const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const InventoryOrder = sequelize.define('inventory_order', {
    // Model attributes are defined here
    __inventory_order_id_pk : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _inventory_id_fk: {
        type: DataTypes.INTEGER,
        validate: {
            isInt: true,
        }
    },
    _supplier_id_fk: {
        type: DataTypes.INTEGER,
        validate: {
            isInt: true,
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        validate: {
            isDate: true,
        }
    },
    supplier_invoice_no: {
        type: DataTypes.INTEGER,
        validate: {
            isDecimal: true,
        }
    },
    qty: {
        type: DataTypes.INTEGER,
        validate: {
            isDecimal: true,
        }
    },
    cost_per_item: {
        type: DataTypes.DOUBLE,
        validate: {
            isDecimal: true,
        }
    },
    amount: {
        type: DataTypes.DOUBLE,
        validate: {
            isDecimal: true,
        }
    },
    comments: {
        type: DataTypes.STRING,
    }
}, {
    tableName: 'inventory_order',
    timestamps: false
});

module.exports = InventoryOrder;