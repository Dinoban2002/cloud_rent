const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Service = sequelize.define('service', {
  // Model attributes are defined here
  __service_id_pk: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  _client_id_fk: {
    type: DataTypes.INTEGER
  },
  _inventory_id_fk: {
    type: DataTypes.INTEGER
  },
  _invoice_item_id_fk: {
    type: DataTypes.INTEGER
  },
  _resource_id_fk: {
    type: DataTypes.INTEGER
  },
  _rental_id_fk: {
    type: DataTypes.INTEGER
  },
  _task_id_fk: {
    type: DataTypes.INTEGER
  },
  _rental_item_id_fk: {
    type: DataTypes.INTEGER
  },
  charge_per_hour: {
    type: DataTypes.DOUBLE
  },
  contract_no: {
    type: DataTypes.STRING
  },
  cost_per_hour: {
    type: DataTypes.DOUBLE
  },
  modification_host_timestamp: {
    type: DataTypes.DATE
  },
  creation_host_timestamp: {
    type: DataTypes.DATE
  },
  end: {
    type: DataTypes.TIME
  },
  fee: {
    type: DataTypes.DOUBLE
  },
  item: {
    type: DataTypes.STRING
  },
  mobile: {
    type: DataTypes.STRING
  },
  name: {
    type: DataTypes.STRING
  },
  staff_member: {
    type: DataTypes.STRING
  },
  start: {
    type: DataTypes.TIME
  },
  status: {
    type: DataTypes.STRING
  },
  total_cost: {
    type: DataTypes.DOUBLE
  },
  units: {
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
  }
}, {
  tableName: 'service',
  timestamps: false
});

module.exports = Service;