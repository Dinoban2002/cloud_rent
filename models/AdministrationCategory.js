const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const AdminCategory = sequelize.define('admin_category', {
  __category_admin_id_pk: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  _company_id_fk: {
    type: DataTypes.INTEGER
  },
  category_name: {
    type: DataTypes.STRING
  },
  is_active: {
    type: DataTypes.TINYINT
  }
},
  {
    tableName: 'admin_category',
    timestamps: false
  });
module.exports = AdminCategory;