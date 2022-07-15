const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const AccountType = sequelize.define('account_type', {
    __account_type_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    is_active: {
        type: DataTypes.TINYINT
    },
    name: {
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
    updated_at:{
        type: DataTypes.DATE
    }
},
    {
        tableName: 'account_type',
        timestamps: false
    });
module.exports = AccountType;