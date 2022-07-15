const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const InventoryRate = sequelize.define('inventory_rate', {
    // Model attributes are defined here
    __inventory_rate_id_pk : {
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
    _rate_config_id_fk: {
        type: DataTypes.INTEGER,
        validate: {
            isInt: true,
        }
    },
    cost:{
        type: DataTypes.DOUBLE,
    },
    cost_per:{
        type: DataTypes.DOUBLE,
    },
    extra_period:{
        type: DataTypes.INTEGER,
    },
    period_days:{
        type: DataTypes.INTEGER,
        validate: {
            isInt: true,
        }
    },
    price_default : {
        type: DataTypes.DOUBLE,
        validate: {
            isDecimal: true,
        }
    },
    price_extra_tax:{
        type: DataTypes.INTEGER,
    },
    is_re_occur:{
        type: DataTypes.TINYINT,
    },
    is_use_mtr_fee:{
        type: DataTypes.TINYINT,
    },
    rate_name:{
        type: DataTypes.STRING
    },
    rate_label:{
        type: DataTypes.STRING
    },
    is_hourly:{
        type: DataTypes.TINYINT
    },
    is_daily:{
        type: DataTypes.TINYINT
    },
    created_by: {
        type: DataTypes.STRING
    },
    created_at: {
        type: DataTypes.DATE
    },
    updated_by: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'inventory_rate',
    timestamps: false
});

module.exports = InventoryRate;