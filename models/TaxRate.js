const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const TaxRate = sequelize.define('tax_rate', {
  // Model attributes are defined here
  __tax_rate_id_pk   : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _company_id_fk :{
        type: DataTypes.INTEGER,
    },
    percentage :{
        type: DataTypes.DOUBLE,
    },
    tax_code :{
        type: DataTypes.STRING,
    },
    tax_name :{
        type: DataTypes.STRING,
    },
    is_default:{
        type: DataTypes.TINYINT,
    }
}, {
    tableName: 'tax_rate',
    timestamps: false
});

module.exports = TaxRate;