const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const ClientPaymentMethod = sequelize.define('client_payment_method', {
    __payment_method_id_pk: {
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
    name: {
        type: DataTypes.STRING
    },
    type: {
        type: DataTypes.STRING
    },
    number: {
        type: DataTypes.STRING
    },
    secret: {
        type: DataTypes.STRING
    },
    expiry_month: {
        type: DataTypes.STRING
    },
    expiry_year: {
        type: DataTypes.STRING
    },
    is_active: {
        type: DataTypes.TINYINT
    },
    created_at: {
        type: DataTypes.DATE
    },
    created_by: {
        type: DataTypes.STRING
    },
    updated_at: {
        type: DataTypes.DATE
    },
    updated_by: {
        type: DataTypes.STRING
    }
},
    {
        tableName: 'client_payment_method',
        timestamps: false
    });
module.exports = ClientPaymentMethod;