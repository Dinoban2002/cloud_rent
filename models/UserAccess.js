const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const UserAccess = sequelize.define('user_access', {
  // Model attributes are defined here
  __user_access_id_pk: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  _staff_id_fk: {
    type: DataTypes.INTEGER,
  },
  access_rights: {
    type: DataTypes.INTEGER,
  },
  is_deleted: {
    type: DataTypes.TINYINT,
  },
  client_creation: {
    type: DataTypes.TINYINT,
  },
  client_deletion: {
    type: DataTypes.TINYINT,
  },
  client_updation: {
    type: DataTypes.TINYINT,
  },
  inventory_creation: {
    type: DataTypes.TINYINT,
  },
  inventory_deletion: {
    type: DataTypes.TINYINT,
  },
  inventory_updation: {
    type: DataTypes.TINYINT,
  },
  invoice_creation: {
    type: DataTypes.TINYINT,
  },
  invoice_deletion: {
    type: DataTypes.TINYINT,
  },
  invoice_updation: {
    type: DataTypes.TINYINT,
  },
  rental_creation: {
    type: DataTypes.TINYINT,
  },
  rental_deletion: {
    type: DataTypes.TINYINT,
  },
  rental_updation: {
    type: DataTypes.TINYINT,
  },
}, {
  tableName: 'user_access',
  timestamps: false
});

module.exports = UserAccess;