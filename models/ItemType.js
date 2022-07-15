const sequelize = require("../config/database");

const { Sequelize, DataTypes } = require('sequelize');
//const sequelize = new Sequelize('sqlite::memory:');

const ItemType = sequelize.define('item_type', {
  // Model attributes are defined here
  __item_type_id_pk: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  type_name: {
    type: DataTypes.STRING
  },
  is_sell: {
    type: DataTypes.TINYINT
  },
  is_rate_applicable:{
    type: DataTypes.TINYINT
  }
}, {
    tableName: 'item_type',
    timestamps: false
  });

module.exports = ItemType;