const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const ConfigBusiness = sequelize.define('config_business', {
    __business_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    account_code:{
        type: DataTypes.STRING
    },
    bank_name:{
        type: DataTypes.STRING
    },
    bank_account_name:{
        type: DataTypes.STRING
    },
    bank_account_bsb:{
        type: DataTypes.INTEGER
    },
    bank_account_number:{
        type: DataTypes.STRING
    },
    _company_id_fk: {
        type: DataTypes.INTEGER
    },
    company: {
        type: DataTypes.STRING
    },
    consumer_key:{
        type: DataTypes.STRING
    },
    consumer_secret:{
        type: DataTypes.STRING
    },
    company_id_quickbook:{
        type: DataTypes.STRING
    },
    consumer_key_quickbook:{
        type: DataTypes.STRING
    },
    consumer_secret_quickbook:{
        type: DataTypes.STRING
    },
    quickbook_intuit_url:{
        type: DataTypes.STRING
    },
    quickbook_is_sandbox:{
        type: DataTypes.TINYINT
    },
    quickbooks_active:{
        type: DataTypes.INTEGER
    },
    company_id_myob:{
        type: DataTypes.STRING
    },
    consumer_key_myob:{
        type: DataTypes.STRING
    },
    consumer_secret_myob:{
        type: DataTypes.STRING
    },
    myob_active:{
        type: DataTypes.TINYINT
    },
    quickbook_access_expiry_date:{
        type: DataTypes.DATE
    },
    private_key:{
        type: DataTypes.TEXT
    },
    public_key:{
        type: DataTypes.TEXT
    },
    token_expiration_xero:{
        type: DataTypes.DATE
    },
    is_integrapay_enabled:{
        type: DataTypes.TINYINT
    },
    integrapay_invoice_text:{
        type: DataTypes.TEXT
    },
    is_xero_active: {
        type: DataTypes.INTEGER
    },
    trading_as: {
        type: DataTypes.STRING
    },
    company_no: {
        type: DataTypes.STRING
    },
    file_ref:{
        type: DataTypes.STRING
    },
    office_phone: {
        type: DataTypes.STRING
    },
    after_hours: {
        type: DataTypes.STRING
    },
    office_email: {
        type: DataTypes.STRING
    },
    website: {
        type: DataTypes.STRING
    },
    address: {
        type: DataTypes.STRING
    },
    city: {
        type: DataTypes.STRING
    },
    state: {
        type: DataTypes.STRING
    },
    business_type:{
        type: DataTypes.STRING
    },
    period:{
        type: DataTypes.DOUBLE
    },
    inventory_label_1:{
        type: DataTypes.STRING
    },
    inventory_label_2:{
        type: DataTypes.STRING
    },
    inventory_label_3:{
        type: DataTypes.STRING
    },
    inventory_label_4:{
        type: DataTypes.STRING
    },
    inventory_label_5:{
        type: DataTypes.STRING
    },
    inventory_label_6:{
        type: DataTypes.STRING
    },
    inventory_label_7:{
        type: DataTypes.STRING
    },
    inventory_label_8:{
        type: DataTypes.STRING
    },
    contract_label:{
        type: DataTypes.STRING
    },
    invoice_label:{
        type: DataTypes.STRING
    },
    site_label_1:{
        type: DataTypes.STRING
    },
    site_label_2:{
        type: DataTypes.STRING
    },
    site_label_3:{
        type: DataTypes.STRING
    },
    site_label_4:{
        type: DataTypes.STRING
    },
    site_label_5:{
        type: DataTypes.STRING
    },
    site_label_6:{
        type: DataTypes.STRING
    },
    test_serial_no:{
        type: DataTypes.INTEGER
    },
    zip: {
        type: DataTypes.STRING
    },
    country: {
        type: DataTypes.STRING
    },
    country_code: {
        type: DataTypes.STRING
    },
    warehouse_address: {
        type: DataTypes.STRING
    },
    warehouse_city: {
        type: DataTypes.STRING
    },
    warehouse_state: {
        type: DataTypes.STRING
    },
    warehouse_zip: {
        type: DataTypes.STRING
    },
    use_trading_name:{
        type: DataTypes.TINYINT,
        defaultValue: 0,
    },
    is_show_bank_details:{
        type: DataTypes.TINYINT,
        defaultValue: 1,
    },
    is_main_business:{
        type: DataTypes.TINYINT,
        defaultValue: 0,
    },
    is_deleted:{
        type: DataTypes.TINYINT,
        defaultValue: 0,
    },
    is_show_bank_details:{
        type: DataTypes.TINYINT,
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
    updated_at: {
        type: DataTypes.DATE
    }
},
    {
        tableName: 'config_business',
        timestamps: false
    });

module.exports = ConfigBusiness;