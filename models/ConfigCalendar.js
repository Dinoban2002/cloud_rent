const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const ConfigCalendar = sequelize.define('config_calendar', {
    __config_calendar_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    _staff_id_fk: {
        type: DataTypes.INTEGER
    },
    default_time: {
        type: DataTypes.TIME
    },
    earliest_time: {
        type: DataTypes.TIME
    },
    latest_time: {
        type: DataTypes.TIME
    },
    time_scale: {
        type: DataTypes.INTEGER
    },
    is_show_weekends: {
        type: DataTypes.TINYINT
    },
    is_long_term_rentals: {
        type: DataTypes.TINYINT
    },
    is_compressed_view: {
        type: DataTypes.TINYINT
    },
    is_fluid_months: {
        type: DataTypes.TINYINT
    },
    is_show_distance: {
        type: DataTypes.TINYINT
    },
    breakout_by: {
        type: DataTypes.STRING
    },
    created_by: {
        type: DataTypes.INTEGER
    },
    updated_by: {
        type: DataTypes.INTEGER
    },
    created_at: {
        type: DataTypes.DATE
    },
    updated_at: {
        type: DataTypes.DATE
    }
},
    {
        tableName: 'config_calendar',
        timestamps: false
    });

module.exports = ConfigCalendar;