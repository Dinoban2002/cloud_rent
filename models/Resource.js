const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Resource = sequelize.define('resource', {
    __resource_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    _staff_id_fk:{
        type: DataTypes.INTEGER
    },
    abbreviation: {
        type: DataTypes.STRING
    },
    id_resource: {
        type: DataTypes.STRING
    },
    is_deleted: {
        type: DataTypes.TINYINT
    },
    mobile: {
        type: DataTypes.STRING
    },
    name: {
        type: DataTypes.STRING
    },
    priority: {
        type: DataTypes.INTEGER
    },
    type: {
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
    }
}, {
        tableName: 'resource',
        timestamps: false
    });

module.exports = Resource;