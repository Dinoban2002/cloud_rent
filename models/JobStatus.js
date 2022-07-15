const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const JobStatus = sequelize.define('job_status', {
    __job_status_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    is_deleted:{
        type: DataTypes.TINYINT
    },
    color: {
        type: DataTypes.STRING
    },
    job_status: {
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
},
    {
        tableName: 'job_status',
        timestamps: false
    });

module.exports = JobStatus;