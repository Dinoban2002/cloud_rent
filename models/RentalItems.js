const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const RentalItem = sequelize.define('rental_item', {
    __rental_item_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _client_id_fk: {
        type: DataTypes.INTEGER,
    },
    _inventory_id_fk: {
        type: DataTypes.INTEGER,
    },
    _project_id_fk: {
        type: DataTypes.INTEGER,
    },
    _rental_id_fk: {
        type: DataTypes.INTEGER,
    },
    _rental_item_id_fk: {
        type: DataTypes.INTEGER,
    },
    _rate_config_id_fk: {
        type: DataTypes.INTEGER,
    },
    _task_id_fk: {
        type: DataTypes.INTEGER,
    },
    fk_serial: {
        type: DataTypes.STRING,
    },
    asset_no: {
        type: DataTypes.INTEGER,
    },
    account_code: {
        type: DataTypes.INTEGER,
    },
    amount: {
        type: DataTypes.DOUBLE,
    },
    balance: {
        type: DataTypes.INTEGER,
    },
    balance_metres: {
        type: DataTypes.INTEGER,
    },
    bin_no: {
        type: DataTypes.STRING,
    },
    category: {
        type: DataTypes.STRING,
    },
    commission_cost: {
        type: DataTypes.DOUBLE,
    },
    cost: {
        type: DataTypes.DOUBLE,
    }
    ,
    date: {
        type: DataTypes.DATEONLY,
    },
    date_end: {
        type: DataTypes.DATEONLY,
    },
    discount_rate: {
        type: DataTypes.DOUBLE,
    },
    discount_amount: {
        type: DataTypes.DOUBLE,
    },
    file_ref: {
        type: DataTypes.STRING,
    },
    header: {
        type: DataTypes.INTEGER,
    },
    hours_in: {
        type: DataTypes.INTEGER,
    },
    hours_out: {
        type: DataTypes.INTEGER,
    },
    hours_total: {
        type: DataTypes.INTEGER,
    },
    hours_used: {
        type: DataTypes.INTEGER,
    },
    isfromweb: {
        type: DataTypes.TINYINT,
    },
    item: {
        type: DataTypes.STRING,
    },
    item_serialised: {
        type: DataTypes.STRING,
    },
    jobstatus: {
        type: DataTypes.STRING,
    },
    last_service_hours: {
        type: DataTypes.INTEGER,
    },
    level: {
        type: DataTypes.INTEGER,
    },
    lineitemserial: {
        type: DataTypes.STRING,
    },
    location: {
        type: DataTypes.STRING,
    },
    loss: {
        type: DataTypes.INTEGER,
    },
    metre_charge: {
        type: DataTypes.DOUBLE,
    },
    metres: {
        type: DataTypes.INTEGER
    },
    off_hire_cost: {
        type: DataTypes.DOUBLE,
    },
    off_hire_date: {
        type: DataTypes.DATEONLY,
    },
    off_hire_period: {
        type: DataTypes.INTEGER,
    },
    orders: {
        type: DataTypes.INTEGER,
    },
    prorata_cost: {
        type: DataTypes.DOUBLE,
    },
    prorata_date: {
        type: DataTypes.DATEONLY,
    },
    prorata_period: {
        type: DataTypes.INTEGER,
    },
    period_till_service: {
        type: DataTypes.INTEGER,
    },
    qty: {
        type: DataTypes.INTEGER,
    },
    quantity_dispatched: {
        type: DataTypes.INTEGER,
    },
    quantity_over_booked: {
        type: DataTypes.INTEGER,
    },
    quantity_returned: {
        type: DataTypes.INTEGER,
    },
    replacement_cost: {
        type: DataTypes.DOUBLE,
    },
    resource: {
        type: DataTypes.STRING,
    },
    service_period: {
        type: DataTypes.INTEGER,
    },
    servicestatus: {
        type: DataTypes.INTEGER,
    },
    service_status: {
        type: DataTypes.INTEGER,
    },
    selected_company_no: {
        type: DataTypes.INTEGER,
    },
    sku: {
        type: DataTypes.STRING,
    },
    sort: {
        type: DataTypes.INTEGER,
    },
    source: {
        type: DataTypes.INTEGER,
    },
    sub_item: {
        type: DataTypes.TINYINT,
    },
    sub_rent: {
        type: DataTypes.TINYINT,
    },
    sub_rental_cost: {
        type: DataTypes.DOUBLE,
    },
    status: {
        type: DataTypes.STRING,
    },
    taxable: {
        type: DataTypes.TINYINT,
    },
    taxable_amount: {
        type: DataTypes.DOUBLE,
    },
    time_end: {
        type: DataTypes.TIME,
    },
    time_start: {
        type: DataTypes.TIME,
    },
    total_price: {
        type: DataTypes.DOUBLE,
    },
    total_service_cost: {
        type: DataTypes.DOUBLE,
    },
    total_service_profit: {
        type: DataTypes.DOUBLE,
    },
    total_service_rrp: {
        type: DataTypes.DOUBLE,
    },
    type: {
        type: DataTypes.STRING,
    },
    unit_price: {
        type: DataTypes.DOUBLE,
    },
    unit_type: {
        type: DataTypes.STRING,
    },
    units: {
        type: DataTypes.INTEGER
    },
    unstored_loss: {
        type: DataTypes.DOUBLE,
    },
    year: {
        type: DataTypes.INTEGER
    },
    deleted_date_time: {
        type: DataTypes.DATE,
    },
    is_asset_no_added: {
        type: DataTypes.TINYINT,
    },
    is_header: {
        type: DataTypes.TINYINT,
    },
    is_details: {
        type: DataTypes.TINYINT,
    },
    is_track_serial_no: {
        type: DataTypes.TINYINT,
    },
    created_by: {
        type: DataTypes.STRING,
    },
    updated_by: {
        type: DataTypes.STRING,
    },
    created_at: {
        type: DataTypes.DATE,
    },
    updated_at: {
        type: DataTypes.NOW,
    }
}, {
    tableName: 'rental_item',
    timestamps: false
});

module.exports = RentalItem;