const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const ConfigCalendarStatus = sequelize.define('config_calendar_status', {
  __config_calendar_status_id_pk: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  _company_id_fk: {
    type: DataTypes.INTEGER
  },
  color_rgb_value: {
    type: DataTypes.STRING
  },
  name: {
    type: DataTypes.STRING
  },
  sort: {
    type: DataTypes.INTEGER
  },
  type: {
    type: DataTypes.INTEGER
  },
  locked: {
    type: DataTypes.INTEGER
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
    tableName: 'config_calendar_status',
    timestamps: false
  });

module.exports = ConfigCalendarStatus;