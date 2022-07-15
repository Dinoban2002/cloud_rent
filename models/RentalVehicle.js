const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const RentalVehicle = sequelize.define('rental_vehicle', {
  // Model attributes are defined here
  __rental_vehicle_id_pk: {
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
  tableName: 'rental_vehicle',
  timestamps: false
});

module.exports = RentalVehicle;