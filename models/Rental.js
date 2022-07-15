const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
var moment = require('moment');

const Rental = sequelize.define('rental', {
    // Model attributes are defined here
    __rental_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        get() {
            const rawValue = this.getDataValue("__rental_id_pk");
            return rawValue ? rawValue.toString().padStart(6, '0') : '';
        }
    },
    _address_id_fk: {
        type: DataTypes.INTEGER,
    },
    _client_id_fk: {
        type: DataTypes.INTEGER,
    },
    _config_rental_status_id_fk: {
        type: DataTypes.INTEGER,
    },
    _config_term_id_fk: {
        type: DataTypes.INTEGER,
    },
    _credit_card_rate_id_fk: {
        type: DataTypes.INTEGER,
    },
    _invoice_id_fk: {
        type: DataTypes.INTEGER,
    },
    _rate_config_id_fk: {
        type: DataTypes.INTEGER,
    },
    _staff_id_fk: {
        type: DataTypes.INTEGER,
    },
    _task_id_fk: {
        type: DataTypes.INTEGER,
    },
    _tax_rate_id_fk: {
        type: DataTypes.INTEGER,
    },
    _company_id_fk: {
        type: DataTypes.INTEGER,
    },
    _resource_id_fk: {
        type: DataTypes.INTEGER,
    },
    _business_id_fk: {
        type: DataTypes.INTEGER,
    },
    account_type: {
        type: DataTypes.STRING,
    },
    attach_images: {
        type: DataTypes.STRING,
    },
    attach_terms: {
        type: DataTypes.STRING,
    },
    billing_cycle: {
        type: DataTypes.STRING,
    },
    billing_date_end: {
        type: DataTypes.DATE,
    },
    billing_date_next: {
        type: DataTypes.DATE,
    },
    billing_date_prev: {
        type: DataTypes.DATE,
    },
    billing_date_end_ts: {
        type: DataTypes.DATE,
        get() {
            return this.getDataValue('billing_date_end_ts') ? moment(this.getDataValue('billing_date_end_ts')).format('YYYY-MM-DD HH:mm:ss') : "";
        }
    },
    billing_date_start: {
        type: DataTypes.DATEONLY,
    },
    billing_date_start_ts: {
        type: DataTypes.DATE,
    },
    billing_due_date: {
        type: DataTypes.DATEONLY,
    },
    billing_period_amount: {
        type: DataTypes.TINYINT,
    },
    billing_period_no: {
        type: DataTypes.INTEGER,
    },
    bond: {
        type: DataTypes.DOUBLE,
    },
    bond_paid_amount: {
        type: DataTypes.DOUBLE,
    },
    booking_period: {
        type: DataTypes.STRING,
    },
    check_avails_last_run: {
        type: DataTypes.STRING,
    },
    check_box_billing_set: {
        type: DataTypes.TINYINT,
    },
    check_box_on_hire: {
        type: DataTypes.TINYINT,
    },
    collection: {
        type: DataTypes.STRING,
    },
    collection_date: {
        type: DataTypes.DATEONLY,
    },
    collection_date_end: {
        type: DataTypes.DATEONLY,
    },
    collection_notes: {
        type: DataTypes.STRING,
    },
    collection_time: {
        type: DataTypes.TIME,
    },
    collection_time_end: {
        type: DataTypes.TIME,
    },
    collection_zone: {
        type: DataTypes.INTEGER,
    },
    collection_charge: {
        type: DataTypes.DOUBLE,
    },
    collection_priorty: {
        type: DataTypes.INTEGER,
    },
    collection_range: {
        type: DataTypes.STRING,
    },
    color: {
        type: DataTypes.INTEGER,
    },
    commission: {
        type: DataTypes.STRING,
    },
    company: {
        type: DataTypes.STRING,
    },
    company_discount: {
        type: DataTypes.DOUBLE,
    },
    company_address: {
        type: DataTypes.STRING,
    },
    company_contact: {
        type: DataTypes.STRING,
    },
    company_contact_mobile: {
        type: DataTypes.STRING,
    },
    company_contact_phone: {
        type: DataTypes.STRING,
    },
    company_email: {
        type: DataTypes.STRING,
    },
    contact_first_name: {
        type: DataTypes.STRING,
    },
    contact_phone: {
        type: DataTypes.STRING,
    },
    contact_email: {
        type: DataTypes.STRING,
    },
    rental_type: {
        type: DataTypes.STRING,
    },
    address_full: {
        type: DataTypes.STRING,
    },
    contract_finalisation_amount: {
        type: DataTypes.DOUBLE,
    },
    contract_finalisation_date: {
        type: DataTypes.DATEONLY,
    },
    contract_pdf: {
        type: DataTypes.TEXT,
    },
    contract_version: {
        type: DataTypes.INTEGER,
    },
    credit_card_label: {
        type: DataTypes.STRING,
    },
    credit_card_rate_per: {
        type: DataTypes.DOUBLE,
    },
    customer_notes: {
        type: DataTypes.STRING,
    },
    damage: {
        type: DataTypes.DOUBLE,
    },
    damage_description: {
        type: DataTypes.STRING,
    },
    date: {
        type: DataTypes.DATEONLY,
    },
    date_start: {
        type: DataTypes.DATEONLY,
    },
    date_payment: {
        type: DataTypes.DATEONLY,
    },
    date_end: {
        type: DataTypes.DATEONLY,
    },
    de_prep_date: {
        type: DataTypes.DATEONLY,
    },
    de_prep_time: {
        type: DataTypes.TIME,
    },
    delivery: {
        type: DataTypes.STRING,
    },
    delivery_address: {
        type: DataTypes.STRING,
    },
    delivery_date: {
        type: DataTypes.DATEONLY,
    },
    delivery_date_end: {
        type: DataTypes.DATEONLY,
    },
    delivery_notes: {
        type: DataTypes.STRING,
    },
    delivery_time: {
        type: DataTypes.TIME,
    },
    delivery_time_end: {
        type: DataTypes.TIME,
    },
    delivery_zone: {
        type: DataTypes.STRING,
    },
    delivery_charge: {
        type: DataTypes.DOUBLE,
    },
    delivery_priorty: {
        type: DataTypes.INTEGER,
    },
    delivery_range: {
        type: DataTypes.STRING,
    },
    deposit: {
        type: DataTypes.DOUBLE,
    },
    deposit_balance: {
        type: DataTypes.DOUBLE,
    },
    deposit_balance_date_received: {
        type: DataTypes.DATEONLY,
    },
    deposit_balance_due: {
        type: DataTypes.DATEONLY,
    },
    deposit_balance_received: {
        type: DataTypes.STRING,
    },
    deposit_date_received: {
        type: DataTypes.DATEONLY,
    },
    deposit_due_date: {
        type: DataTypes.DATEONLY,
    },
    deposit_received: {
        type: DataTypes.STRING,
    },
    deposit_received_by: {
        type: DataTypes.STRING,
    },
    deposit_req: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.STRING,
    },
    discount_cash: {
        type: DataTypes.DOUBLE,
    },
    discount_selector: {
        type: DataTypes.INTEGER,
    },
    disp_balance: {
        type: DataTypes.DOUBLE,
    },
    disp_profit: {
        type: DataTypes.DOUBLE,
    },
    document_container: {
        type: DataTypes.TEXT,
    },
    document_store: {
        type: DataTypes.TEXT,
    },
    drag_and_drop_tree_json: {
        type: DataTypes.TEXT,
    },
    driver: {
        type: DataTypes.STRING,
    },
    driver_collection: {
        type: DataTypes.STRING,
    },
    driver_name: {
        type: DataTypes.STRING,
    },
    due_date: {
        type: DataTypes.DATEONLY,
    },
    emailed_by: {
        type: DataTypes.STRING,
    },
    emailed_on: {
        type: DataTypes.DATE,
    },
    end_date_calc: {
        type: DataTypes.DATE,
    },
    event_venue: {
        type: DataTypes.STRING,
    },
    hourly: {
        type: DataTypes.INTEGER,
    },
    image: {
        type: DataTypes.TEXT,
    },
    installation_date: {
        type: DataTypes.DATEONLY,
    },
    installation_time: {
        type: DataTypes.TIME,
    },
    contract_no: {
        type: DataTypes.INTEGER,
    },
    invoice_sent: {
        type: DataTypes.DATE,
        get() {
            return this.getDataValue('invoice_sent') ? moment(this.getDataValue('invoice_sent')).format('YYYY-MM-DD HH:mm:ss') : "";
        }
    },
    invoiced_by: {
        type: DataTypes.STRING,
    },
    invoiced_on: {
        type: DataTypes.DATEONLY,
    },
    job_name: {
        type: DataTypes.STRING,
    },
    job_status: {
        type: DataTypes.STRING,
    },
    job_type: {
        type: DataTypes.STRING,
    },
    last_billing_date: {
        type: DataTypes.DATEONLY,
    },
    location: {
        type: DataTypes.STRING,
    },
    long_term_hire: {
        type: DataTypes.INTEGER,
    },
    meterage_charge: {
        type: DataTypes.STRING,
    },
    method: {
        type: DataTypes.STRING,
    },
    mod_date: {
        type: DataTypes.DATEONLY,
    },
    off_hire_comments: {
        type: DataTypes.STRING,
    },
    off_hire_contact: {
        type: DataTypes.STRING,
    },
    off_hired: {
        type: DataTypes.INTEGER,
    },
    option1: {
        type: DataTypes.STRING,
    },
    option2: {
        type: DataTypes.STRING,
    },
    option3: {
        type: DataTypes.STRING,
    },
    option4: {
        type: DataTypes.STRING,
    },
    option5: {
        type: DataTypes.STRING,
    },
    option6: {
        type: DataTypes.STRING,
    },
    period_no: {
        type: DataTypes.DOUBLE,
    },
    pickup: {
        type: DataTypes.STRING,
    },
    prep_date: {
        type: DataTypes.DATEONLY,
    },
    prep_time: {
        type: DataTypes.TIME,
    },
    prorata_billing: {
        type: DataTypes.INTEGER,
    },
    print_type: {
        type: DataTypes.STRING,
    },
    rate: {
        type: DataTypes.STRING,
    },
    return: {
        type: DataTypes.STRING,
    },
    selected_company_no: {
        type: DataTypes.INTEGER,
    },
    serial_no: {
        type: DataTypes.INTEGER,
    },
    time_start: {
        type: DataTypes.TIME,
    },
    time_end: {
        type: DataTypes.TIME,
    },
    terms: {
        type: DataTypes.INTEGER,
    },
    total: {
        type: DataTypes.DOUBLE,
    },
    unstored_count_invoices: {
        type: DataTypes.INTEGER,
    },
    unstored_period_prorata: {
        type: DataTypes.INTEGER,
    },
    unstored_period_propata_days: {
        type: DataTypes.INTEGER,
    },
    is_deleted: {
        type: DataTypes.TINYINT,
    },
    is_meterage_charge: {
        type: DataTypes.TINYINT,
    },
    is_quote: {
        type: DataTypes.TINYINT,
    },
    is_rental: {
        type: DataTypes.TINYINT,
    },
    deleted_date_time: {
        type: DataTypes.DATE,
    },
    flag_record: {
        type: DataTypes.INTEGER,
    },
    flag_description: {
        type: DataTypes.TEXT,
    },
    start_date_calc: {
        type: DataTypes.DATE,
    },
    site_name: {
        type: DataTypes.STRING,
    },
    status_payment: {
        type: DataTypes.TINYINT,
    },
    status_invoiced: {
        type: DataTypes.TINYINT,
    },
    status_dispatch: {
        type: DataTypes.TINYINT,
    },
    status_overbooked: {
        type: DataTypes.TINYINT,
    },
    shipping_address: {
        type: DataTypes.STRING,
    },
    shipping_city: {
        type: DataTypes.STRING,
    },
    shipping_state: {
        type: DataTypes.STRING,
    },
    shipping_zipcode: {
        type: DataTypes.STRING,
    },
    selected_company: {
        type: DataTypes.STRING
    },
    send_reminder: {
        type: DataTypes.TINYINT,
    },
    show_on_docket: {
        type: DataTypes.TINYINT,
    },
    show_globals: {
        type: DataTypes.TINYINT,
    },
    sort_category: {
        type: DataTypes.TINYINT,
    },
    print_on: {
        type: DataTypes.DATE,
    },
    print_by: {
        type: DataTypes.STRING,
    },
    print_comments: {
        type: DataTypes.TEXT,
    },
    special_conditions: {
        type: DataTypes.TEXT,
    },
    stepper: {
        type: DataTypes.TINYINT
    },
    sub_rental_delivery_pickup: {
        type: DataTypes.TEXT,
    },
    sub_rental_delivery_pickup_date: {
        type: DataTypes.DATE,
    },
    sub_rental_date_sent: {
        type: DataTypes.DATE,
    },
    sub_rental_received: {
        type: DataTypes.DATE,
    },
    sub_rental_message: {
        type: DataTypes.TEXT,
    },
    sub_rental_comments: {
        type: DataTypes.TEXT,
    },
    sub_rental_cost: {
        type: DataTypes.DOUBLE,
    },
    sub_rental_qty: {
        type: DataTypes.INTEGER,
    },
    is_end_date_set: {
        type: DataTypes.INTEGER,
    },
    off_hire_number: {
        type: DataTypes.STRING
    },
    off_hire_staff: {
        type: DataTypes.STRING
    },
    balance: {
        type: DataTypes.DOUBLE,
    },
    off_hire_date: {
        type: DataTypes.DATE
    },
    off_hire_partial_return_percentage: {
        type: DataTypes.INTEGER
    },
    off_hire_number_days_partial_return: {
        type: DataTypes.INTEGER
    },
    is_rate_calculator: {
        type: DataTypes.TINYINT
    },
    is_round_period_no: {
        type: DataTypes.TINYINT
    },
    sur_charge: {
        type: DataTypes.DOUBLE,
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
    },
    use_surcharge: {
        type: DataTypes.TINYINT,
    },
    unstored_month_length: {
        type: DataTypes.INTEGER,
    },
    // function_date: {
    //     type: DataTypes.DATEONLY,
    // },
    // function_time: {
    //     type: DataTypes.TIME,
    // },
}, {
    tableName: 'rental',
    timestamps: false
});

module.exports = Rental;