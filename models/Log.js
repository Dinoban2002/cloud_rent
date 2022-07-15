const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Apilogs = sequelize.define('api_logs', {
    // Model attributes are defined here
    id : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    uri: {
        type: DataTypes.STRING
    },
    method: {
        type: DataTypes.STRING
    },
    params: {
        type: DataTypes.TEXT
    },
    api_key: {
        type: DataTypes.STRING
    },
    ip_address: {
        type: DataTypes.STRING
    },
    time: {
        type: DataTypes.INTEGER
    },
    rtime: {
        type: DataTypes.FLOAT
    },
    authorized: {
        type: DataTypes.STRING
    },
    response_code: {
        type: DataTypes.SMALLINT
    }}, 
    {
        tableName: 'api_logs',
        timestamps: false
    });

module.exports = Apilogs;