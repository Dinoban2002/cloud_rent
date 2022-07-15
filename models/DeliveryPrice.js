const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const DeliveryPrice = sequelize.define('delivery_price', {
    __delivery_price_id_pk  : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _company_id_fk:{
        type: DataTypes.INTEGER,
    },
    city:{
        type: DataTypes.STRING,
    },
    collection_rate_a:{
        type: DataTypes.DOUBLE,
    },
    collection_rate_b:{
        type: DataTypes.DOUBLE,
    },
    collection_rate_c:{
        type: DataTypes.DOUBLE,
    },
    collection_rate_d:{
        type: DataTypes.DOUBLE,
    },
    delivery_rate_a:{
        type: DataTypes.DOUBLE,
    },
    delivery_rate_b:{
        type: DataTypes.DOUBLE,
    },
    delivery_rate_c:{
        type: DataTypes.DOUBLE,
    },
    delivery_rate_d:{
        type: DataTypes.DOUBLE,
    },
    state:{
        type: DataTypes.STRING,
    },
    zip:{
        type: DataTypes.STRING,
    },
    updated_at: {
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
    tableName: 'delivery_price',
    timestamps: false
});
module.exports = DeliveryPrice;