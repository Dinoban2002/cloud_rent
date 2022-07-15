const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const InventoryRateDetails = sequelize.define('inventory_rate_detail', {
    // Model attributes are defined here
    __inventory_rate_detail_id_pk : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _inventory_rate_id_fk: {
        type: DataTypes.INTEGER,
        validate: {
            isInt: true,
        }
    },
    _rate_config_id_fk: {
        type: DataTypes.INTEGER,
        validate: {
            isInt: true,
        }
    },
    min: {
        type: DataTypes.DOUBLE,
        validate: {
            isDecimal: true,
        }
    },
    max: {
        type: DataTypes.DOUBLE,
        validate: {
            isDecimal: true,
        }
    },
    price: {
        type: DataTypes.DECIMAL,
        validate: {
            isDecimal: true,
        }
    },
    is_normal: {
        type: DataTypes.TINYINT,
        validate: {
            isInt: true,
        }
    },
    is_extra: {
        type: DataTypes.TINYINT,
        validate: {
            isDecimal: true,
        }
    }
}, {
    tableName: 'inventory_rate_detail',
    timestamps: false
});

module.exports = InventoryRateDetails;