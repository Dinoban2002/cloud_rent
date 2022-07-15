const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const RentalResource = sequelize.define('rental_resource', {
  // Model attributes are defined here
  __rental_resource_id_pk: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  _company_id_fk: {
    type: DataTypes.INTEGER,
  },
  _rental_id_fk: {
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
  tableName: 'rental_resource',
  timestamps: false
});

module.exports = RentalResource;