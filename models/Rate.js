const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Rate = sequelize.define('config_rate', {
  // Model attributes are defined here
  __rate_config_id_pk  : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _item_type_id_fk:{
        type: DataTypes.INTEGER,
    },
    compeny_id :{
        type: DataTypes.INTEGER,
    },
    label :{
        type: DataTypes.STRING,
    },
    label_name :{
        type: DataTypes.STRING,
    },
    in_hours :{
        type: DataTypes.INTEGER,
    },
    in_days :{
        type: DataTypes.DOUBLE,
    },
    price :{
        type: DataTypes.DOUBLE,
    },
    is_hourly :{
        type: DataTypes.TINYINT,
    },
    is_half_day :{
        type: DataTypes.TINYINT,
    },
    is_daily :{
        type: DataTypes.TINYINT,
    },
    is_weekly :{
        type: DataTypes.TINYINT,
    },
    is_monthly :{
        type: DataTypes.TINYINT,
    },
    is_quarterly :{
        type: DataTypes.TINYINT,
    },
    is_half_yearly :{
        type: DataTypes.TINYINT,
    },
    is_yearly :{
        type: DataTypes.TINYINT,
    },
    rate_type:{
        type: DataTypes.STRING
    },
    rates_order:{
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'config_rate',
    timestamps: false
});

module.exports = Rate;