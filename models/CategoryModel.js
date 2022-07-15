const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const Category = sequelize.define('category', {
    __category_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _item_type_id_fk: {
        type: DataTypes.INTEGER
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    category_name: {
        type: DataTypes.STRING
    },
    is_active:{
        type: DataTypes.TINYINT
    },
    created_by: {
        type: DataTypes.INTEGER
    },
    updated_by: {
        type: DataTypes.INTEGER
    },
    created_at: {
        type: DataTypes.DATE
    },
    updated_at:{
        type: DataTypes.DATE
    }
},
    {
        tableName: 'category',
        timestamps: false
    });
module.exports = Category;