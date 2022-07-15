const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Site = sequelize.define('site', {
  // Model attributes are defined here
  __site_id_pk  : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    _company_id_fk:{
        type: DataTypes.INTEGER
    },
    _client_id_fk:{
        type: DataTypes.INTEGER
    },
    address:{
        type: DataTypes.STRING
    },
    billing_address:{
        type: DataTypes.STRING
    },
    notes:{
        type: DataTypes.STRING
    },
    option1:{
        type: DataTypes.STRING
    },
    option2:{
        type: DataTypes.STRING
    },
    option3:{
        type: DataTypes.STRING
    },
    option4:{
        type: DataTypes.STRING
    },
    option5:{
        type: DataTypes.STRING
    },
    option6:{
        type: DataTypes.STRING
    },
    post_code:{
        type: DataTypes.STRING
    },
    site_name:{
        type: DataTypes.STRING
    },
    state:{
        type: DataTypes.STRING
    },
    suburb:{
        type: DataTypes.STRING
    },
    is_deleted:{
        type: DataTypes.TINYINT
    },
    created_by:{
        type: DataTypes.INTEGER
    },
    updated_by:{
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'site',
    timestamps: false
});

module.exports = Site;