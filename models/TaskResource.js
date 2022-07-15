const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const TaskResource = sequelize.define('task_resource', {
  // Model attributes are defined here
  __task_resource_id_pk: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  _company_id_fk: {
    type: DataTypes.INTEGER,
  },
  _task_id_fk: {
    type: DataTypes.INTEGER,
  },
  _resource_id_fk: {
    type: DataTypes.INTEGER,
  },
  created_by: {
    type: DataTypes.INTEGER,
  },
  created_at: {
    type: DataTypes.DATE,
  }
}, {
  tableName: 'task_resource',
  timestamps: false
});

module.exports = TaskResource;