const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const InventoryComponent = sequelize.define('inventory_component', {
    // Model attributes are defined here
    __inventory_component_id_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _inventory_id_fk: {
        type: DataTypes.INTEGER
    },
    _parent_inventory_id_fk: {
        type: DataTypes.INTEGER,
        validate: {
            isInt: true,
        }
    },
    category: {
        type: DataTypes.STRING
    },
    description: {
        type: DataTypes.STRING
    },
    duplicates_value_list: {
        type: DataTypes.STRING
    },
    id_product: {
        type: DataTypes.STRING
    },
    is_updated: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        validate: {
            isInt: true,
        }
        
    },
    item: {
        type: DataTypes.STRING
    },
    manufacturer: {
        type: DataTypes.STRING
    },
    price: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
        validate: {
            isDecimal: true,
        }
    },
    price_label: {
        type: DataTypes.STRING
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            isDecimal: true,
        }
    },
    replacement_cost: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
        validate: {
            isDecimal: true,
        }
    },
    is_show_on_docket: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        validate: {
            isDecimal: true,
        }
    },
    sku: {
        type: DataTypes.STRING
    },
    sort_order: {
        type: DataTypes.INTEGER
    },
    taxable: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        validate: {
            isDecimal: true,
        }
    },
    track_serial_numbers: {
        type: DataTypes.STRING
    },
    type: {
        type: DataTypes.STRING
    },
    is_serialized: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        validate: {
            isDecimal: true,
        }
    },
    created_by: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            isDecimal: true,
        }
    },
    updated_by: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    created_at: {
        type: DataTypes.DATE
    },
    updated_at: {
        type: DataTypes.DATE
    }},
    {
        tableName: 'inventory_component',
        timestamps: false
    });

module.exports = InventoryComponent;