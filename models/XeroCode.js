const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const XeroCode = sequelize.define('xero_code', {
    __xero_code_id_pk : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name:{
        type: DataTypes.STRING
    },
    xero_id:{
        type: DataTypes.INTEGER
    },
    code: {
        type: DataTypes.INTEGER
    }
},
{
    tableName: 'xero_code',
    timestamps: false
});

module.exports = XeroCode;