const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Terms = sequelize.define('config_term', {
    // Model attributes are defined here
    __config_term_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _company_id_fk: {
        type: DataTypes.INTEGER,
    },
    term_label: {
        type: DataTypes.STRING,
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
        tableName: 'config_term',
        timestamps: false
    });

module.exports = Terms;