const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Countries = sequelize.define('countries', {
    __countries_id_pk : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    countries_name:{
        type: DataTypes.STRING
    },
    countries_iso_code:{
        type: DataTypes.STRING
    },
    countries_isd_code: {
        type: DataTypes.STRING
    }
});

module.exports = Countries;