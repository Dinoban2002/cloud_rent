const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const ConfigDefaultRate = sequelize.define('config_default_rate', {
    __config_default_rate_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    label: {
        type: DataTypes.STRING
    },
    label_name: {
        type: DataTypes.STRING
    },
    in_hours: {
        type: DataTypes.DOUBLE
    },
    in_days: {
        type: DataTypes.DOUBLE
    },
    price: {
        type: DataTypes.DOUBLE
    },
    is_hourly: {
        type: DataTypes.TINYINT
    },
    is_half_day: {
        type: DataTypes.TINYINT
    },
    is_daily: {
        type: DataTypes.TINYINT
    },
    is_weekly: {
        type: DataTypes.TINYINT
    },
    is_monthly: {
        type: DataTypes.TINYINT
    },
    is_quarterly: {
        type: DataTypes.TINYINT
    },
    is_half_yearly: {
        type: DataTypes.TINYINT
    },
    is_yearly: {
        type: DataTypes.TINYINT
    },
    extra_period: {
        type: DataTypes.INTEGER
    },
    rate_type: {
        type: DataTypes.STRING
    },
    rates_order: {
        type: DataTypes.INTEGER
    }}, 
{
    tableName: 'config_default_rate',
    timestamps: false
});
module.exports = ConfigDefaultRate;