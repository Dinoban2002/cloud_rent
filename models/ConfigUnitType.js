const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const UnitType = sequelize.define('config_unit_type', {
    // Model attributes are defined here
    __config_unit_type_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _company_id_fk:{
        type: DataTypes.INTEGER
    },
    unit_type: {
        type: DataTypes.STRING
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
    updated_at: {
        type: DataTypes.DATE
    }}, 
    {
        tableName: 'config_unit_type',
        timestamps: false
    });

module.exports = UnitType;