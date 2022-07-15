const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Messaging = sequelize.define('messaging', {
    __messaging_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _client_id_fk: {
        type: DataTypes.INTEGER
    },
    attachments:{
        type: DataTypes.TEXT
    },
    subject: {
        type: DataTypes.STRING
    },
    message: {
        type: DataTypes.STRING
    },
    sms_cost: {
        type: DataTypes.DOUBLE
    },
    to_phone_number: {
        type: DataTypes.STRING
    },
    type: {
        type: DataTypes.STRING
    },
    is_deleted:{
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
    updated_at: {
        type: DataTypes.DATE
    }
}, {
        tableName: 'messaging',
        timestamps: false
    });

module.exports = Messaging;