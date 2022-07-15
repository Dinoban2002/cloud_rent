const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const Administration = sequelize.define('administration', {
    __administration_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _company_id_fk: {
        type: DataTypes.INTEGER,
    },
    _rate_config_id_fk: {
        type: DataTypes.INTEGER,
    },
    checkbox_credit_card: {
        type: DataTypes.TINYINT
    },
    checkbox_long_term: {
        type: DataTypes.TINYINT
    },
    checkbox_tc: {
        type: DataTypes.TINYINT
    },
    checkbox_rate_calc: {
        type: DataTypes.TINYINT
    },
    // checkbox_mirror_sync:{
    //     type: DataTypes.TINYINT
    // },
    checkbox_show_supplier_code: {
        type: DataTypes.TINYINT
    },
    show_contract_details: {
        type: DataTypes.STRING
    },
    colour: {
        type: DataTypes.STRING
    },
    checkbox_delivery_quotes: {
        type: DataTypes.TINYINT
    },
    trade_hrs_mon: {
        type: DataTypes.STRING
    },
    trade_hrs_tue: {
        type: DataTypes.STRING
    },
    trade_hrs_wed: {
        type: DataTypes.STRING
    },
    trade_hrs_thurs: {
        type: DataTypes.STRING
    },
    trade_hrs_fri: {
        type: DataTypes.STRING
    },
    trade_hrs_sat: {
        type: DataTypes.STRING
    },
    trade_hrs_sun: {
        type: DataTypes.STRING
    },
    account_code: {
        type: DataTypes.STRING
    },
    account_id: {
        type: DataTypes.STRING
    },
    address_1: {
        type: DataTypes.STRING
    },
    address_1_shipping: {
        type: DataTypes.STRING
    },
    address_2: {
        type: DataTypes.STRING
    },
    address_2_shipping: {
        type: DataTypes.INTEGER
    },
    api_key: {
        type: DataTypes.STRING
    },
    api_user_id: {
        type: DataTypes.STRING
    },
    api_user_id_quickbook: {
        type: DataTypes.STRING
    },
    api_key_quickbook: {
        type: DataTypes.STRING
    },
    bank_account_bsb: {
        type: DataTypes.INTEGER
    },

    bank_account_name: {
        type: DataTypes.STRING
    },
    bank_account_number: {
        type: DataTypes.STRING
    },
    bank_name: {
        type: DataTypes.STRING
    },
    checkbox_use_bond: {
        type: DataTypes.INTEGER
    },
    bond_label: {
        type: DataTypes.STRING
    },
    bond_rate: {
        type: DataTypes.DECIMAL
    },
    business_type: {
        type: DataTypes.STRING
    },
    checkbox_add_de_prep_days: {
        type: DataTypes.TINYINT
    },
    checkbox_add_prep_days: {
        type: DataTypes.TINYINT
    },
    checkbox_add_sku_line_items: {
        type: DataTypes.TINYINT
    },
    checkbox_checkAvailability: {
        type: DataTypes.TINYINT
    },
    checkbox_no_add_address: {
        type: DataTypes.TINYINT
    },
    checkbox_no_collection: {
        type: DataTypes.TINYINT
    },
    checkbox_no_gearlist_email: {
        type: DataTypes.TINYINT
    },
    checkbox_non_posted: {
        type: DataTypes.TINYINT
    },
    checkbox_use_trading_name: {
        type: DataTypes.TINYINT
    },
    city: {
        type: DataTypes.STRING
    },
    city_shipping: {
        type: DataTypes.STRING
    },
    colour_palette: {
        type: DataTypes.STRING
    },
    company_for_customer_chart: {
        type: DataTypes.STRING
    },
    company_name: {
        type: DataTypes.STRING
    },
    company_number: {
        type: DataTypes.STRING
    },
    company_id_quickbook: {
        type: DataTypes.STRING
    },
    consumer_key: {
        type: DataTypes.STRING
    },
    consumer_key_quickbook: {
        type: DataTypes.STRING
    },
    consumer_secret: {
        type: DataTypes.STRING
    },
    consumer_secret_quickbook: {
        type: DataTypes.STRING
    },
    contract_label: {
        type: DataTypes.STRING
    },
    country: {
        type: DataTypes.STRING
    },
    country_code: {
        type: DataTypes.STRING
    },
    credit_cards_yes_no: {
        type: DataTypes.STRING
    },
    currency: {
        type: DataTypes.STRING
    },
    default_billing_period: {
        type: DataTypes.STRING
    },
    default_freight_code: {
        type: DataTypes.INTEGER
    },
    default_rate: {
        type: DataTypes.STRING
    },
    default_sales_code: {
        type: DataTypes.INTEGER
    },
    default_tax_rate: {
        type: DataTypes.DECIMAL
    },
    default_tax_rate_name: {
        type: DataTypes.STRING
    },
    default_time_in: {
        type: DataTypes.TIME
    },
    default_time_out: {
        type: DataTypes.TIME
    },
    delivery_default: {
        type: DataTypes.STRING
    },
    deposit_amount: {
        type: DataTypes.DECIMAL
    },
    checkbox_deposit_balance_due_setdate: {
        type: DataTypes.TINYINT
    },
    deposit_balance_due_period: {
        type: DataTypes.INTEGER
    },
    checkbox_deposit_due_setdate: {
        type: DataTypes.TINYINT
    },
    deposit_percentage: {
        type: DataTypes.DOUBLE
    },
    deposit_period: {
        type: DataTypes.INTEGER
    },
    checkbox_use_deposit: {
        type: DataTypes.STRING
    },
    de_prep_days: {
        type: DataTypes.INTEGER
    },
    email_comment_booking: {
        type: DataTypes.TEXT
    },
    email_comment_end_of_rental: {
        type: DataTypes.TEXT
    },
    email_comment_invoice: {
        type: DataTypes.TEXT
    },
    email_comment_payment: {
        type: DataTypes.TEXT
    },
    email_comment_quote: {
        type: DataTypes.TEXT
    },
    email_source: {
        type: DataTypes.STRING
    },
    // external_ios_scanner:{
    //     type: DataTypes.INTEGER
    // },
    fax: {
        type: DataTypes.STRING
    },
    google_directions_api_key: {
        type: DataTypes.STRING
    },
    header: {
        type: DataTypes.STRING
    },
    inventory_label_1: {
        type: DataTypes.STRING
    },
    inventory_label_2: {
        type: DataTypes.STRING
    },
    inventory_label_3: {
        type: DataTypes.STRING
    },
    inventory_label_4: {
        type: DataTypes.STRING
    },
    inventory_label_5: {
        type: DataTypes.STRING
    },
    inventory_label_6: {
        type: DataTypes.STRING
    },
    inventory_label_7: {
        type: DataTypes.STRING
    },
    inventory_label_8: {
        type: DataTypes.STRING
    },
    invoice_date: {
        type: DataTypes.DATEONLY
    },
    invoice_label: {
        type: DataTypes.STRING
    },
    invoice_comments: {
        type: DataTypes.STRING
    },
    invoice_email_auto_debit_template: {
        type: DataTypes.TEXT
    },
    invoice_email_default_template: {
        type: DataTypes.TEXT
    },
    is_updated_xero: {
        type: DataTypes.TINYINT
    },
    item_for_product_chart: {
        type: DataTypes.STRING
    },
    length: {
        type: DataTypes.STRING
    },
    logo: {
        type: DataTypes.TEXT
    },
    logo_banner: {
        type: DataTypes.TEXT
    },
    mobile_phone: {
        type: DataTypes.STRING
    },
    pdf_date_format: {
        type: DataTypes.STRING
    },
    office_email: {
        type: DataTypes.STRING
    },
    office_phone: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING
    },
    period: {
        type: DataTypes.DOUBLE
    },
    postal_code: {
        type: DataTypes.STRING
    },
    postal_code_shipping: {
        type: DataTypes.STRING
    },
    pos_email_subject: {
        type: DataTypes.TEXT
    },
    pos_email_body: {
        type: DataTypes.TEXT
    },
    prep_days: {
        type: DataTypes.INTEGER
    },
    is_price_incl_tax: {
        type: DataTypes.DECIMAL
    },
    private_key: {
        type: DataTypes.TEXT
    },
    public_key: {
        type: DataTypes.TEXT
    },
    quickbook_access_expiry_date: {
        type: DataTypes.DATE
    },
    quickbooks_active: {
        type: DataTypes.INTEGER
    },
    round_days: {
        type: DataTypes.INTEGER
    },
    run_once_date: {
        type: DataTypes.DATEONLY
    },
    send_end_date_reminders: {
        type: DataTypes.INTEGER
    },
    server_location: {
        type: DataTypes.STRING
    },
    survey_url: {
        type: DataTypes.STRING
    },
    set_billing: {
        type: DataTypes.INTEGER
    },
    site_label_1: {
        type: DataTypes.STRING
    },
    site_label_2: {
        type: DataTypes.STRING
    },
    site_label_3: {
        type: DataTypes.STRING
    },
    site_label_4: {
        type: DataTypes.STRING
    },
    site_label_5: {
        type: DataTypes.STRING
    },
    site_label_6: {
        type: DataTypes.STRING
    },
    sms_templates: {
        type: DataTypes.STRING
    },
    config_smtp_password: {
        type: DataTypes.STRING
    },
    config_smtp_host: {
        type: DataTypes.STRING
    },
    config_smtp_from_username: {
        type: DataTypes.STRING
    },
    config_smtp_port: {
        type: DataTypes.STRING
    },
    config_smtp_secure: {
        type: DataTypes.STRING
    },
    config_smtp_from_email: {
        type: DataTypes.STRING
    },
    config_smtp_username: {
        type: DataTypes.STRING
    },
    state: {
        type: DataTypes.STRING
    },
    state_shipping: {
        type: DataTypes.STRING
    },
    stripe_api_key: {
        type: DataTypes.STRING
    },
    stripe_currency: {
        type: DataTypes.STRING
    },
    supplier_list: {
        type: DataTypes.STRING
    },
    surcharge_code: {
        type: DataTypes.INTEGER
    },
    surcharge_label: {
        type: DataTypes.STRING
    },
    surcharge_rate: {
        type: DataTypes.DECIMAL
    },
    surcharge_sku: {
        type: DataTypes.STRING
    },
    tax_name: {
        type: DataTypes.STRING
    },
    tax_rate: {
        type: DataTypes.DECIMAL
    },
    termsandconds: {
        type: DataTypes.TEXT
    },
    test_serial_no: {
        type: DataTypes.INTEGER
    },
    total_for_customer_chart: {
        type: DataTypes.DOUBLE
    },
    trading_as: {
        type: DataTypes.STRING
    },
    use_bond: {
        type: DataTypes.INTEGER
    },
    use_checkbox: {
        type: DataTypes.INTEGER
    },
    use_defaultEmailInvoices: {
        type: DataTypes.TINYINT
    },
    use_long_term: {
        type: DataTypes.STRING
    },

    use_rate_calculator: {
        type: DataTypes.STRING
    },
    use_surcharge: {
        type: DataTypes.TINYINT
    },
    use_surcharge_always: {
        type: DataTypes.TINYINT
    },
    registration_api_key: {
        type: DataTypes.STRING
    },
    registration_license: {
        type: DataTypes.STRING
    },
    registration_version: {
        type: DataTypes.STRING
    },
    use_terms: {
        type: DataTypes.STRING
    },
    use_pro_rata: {
        type: DataTypes.INTEGER
    },
    use_meterage: {
        type: DataTypes.INTEGER
    },
    use_stock_allocation: {
        type: DataTypes.TINYINT
    },
    website: {
        type: DataTypes.STRING
    },
    weight: {
        type: DataTypes.STRING
    },
    weekly_billing_days: {
        type: DataTypes.INTEGER
    },
    no_show_unit_price: {
        type: DataTypes.TINYINT
    },
    no_extra_panel: {
        type: DataTypes.TINYINT
    },
    xero_active: {
        type: DataTypes.INTEGER
    },
    build_version: {
        type: DataTypes.STRING
    }, updated_at: {
        type: DataTypes.NOW
    },
    created_at: {
        type: DataTypes.DATE
    },
    updated_by: {
        type: DataTypes.STRING
    },
    created_by: {
        type: DataTypes.STRING,
    }
},
    {
        tableName: 'administration',
        timestamps: false
    });
module.exports = Administration;