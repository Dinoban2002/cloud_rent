const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const QuickNavigationPOS = sequelize.define('quick_navigation_pos', {
  // Model attributes are defined here
  __quick_navigation_pos_id_pk    : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _company_id_fk :{
        type: DataTypes.INTEGER,
    },
    _inventory_id_fk:{
        type: DataTypes.INTEGER,
    },
    category :{
        type: DataTypes.STRING,
    },
    id_product :{
        type: DataTypes.STRING,
    },
    label :{
        type: DataTypes.STRING,
    },
    price:{
        type: DataTypes.DOUBLE,
    },
    priority :{
        type: DataTypes.INTEGER,
    },
    sku :{
        type: DataTypes.STRING,
    },
    starting_qty :{
        type: DataTypes.INTEGER,
    },
    taxable :{
        type: DataTypes.TINYINT,
    },
    created_by :{
        type: DataTypes.STRING,
    },
    updated_by :{
        type: DataTypes.STRING,
    },
    created_at:{
        type: DataTypes.DATE,
    }
}, {
    tableName: 'quick_navigation_pos',
    timestamps: false
});

module.exports = QuickNavigationPOS;