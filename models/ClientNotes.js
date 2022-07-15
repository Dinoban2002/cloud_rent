const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const ClientNotes = sequelize.define('client_notes', {
    __client_notes_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _client_id_fk: {
        type: DataTypes.INTEGER
    },
    _rental_id_fk: {
        type: DataTypes.INTEGER
    },
    notes: {
        type: DataTypes.STRING
    },
    created_at: {
        type: DataTypes.DATE
    },
    created_by: {
        type: DataTypes.INTEGER
    },
    updated_at: {
        type: DataTypes.DATE
    },
    updated_by: {
        type: DataTypes.INTEGER
    }
},
    {
        tableName: 'client_notes',
        timestamps: false
    });
module.exports = ClientNotes;