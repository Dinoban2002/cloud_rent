const sequelize = require("../config/database");

const { Sequelize, DataTypes } = require('sequelize');
//const sequelize = new Sequelize('sqlite::memory:');

const CompanySubscription = sequelize.define('company_subscription', {
  // Model attributes are defined here
  __company_subscription_id_pk: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  _subscription_id_fk: {
    type: DataTypes.INTEGER
  },
  _company_id_fk: {
    type: DataTypes.INTEGER
  },
  config_date_format: {
    type: DataTypes.STRING
  },
  config_db_date_format: {
    type: DataTypes.STRING
  },
  decimal_digits: {
    type: DataTypes.TINYINT
  },
  config_db_invoice_summary_date_format: {
    type: DataTypes.STRING
  },
  no_of_users: {
    type: DataTypes.INTEGER
  },
  file_max_size: {
    type: DataTypes.INTEGER
  },
  active: {
    type: DataTypes.TINYINT
  },
  subscription_date: {
    type: DataTypes.DATE
  },
  created_at: {
    type: DataTypes.DATE
  },
  updated_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'company_subscription',
  timestamps: false
});

module.exports = CompanySubscription;