const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const AssetManagement = sequelize.define('asset_management', {
    __asset_management_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        get() {
            const rawValue = this.getDataValue("__asset_management_id_pk");
            return rawValue ? rawValue.toString().padStart(6, '0') : '';
        }
    },
    _inventory_id_fk: {
        type: DataTypes.INTEGER
    },
    active: {
        type: DataTypes.TINYINT
    },
    active_display: {
        type: DataTypes.STRING
    },
    asset_no: {
        type: DataTypes.STRING
    },
    asset_notes: {
        type: DataTypes.STRING
    },
    brand: {
        type: DataTypes.STRING
    },
    barcode_image: {
        type: DataTypes.STRING
    },
    date_purchased: {
        type: DataTypes.DATE
    },
    hours_used: {
        type: DataTypes.INTEGER
    },
    item_name: {
        type: DataTypes.STRING
    },
    last_service_date: {
        type: DataTypes.DATE
    },
    last_service_hours: {
        type: DataTypes.INTEGER
    },
    last_test_date: {
        type: DataTypes.DATE
    },
    last_tested_by: {
        type: DataTypes.STRING
    },
    last_test_scan: {
        type: DataTypes.STRING
    },
    last_test_time: {
        type: DataTypes.TIME
    },
    maintenance_comments: {
        type: DataTypes.STRING
    },
    model_no: {
        type: DataTypes.STRING
    },
    new_service_date: {
        type: DataTypes.DATE
    },
    period_till_service: {
        type: DataTypes.INTEGER
    },
    purchase_amount: {
        type: DataTypes.INTEGER
    },
    record_status: {
        type: DataTypes.STRING
    },
    serial_no: {
        type: DataTypes.STRING,
        get() {
            const rawValue = this.getDataValue("serial_no");
            return rawValue ? rawValue.toString().padStart(6, '0') : '';
        }
    },
    service_period: {
        type: DataTypes.INTEGER
    },
    service_period_type: {
        type: DataTypes.STRING
    },
    sku: {
        type: DataTypes.STRING
    },
    supplier: {
        type: DataTypes.STRING
    },
    test_barcode_image: {
        type: DataTypes.STRING
    },
    test_date: {
        type: DataTypes.DATE
    },
    test_date_next: {
        type: DataTypes.DATE
    },
    tested_by: {
        type: DataTypes.STRING
    },
    tested_serial: {
        type: DataTypes.STRING
    },
    test_period: {
        type: DataTypes.INTEGER
    },
    test_time: {
        type: DataTypes.TIME
    },
    unstored_logo: {
        type: DataTypes.STRING
    },
    unstored_barcode_image_empt: {
        type: DataTypes.INTEGER
    },
    warranty_date_end: {
        type: DataTypes.DATE
    },
    warranty_date_start: {
        type: DataTypes.DATE
    },
    warranty_period: {
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
    tableName: 'asset_management',
    timestamps: false
});
module.exports = AssetManagement;