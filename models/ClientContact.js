const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const ClientContact = sequelize.define('client_contact', {
    // Model attributes are defined here
    __client_contact_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _client_id_fk: {
        type: DataTypes.INTEGER
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    first_name: {
        type: DataTypes.STRING
    },
    last_name: {
        type: DataTypes.STRING
    },
    notes: {
        type: DataTypes.STRING
    },
    position: {
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
        tableName: 'client_contact',
        timestamps: false
    });

module.exports = ClientContact;