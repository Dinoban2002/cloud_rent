const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const Location = sequelize.define('config_location', {
    __config_location_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    location_name: {
        type: DataTypes.STRING
    },
    is_active:{
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
    updated_at:{
        type: DataTypes.DATE
    }
},
    {
        tableName: 'config_location',
        timestamps: false
    });
module.exports = Location;