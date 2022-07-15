const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const MessagesCanned = sequelize.define('messages_canned', {
    __message_canned_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    template_body: {
        type: DataTypes.STRING
    },
    template_name: {
        type: DataTypes.STRING
    },
    type: {
        type: DataTypes.STRING
    },
    is_deleted: {
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
        tableName: 'messages_canned',
        timestamps: false
    });

module.exports = MessagesCanned;