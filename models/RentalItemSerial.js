const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const RentalItemSerial = sequelize.define('rental_item_serial', {
    __rental_item_serial_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _rental_item_id_fk: {
        type: DataTypes.INTEGER,
    },
    _inventory_id_fk: {
        type: DataTypes.INTEGER,
    },
    _rental_id_fk: {
        type: DataTypes.INTEGER,
    },
    asset_no: {
        type: DataTypes.INTEGER,
    },
    c1_c: {
        type: DataTypes.TINYINT,
    },
    dispatch_date: {
        type: DataTypes.DATEONLY,
    },
    return_date: {
        type: DataTypes.DATEONLY,
    },
    sequence_number: {
        type: DataTypes.INTEGER,
    },
    sku: {
        type: DataTypes.STRING,
    },
    is_added: {
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
    tableName: 'rental_item_serial',
    timestamps: false
});

module.exports = RentalItemSerial;