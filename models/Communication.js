const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Communication = sequelize.define('communication', {
    // Model attributes are defined here
    __comm_id_pk : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _client_id_fk: {
        type: DataTypes.INTEGER
    },
    _client_contact_id_fk: {
        type: DataTypes.INTEGER
    },
    email: {
        type: DataTypes.STRING
    },
    home_email: {
        type: DataTypes.STRING
    },
    is_int: {
        type: DataTypes.TINYINT
    },
    is_tel: {
        type: DataTypes.TINYINT
    },
    data: {
        type: DataTypes.STRING
    },
    type: {
        type: DataTypes.STRING
    },
    area_code: {
        type: DataTypes.STRING
    },
    country_code: {
        type: DataTypes.STRING
    },
    is_default: {
        type: DataTypes.TINYINT
    }
}, 
{
    tableName: 'communication',
    timestamps: false
});

module.exports = Communication;