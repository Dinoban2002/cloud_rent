const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const userSession = sequelize.define('user_session',{
    __user_session_id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _staff_id_fk:{
        type: DataTypes.INTEGER,
    },
    _company_id_fk:{
        type: DataTypes.INTEGER,
    },
    active:{
        type: DataTypes.TINYINT
    },
    login_time:{
        type: DataTypes.DATE
    },
    logout_time:{
        type: DataTypes.DATE
    },
    created_at:{
        type: DataTypes.DATE
    }
},{
    tableName: 'user_session',
    timestamps: false
});
module.exports = userSession;