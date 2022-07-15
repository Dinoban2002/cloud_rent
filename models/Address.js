const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Address = sequelize.define('address', {
    // Model attributes are defined here
    __address_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _client_id_fk: {
        type: DataTypes.INTEGER
    },
    _client_contact_id_fk: {
        type: DataTypes.INTEGER
    },
    address1: {
        type: DataTypes.STRING
    },
    city: {
        type: DataTypes.STRING
    },
    state: {
        type: DataTypes.STRING
    },
    country: {
        type: DataTypes.STRING
    },
    zip: {
        type: DataTypes.STRING
    },
    is_default: {
        type: DataTypes.TINYINT
    },
    is_active: {
        type: DataTypes.TINYINT
    },
    is_billing: {
        type: DataTypes.TINYINT
    },
    is_delivery: {
        type: DataTypes.TINYINT
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
    }}, 
    {
        tableName: 'address',
        timestamps: false
    });

module.exports = Address;