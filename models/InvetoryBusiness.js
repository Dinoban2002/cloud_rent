const sequelize = require("../config/database");
const { DataTypes } = require('sequelize');

const InvetoryBusiness = sequelize.define('invetory_business', {
  // Model attributes are defined here
  __invetory_business_id_pk: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  _business_id_fk: {
    type: DataTypes.INTEGER,
    validate: {
      isInt: true,
    }
  },
  _inventory_id_fk: {
    type: DataTypes.INTEGER,
    validate: {
      isInt: true,
    }
  },
  qty: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'invetory_business',
  timestamps: false
});

module.exports = InvetoryBusiness;