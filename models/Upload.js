const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const Upload = sequelize.define('upload', {
    __upload_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _inventory_id_fk: {
        type: DataTypes.INTEGER
    },
    _rental_id_fk: {
        type: DataTypes.INTEGER
    },
    // ext: {
    //     type: DataTypes.STRING
    // },
    file_name: {
        type: DataTypes.STRING
    },
    name_ref: {
        type: DataTypes.STRING
    },
    file_path: {
        type: DataTypes.STRING
    },
    file_name_fm: {
        type: DataTypes.STRING
    },
    valid_upto: {
        type: DataTypes.DATE
    },
    days_limit: {
        type: DataTypes.TINYINT
    },
    is_main_file: {
        type: DataTypes.TINYINT
    },
    is_revenue: {
        type: DataTypes.INTEGER
    },
    is_scanned: {
        type: DataTypes.TINYINT
    },
    is_signature: {
        type: DataTypes.TINYINT
    },
    is_deleted: {
        type: DataTypes.TINYINT
    },
    created_at: {
        type: DataTypes.DATE
    },
    updated_at: {
        type: DataTypes.DATE
    },
    created_by: {
        type: DataTypes.INTEGER
    },
    updated_by: {
        type: DataTypes.INTEGER
    }
},
    {
        tableName: 'upload',
        timestamps: false
    });
module.exports = Upload;