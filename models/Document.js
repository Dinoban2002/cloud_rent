const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const Document = sequelize.define('document', {
  __document_id_pk: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  _company_id_fk: {
    type: DataTypes.INTEGER,
  },
  _rental_id_fk: {
    type: DataTypes.INTEGER,
  },
  checkbox_use_global: {
    type: DataTypes.STRING,
  },
  document_container: {
    type: DataTypes.STRING,
  },
  file_type: {
    type: DataTypes.STRING,
  },
  idf_patrent: {
    type: DataTypes.STRING,
  },
  is_deleted: {
    type: DataTypes.TINYINT,
  },
  mark_as_selected: {
    type: DataTypes.STRING,
  },
  use_global: {
    type: DataTypes.TINYINT,
  },
  updated_at: {
    type: DataTypes.NOW
  },
  created_at: {
    type: DataTypes.DATE
  },
  updated_by: {
    type: DataTypes.STRING
  },
  created_by: {
    type: DataTypes.STRING,
  }
},
  {
    tableName: 'document',
    timestamps: false
  });
module.exports = Document;