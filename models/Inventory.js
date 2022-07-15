const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Inventory = sequelize.define('inventory', {
    // Model attributes are defined here
    __inventory_id_pk: {
        type: DataTypes.INTEGER,
        validate: {
            isNumeric: true,
        },
        autoIncrement: true,
        primaryKey: true,
        get() {
            const rawValue = this.getDataValue("__inventory_id_pk");
            if (rawValue) {
                return rawValue.toString().padStart(6, '0');
            } else {
                return "";
            }

        }
    },
    _inventory_quickbook_id_fk: {
        type: DataTypes.INTEGER,
    },
    _inventory_xero_id_fk: {
        type: DataTypes.INTEGER,
    },
    _company_id_fk: {
        type: DataTypes.INTEGER,
    },
    _item_type_id_fk: {
        type: DataTypes.INTEGER,
    },
    account_code: {
        type: DataTypes.STRING
    },
    allocation_balance_remaining: {
        type: DataTypes.INTEGER,
    },
    barcode_image: {
        type: DataTypes.STRING
    },
    barcode_text: {
        type: DataTypes.STRING
    },
    bin_no: {
        type: DataTypes.STRING
    },
    bond: {
        type: DataTypes.INTEGER,
    },
    brand: {
        type: DataTypes.STRING
    },
    category: {
        type: DataTypes.STRING
    },
    certificate: {
        type: DataTypes.STRING
    },
    code: {
        type: DataTypes.INTEGER,
    },
    company_name: {
        type: DataTypes.STRING
    },
    company_name_two: {
        type: DataTypes.STRING
    },
    company_name_three: {
        type: DataTypes.STRING
    },
    container_advert: {
        type: DataTypes.STRING
    },
    cost: {
        type: DataTypes.DOUBLE,
    },
    depot_stock: {
        type: DataTypes.TEXT,
    },
    depot_stock_two: {
        type: DataTypes.INTEGER,
    },
    depot_stock_three: {
        type: DataTypes.INTEGER,
    },
    description: {
        type: DataTypes.STRING
    },
    fee1: {
        type: DataTypes.INTEGER,
    },
    fee2: {
        type: DataTypes.INTEGER,
    },
    fee3: {
        type: DataTypes.INTEGER,
    },
    file_1_container: {
        type: DataTypes.STRING
    },
    file_2_container: {
        type: DataTypes.STRING
    },
    file_3_container: {
        type: DataTypes.STRING
    },
    file_4_container: {
        type: DataTypes.STRING
    },
    file_container: {
        type: DataTypes.STRING
    },
    generated_url: {
        type: DataTypes.STRING
    },
    image: {
        type: DataTypes.STRING
    },
    image_container: {
        type: DataTypes.STRING
    },
    image_data_label: {
        type: DataTypes.STRING
    },
    image_name: {
        type: DataTypes.STRING
    },
    image_url: {
        type: DataTypes.STRING
    },
    is_banner: {
        type: DataTypes.TINYINT,
    },
    is_featured: {
        type: DataTypes.TINYINT,
    },
    is_latest: {
        type: DataTypes.TINYINT,
    },
    is_track_serial_no: {
        type: DataTypes.TINYINT,
    },
    is_showinweb: {
        type: DataTypes.TINYINT,
    },
    is_showpricedescription: {
        type: DataTypes.TINYINT,
    },
    is_not_track_inventory: {
        type: DataTypes.TINYINT,
    },
    is_updated: {
        type: DataTypes.TINYINT,
    },
    item: {
        type: DataTypes.STRING
    },
    label_incltax: {
        type: DataTypes.INTEGER,
    },
    length: {
        type: DataTypes.DOUBLE,
    },
    location: {
        type: DataTypes.STRING
    },
    loss: {
        type: DataTypes.DOUBLE,
    },
    loss_qty: {
        type: DataTypes.INTEGER,
    },
    manufacturer: {
        type: DataTypes.STRING
    },
    model_no: {
        type: DataTypes.STRING
    },
    notes: {
        type: DataTypes.STRING
    },
    orders: {
        type: DataTypes.INTEGER,
    },
    on_hand: {
        type: DataTypes.TINYINT,
    },
    price: {
        type: DataTypes.DOUBLE,
    },
    price_label: {
        type: DataTypes.STRING
    },
    prompt: {
        type: DataTypes.STRING
    },
    quickbook_asset_account_id: {
        type: DataTypes.STRING
    },
    quickbook_created_by: {
        type: DataTypes.STRING
    },
    quickbook_created_date: {
        type: DataTypes.DATE,
    },
    quickbook_expense_account_id: {
        type: DataTypes.STRING
    },
    quickbook_income_account_id: {
        type: DataTypes.STRING
    },
    quickbook_modified_by: {
        type: DataTypes.STRING
    },
    quickbook_modified_date: {
        type: DataTypes.DATE,
    },
    quickbook_push_status: {
        type: DataTypes.STRING
    },
    quickbook_is_updated: {
        type: DataTypes.TINYINT,
    },
    quickbook_sync_token: {
        type: DataTypes.INTEGER,
    },
    reorder_level: {
        type: DataTypes.INTEGER,
    },
    reorder: {
        type: DataTypes.INTEGER,
    },
    replacement_cost: {
        type: DataTypes.DOUBLE,
    },
    sell: {
        type: DataTypes.DOUBLE,
    },
    size: {
        type: DataTypes.DOUBLE,
    },
    sku: {
        type: DataTypes.STRING
    },
    sold: {
        type: DataTypes.INTEGER,
    },
    spare1: {
        type: DataTypes.STRING
    },
    spare2: {
        type: DataTypes.STRING
    },
    spare3: {
        type: DataTypes.STRING
    },
    spare4: {
        type: DataTypes.STRING
    },
    spare5: {
        type: DataTypes.STRING
    },
    spare6: {
        type: DataTypes.STRING
    },
    spare7: {
        type: DataTypes.STRING
    },
    spare8: {
        type: DataTypes.STRING
    },
    starting_qty: {
        type: DataTypes.INTEGER,
    },
    stock: {
        type: DataTypes.INTEGER,
    },
    sub_rental_supplier: {
        type: DataTypes.STRING
    },
    supplier_code: {
        type: DataTypes.STRING
    },
    kf_supplier_id: {
        type: DataTypes.INTEGER,
    },
    tare_weight: {
        type: DataTypes.STRING
    },
    tax_rate: {
        type: DataTypes.DOUBLE,
    },
    taxable: {
        type: DataTypes.TINYINT,
    },
    total_inactive: {
        type: DataTypes.INTEGER,
    },
    track_serial_numbers: {
        type: DataTypes.STRING
    },
    unstored_loss: {
        type: DataTypes.DOUBLE,
    },
    unstored_rental_summary: {
        type: DataTypes.STRING
    },
    unstored_summary: {
        type: DataTypes.STRING
    },
    use_surcharge: {
        type: DataTypes.INTEGER,
    },
    unstored_base_price_incl_tax: {
        type: DataTypes.DOUBLE,
    },
    weight: {
        type: DataTypes.INTEGER,
    },
    width: {
        type: DataTypes.INTEGER,
    },
    xero_created_by: {
        type: DataTypes.STRING
    },
    xero_created_date: {
        type: DataTypes.DATE,
    },
    xero_modified_by: {
        type: DataTypes.STRING
    },
    xero_modified_date: {
        type: DataTypes.DATE,
    },
    xero_push_status: {
        type: DataTypes.STRING
    },
    xero_is_updated: {
        type: DataTypes.TINYINT,
    },
    zz__item_used_json: {
        type: DataTypes.STRING
    },
    zz__available_qty: {
        type: DataTypes.TINYINT,
    },
    is_active: {
        type: DataTypes.TINYINT,
    },
    is_deleted: {
        type: DataTypes.TINYINT,
    },
    created_by: {
        type: DataTypes.STRING
    },
    updated_by: {
        type: DataTypes.STRING
    }
},
    {
        tableName: 'inventory',
        timestamps: false
    });

module.exports = Inventory;