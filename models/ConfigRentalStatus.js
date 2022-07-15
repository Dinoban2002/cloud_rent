const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const RentalStatus = sequelize.define('config_rental_status', {
    // Model attributes are defined here
    __config_rental_status_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    color_code: {
        type: DataTypes.INTEGER
    },
    status_label: {
        type: DataTypes.STRING
    },
    created_by: {
        type: DataTypes.STRING
    },
    updated_by: {
        type: DataTypes.STRING
    },
    created_at: {
        type: DataTypes.DATE
    },
    updated_at: {
        type: DataTypes.DATE
    }}, 
    {
        tableName: 'config_rental_status',
        timestamps: false
    });

module.exports = RentalStatus;