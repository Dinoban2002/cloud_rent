const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const CreditCardRate = sequelize.define('credit_card_rate', {
    __credit_card_rate_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    card_name: {
        type: DataTypes.STRING
    },
    card_percentage: {
        type: DataTypes.DOUBLE
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
        tableName: 'credit_card_rate',
        timestamps: false
    });
module.exports = CreditCardRate;