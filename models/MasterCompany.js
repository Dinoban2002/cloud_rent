const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const MasterCompany = sequelize.define('master_company', {
    __company_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    address_full: {
        type: DataTypes.STRING
    },
    first_name: {
        type: DataTypes.STRING
    },
    last_name: {
        type: DataTypes.STRING
    },
    title: {
        type: DataTypes.STRING
    },
    company: {
        type: DataTypes.STRING
    },
    gst_number: {
        type: DataTypes.STRING
    },
    config_smtp_host: {
        type: DataTypes.STRING
    },
    config_smtp_username: {
        type: DataTypes.STRING
    },
    config_smtp_password: {
        type: DataTypes.STRING
    },
    config_smtp_secure: {
        type: DataTypes.STRING
    },
    config_smtp_port: {
        type: DataTypes.INTEGER
    },
    config_smtp_from_email: {
        type: DataTypes.STRING
    },
    config_smtp_from_username: {
        type: DataTypes.STRING
    },
    config_smtp_replay_to_mail: {
        type: DataTypes.STRING
    },
    trading_number: {
        type: DataTypes.STRING
    },
    billing_address_1: {
        type: DataTypes.STRING
    },
    billing_address_2: {
        type: DataTypes.STRING
    },
    billing_zip_code: {
        type: DataTypes.STRING
    },
    billing_city: {
        type: DataTypes.STRING
    },
    billing_state: {
        type: DataTypes.STRING
    },
    billing_country: {
        type: DataTypes.STRING
    },
    trading_address_1: {
        type: DataTypes.STRING
    },
    trading_address_2: {
        type: DataTypes.STRING
    },
    trading_zip_code: {
        type: DataTypes.STRING
    },
    trading_city: {
        type: DataTypes.STRING
    },
    trading_state: {
        type: DataTypes.STRING
    },
    trading_country: {
        type: DataTypes.STRING
    },
    no_of_users: {
        type: DataTypes.INTEGER
    },
    is_active: {
        type: DataTypes.TINYINT
    },
    created_at: {
        type: DataTypes.DATE
    },
    updated_at: {
        type: DataTypes.DATE
    },
    updated_by: {
        type: DataTypes.INTEGER
    }
},
    {
        tableName: 'master_company',
        timestamps: false
    });
module.exports = MasterCompany;