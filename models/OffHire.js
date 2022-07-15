const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const OffHire = sequelize.define('off_hire', {
  // Model attributes are defined here
  __off_hire_id_pk : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    }, 
    _client_id_fk:{
        type: DataTypes.INTEGER,
    },
    _inventory_id_fk:{
        type: DataTypes.INTEGER,
    },
    _invoice_item_id_fk:{
        type: DataTypes.INTEGER,
    },
    _rental_id_fk:{
        type: DataTypes.INTEGER,
    },
    _rental_item_id_fk:{
        type: DataTypes.INTEGER,
    },
    _staff_id_fk:{
        type: DataTypes.INTEGER,
    },
    billed:{
        type: DataTypes.TINYINT,
    },
    billing_cycle:{
        type: DataTypes.STRING,
    },
    billing_date_end:{
        type: DataTypes.DATE,
    },
    billing_date_start:{
        type: DataTypes.DATE,
    },
    comments:{
        type: DataTypes.STRING,
    },
    creation_date:{
        type: DataTypes.DATE,
    },
    creation_time:{
        type: DataTypes.TIME,
    },
    days:{
        type: DataTypes.INTEGER,
    },
    item_name:{
        type: DataTypes.STRING,
    },
    panels:{
        type: DataTypes.INTEGER,
    },
    price:{
        type: DataTypes.INTEGER,
    },
    pro_rata_percent:{
        type: DataTypes.INTEGER,
    },
    qty_in:{
        type: DataTypes.INTEGER,
    },
    qty_out:{
        type: DataTypes.INTEGER,
    },
    rate:{
        type: DataTypes.STRING,
    },
    return_contact:{
        type: DataTypes.STRING,
    },
    return_count:{
        type: DataTypes.INTEGER,
    },
    return_date:{
        type: DataTypes.DATE,
    },
    sku:{
        type: DataTypes.STRING,
    },
    summary:{
        type: DataTypes.STRING,
    },
    is_stand_down:{
        type: DataTypes.TINYINT,
    }
}, {
    tableName: 'off_hire',
    timestamps: false
});

module.exports = OffHire;