const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Task = sequelize.define('task', {
    // Model attributes are defined here
    __task_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    _client_id_fk: {
        type: DataTypes.INTEGER
    },
    _inventory_id_fk: {
        type: DataTypes.INTEGER
    },
    _rental_id_fk: {
        type: DataTypes.INTEGER
    },
    asset_no: {
        type: DataTypes.INTEGER
    },
    brand: {
        type: DataTypes.STRING
    },
    calendar_widget_due_date: {
        type: DataTypes.STRING
    },
    calendar_widget_start_date: {
        type: DataTypes.STRING
    },
    client_name: {
        type: DataTypes.STRING
    },
    company_contact: {
        type: DataTypes.STRING
    },
    company_contact_mobile: {
        type: DataTypes.STRING
    },
    company_contact_phone: {
        type: DataTypes.STRING
    },
    customer_contact_details: {
        type: DataTypes.STRING
    },
    date_done: {
        type: DataTypes.DATE
    },
    date_end: {
        type: DataTypes.DATEONLY
    },
    date_start: {
        type: DataTypes.DATEONLY
    },
    days_elapsed: {
        type: DataTypes.INTEGER
    },
    days_left: {
        type: DataTypes.INTEGER
    },
    dbk_notified: {
        type: DataTypes.INTEGER
    },
    dbk_repeating_id: {
        type: DataTypes.STRING
    },
    dbk_tags: {
        type: DataTypes.STRING
    },
    dbk_timestamp_end_calc_num: {
        type: DataTypes.INTEGER
    },
    dbk_timestamp_start_calc_num: {
        type: DataTypes.INTEGER
    },
    dbk_unused: {
        type: DataTypes.STRING
    },
    description: {
        type: DataTypes.STRING
    },
    external: {
        type: DataTypes.STRING
    },
    file: {
        type: DataTypes.STRING
    },
    fm_event_id: {
        type: DataTypes.STRING
    },
    hours_in: {
        type: DataTypes.INTEGER
    },
    id_client: {
        type: DataTypes.STRING
    },
    id_line_item: {
        type: DataTypes.STRING
    },
    id_product: {
        type: DataTypes.STRING
    },
    id_rental: {
        type: DataTypes.STRING
    },
    id_staff: {
        type: DataTypes.STRING
    },
    id_task: {
        type: DataTypes.STRING
    },
    item_name: {
        type: DataTypes.STRING
    },
    job_end_date: {
        type: DataTypes.DATE
    },
    key_rental: {
        type: DataTypes.STRING
    },
    location: {
        type: DataTypes.STRING
    },
    model_no: {
        type: DataTypes.STRING
    },
    notes: {
        type: DataTypes.STRING
    },
    priority: {
        type: DataTypes.INTEGER
    },
    qty: {
        type: DataTypes.INTEGER
    },
    resource: {
        type: DataTypes.INTEGER
    },
    serial_no: {
        type: DataTypes.STRING
    },
    sku: {
        type: DataTypes.STRING
    },
    sort_key: {
        type: DataTypes.STRING
    },
    staff_name: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.STRING
    },
    status_order: {
        type: DataTypes.INTEGER
    },
    summary: {
        type: DataTypes.STRING
    },
    sub_total: {
        type: DataTypes.DOUBLE
    },
    tax: {
        type: DataTypes.DOUBLE
    },
    total: {
        type: DataTypes.DOUBLE
    },
    task: {
        type: DataTypes.STRING
    },
    task_completion_percentage: {
        type: DataTypes.INTEGER
    },
    time_end: {
        type: DataTypes.TIME
    },
    time_start: {
        type: DataTypes.TIME
    },
    today_psos: {
        type: DataTypes.DATE
    },
    vehicle: {
        type: DataTypes.STRING
    },
    is_collection: {
        type: DataTypes.TINYINT
    },
    is_delivery: {
        type: DataTypes.TINYINT
    },
    type: {
        type: DataTypes.STRING
    },
    is_deleted: {
        type: DataTypes.TINYINT
    },
    is_repeated: {
        type: DataTypes.TINYINT
    },
    is_invoiced: {
        type: DataTypes.TINYINT
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
    tableName: 'task',
    timestamps: false
});

module.exports = Task;