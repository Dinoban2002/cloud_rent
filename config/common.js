var columnconf = require("../config/columnmodify");
var useraccess = require("../config/useraccess");
const nodemailer = require("nodemailer");
const { Sequelize } = require('sequelize');
const { Address, Task, ConfigRate, ClientNotes, MasterCompany, InvetoryBusiness, AssetManagement, ConfigBusiness, CreditCardRate, Client, Rate, TaxRate, Terms, Upload, Rental, Administration, UserSession, Auth, Payment, RentalItems, SubRent, InvoiceItems, Invoice, Inventory, InventoryLoss, TaskResource, TaskVehicle, UserAccess } = require("../models/Model")(
    ["Address", "Task", "ConfigRate", "ClientNotes", "InvoiceItems", "AssetManagement", "InvetoryBusiness", "Invoice", "ConfigBusiness", "CreditCardRate", "Rate", "TaxRate", "Terms", "Payment", "Auth", "Rental", "Administration", "RentalItems", "SubRent", "Inventory", "MasterCompany", "Client", "Upload", "UserSession", "InventoryLoss", "TaskResource", "TaskVehicle", "UserAccess"]);
const Op = Sequelize.Op;
const sequelizeQuery = require("../config/database");
const { parsed: envs } = require('dotenv').config();
const client = require('twilio')(envs.twilio_id, envs.twilio_token);
let lang = require('../language/translate').validationMsg;
const pdf = require('./pdf');
const moment = require('moment');
const { v4 } = require("uuid");
const fs = require('fs');
const rental_fields = [
    "delivery",
    "delivery_date",
    "delivery_address",
    "delivery_time",
    "collection",
    "collection_date",
    "collection_time",
    "rental_type",
    "date",
    "flag_description",
    "flag_record",
    "function_date",
    "function_time"
];
const task_mandatory = ["__task_id_pk", "delivery_date", "delivery", "rental_type", "collection", "collection_date", "status"];
module.exports = {
    lang: lang,
    /**
     * This function is used for convert table field names 
     * @param {LTR or RTL} type 
     * @param {Records} data 
     * @param {Configed table name} tableName 
     * @param {Child table names} nested_tables 
     * @returns Converted data
     */
    transformnames: function (type, data, tableName, nested_tables = {}, user) {
        try {
            if (type !== undefined && data !== undefined && tableName !== undefined) {
                var temparr = [];
                //if ( Array.isArray(data) && data.length > 0) {
                if (Array.isArray(data)) {
                    var currgetData = data;
                }
                else if (typeof (data) === 'object') {
                    temparr.push(data);
                    var currgetData = temparr;
                }
                for (var cg = 0; cg < currgetData.length; cg++) {
                    if (currgetData[cg].constructor.name != "Object")
                        currgetData[cg] = currgetData[cg].get({ plain: true });
                    Object.entries(currgetData[cg]).forEach(([key, value]) => {
                        var typecheck;
                        if (type === 'RTL') {
                            typecheck = Object.keys(columnconf[tableName]).find(k => columnconf[tableName][k] === key);
                        }
                        else if (type === 'LTR') {
                            typecheck = columnconf[tableName][key];
                        }
                        if (typecheck !== undefined) {
                            delete currgetData[cg][key];
                            //currgetData[cg][typecheck] = value;
                            if (user && columnconf[tableName].decimal && columnconf[tableName].decimal.indexOf(typecheck) >= 0) {
                                const decimal_data = this.setDecimal(columnconf[tableName], { [typecheck]: value }, user, true);
                                currgetData[cg][typecheck] = decimal_data[typecheck];
                            } else {
                                currgetData[cg][typecheck] = value;
                            }

                            if (columnconf[tableName].thousandseparator && columnconf[tableName].thousandseparator.indexOf(typecheck) >= 0) {
                                const new_data = this.setThousandSeparator(columnconf[tableName].thousandseparator, { [typecheck]: currgetData[cg][typecheck] }, true, type);
                                currgetData[cg][typecheck] = new_data[typecheck];
                            }
                        }
                    });
                    const keys = Object.keys(nested_tables);
                    if (keys.length) {
                        for (nes_key in keys) {
                            if (currgetData[cg][keys[nes_key]]) {
                                currgetData[cg] = Object.assign(currgetData[cg], this.transformnames(type, currgetData[cg][keys[nes_key]], nested_tables[keys[nes_key]]))
                                if (typeof (currgetData[cg][keys[nes_key]]) != "string" && typeof (currgetData[cg][keys[nes_key]]) != "number") {
                                    delete currgetData[cg][keys[nes_key]];
                                }
                                //currgetData[cg][keys[nes_key]] = this.transformnames(type,currgetData[cg][keys[nes_key]],nested_tables[keys[nes_key]]);
                            }
                        }
                    }
                }
                if (temparr.length > 0) {
                    return currgetData[0];
                }
                else {
                    return currgetData;
                }
            }
        } catch (e) {
            console.log(e)
        }
    },
    /**
     * @author Bharath
     * @summary This function is used for convert fields form db to client fields and from client to db fields
     * @param {direction of convertion} type 
     * @param {input data} data 
     * @param {table name} tableName 
     * @returns converted fields
     */
    keyNamesTransform: async function (type, data, tableName) {
        try {
            if (type !== undefined && data !== undefined && tableName !== undefined) {
                for (kdt = 0; kdt < data.length; kdt++) {
                    var typecheck;
                    if (type === 'LTR') {
                        typecheck = columnconf[tableName][data[kdt]];
                    }
                    else if (type === 'RTL') {
                        typecheck = Object.keys(columnconf[tableName]).find(k => columnconf[tableName][k] === data[kdt]);
                    }
                    if (typecheck !== undefined) {
                        data.splice(kdt, 1, typecheck)
                    }
                }
                return data;
            }
        } catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    },
    /**
     * @author Kirankumar
     * @summary This function is used for convert single field(client field to db field)
     * @param {field name} data 
     * @param {table name} tableName 
     * @returns converted field
     */
    keyStringTransform: function (data, tableName) {
        try {
            if (data !== undefined && tableName !== undefined) {
                var rToLeft = Object.keys(columnconf[tableName]).find(k => columnconf[tableName][k] === data);
                if (rToLeft !== undefined) {
                    return rToLeft;
                }
                else {
                    return data;
                }
            }
        } catch (e) {
            res.status(501).send({ status: false, message: e.message });
        }
    },
    /**
     * @author Kirankumar
     * @summary This function is used for convert the number valued fields to fixed decimal value
     * @param {Data related key set name} key_set_name 
     * @param {Data} data 
     * @param {Logged in user details} user 
     * @returns data
     */
    setDecimal: function (key_set_cols, data, user, is_key = false) {
        const decimal = user.decimal || 2;
        const key_set_name = typeof key_set_cols == 'string' ? key_set_cols : key_set_cols.decimal;
        const key_set_zero_trim = key_set_cols.zero_trim_end || "";
        let key_set = [];
        if (is_key) {
            key_set = key_set_name;
        } else {
            key_set = columnconf[key_set_name] || [];
        }
        for (let key of key_set) {
            if (data[key] != undefined) {
                data[key] = parseFloat(data[key]).toFixed(decimal);
            }
        }
        if (key_set_zero_trim) {
            for (let zero_trim_key of key_set_zero_trim) {
                if (data[zero_trim_key] != undefined) {
                    if (data[zero_trim_key].match(/\./)) {
                        data[zero_trim_key] = data[zero_trim_key].replace(/\.?0*$/, "");
                    }
                }
            }
        }
        return data;
    },

    /**
     * @author JoysanJawahar
     * @summary This function is used for convert the number to thousand separator
     * @param {Data related key set name} key_set_name 
     * @param {Data} data 
     * @returns data
     */
    setThousandSeparator: function (key_set_name, data, is_key = false, type) {
        let key_set = [];
        if (is_key) {
            key_set = key_set_name;
        } else {
            key_set = columnconf[key_set_name] || [];
        }
        for (let key of key_set) {
            if (data[key] != undefined) {
                if (type == 'RTL') {
                    data[key] = data[key].toString().replace(/(\d+),(?=\d{3}(\D|$))/g, "$1");
                } else {
                    let str_decimal = (data[key].toString() || "").split(".");
                    data[key] = str_decimal[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    if (str_decimal[1]) {
                        data[key] = data[key] + "." + str_decimal[1];
                    }
                }
            }
        }
        return data;
    },

    /**
     * @author Bharath
     * @summary This function is used for verify jwt tocken
     * @param {HTTP request} req 
     * @param {HTTP responds} res 
     * @param {Socket connection} con 
     * @returns logged in user data
     */
    verfiytoken: async function (req, res, con) {
        try {
            if (req.headers.authorization && !req.headers.authorization.match("Bearer ")) {
                req.headers.authorization = "Bearer " + req.headers.authorization;
            }
            const data = await req.jwtVerify();
            const count = await UserSession.count({ where: { '__user_session_id': data.id, active: 1 } });
            if (!count) {
                if (res) {
                    res.status(401).send({ status: false, message: lang("Validation.not_log_in") });
                    return;
                } else {
                    con.socket.send(JSON.stringify({ status: false, message: lang("Validation.not_log_in") }))
                    con.end()
                    return;
                }
            }
            res.athenticated = true;
            // this.verfiyuseraccess(req, res, data);
            return data;
        } catch (e) {
            if (res) {
                res.status(401).send({ status: false, message: e.message });
                return;
            } else {
                con.socket.send(JSON.stringify({ status: false, message: e.message }))
                con.end()
                return;
            }
        }
    },

    /**
     * @author JoysanJawahar
     * @summary This function is used for verify user access to module
     * @param {HTTP request} req 
     * @param {HTTP responds} res 
     * @returns logged in user access privilege
     */
    verfiyuseraccess: async function (req, res, data) {
        try {
            let columnName;
            if (req.raw && req.raw.url && useraccess[req.raw.url] && useraccess[req.raw.url]['db_column_name']) {
                columnName = useraccess[req.raw.url]['db_column_name']
            }
            const user_access_data = await UserAccess.findOne({ where: { _staff_id_fk: data.user_id, is_deleted: 0 } });
            if (!user_access_data[columnName]) {
                return true;
            }
            else {
                res.status(401).send({ status: false, message: lang("Validation.not_access") });
                return;
            }
        } catch (e) {
            if (res) {
                res.status(401).send({ status: false, message: e.message });
                return;
            }
        }
    },

    /**
     * @deprecated 1.0.0
     * @summary Date field searching with  'equals', 'notEqual', 'greaterThan', 'greaterThanOrEqual', 'lessThan'
     * @param search_text - parameter to search value
     * @param QueryDBField - column for sql query search 
     * @param type, type of search
     * @param filterTo, To range value for search
     * @return result query string
     */
    filters_old: async function (search_text, type, filterTo = '') {
        //Op where condition options
        if (!search_text || !type) {
            return false;
        }
        switch (type) {
            case 'equals':
                return {
                    [Op.eq]: search_text
                }
            case 'notEqual':
                return {
                    [Op.ne]: search_text
                }
            case 'greaterThan':
                return {
                    [Op.gt]: search_text
                }
            case 'greaterThanOrEqual':
                return {
                    [Op.gte]: search_text
                }
            case 'Greater than or equal':
                return {
                    [Op.gte]: search_text
                }
            case 'lessThan':
                return {
                    [Op.lt]: search_text
                }
            case 'lessThanOrEqual':
                return {
                    [Op.lte]: search_text
                }
            case 'Less than or equal':
                return {
                    [Op.lte]: search_text
                }
            case 'contains_string':
                return {
                    [Op.substring]: search_text
                }
            case 'contains':
                return {
                    [Op.like]: '%' + search_text + '%'
                }
            case 'notContains':
                return {
                    [Op.notLike]: '%' + search_text + '%'
                }
            case 'startsWith':
                return {
                    [Op.startsWith]: search_text
                }
            case 'endsWith':
                return {
                    [Op.endsWith]: search_text
                }
            case 'inRange':
                if (filterTo) {
                    return {
                        [Op.between]: [search_text, filterTo]
                    }
                } else {
                    return false;
                }
            default:
                return false;
        }
    },
    /**
     * @summary Date field searching with  'equals', 'notEqual', 'greaterThan', 'greaterThanOrEqual', 'lessThan'
     * @param search_text - parameter to search value
     * @param QueryDBField - column for sql query search 
     * @param type, type of search
     * @param filterTo, To range value for search
     * @return result query string
     */
    filters: async function (search_text, type, filterTo = '') {
        //Op where condition options
        if ((search_text != "" && !search_text) || !type) {
            return false;
        }
        switch (type) {
            case 'eq':
                return {
                    [Op.eq]: search_text
                }
            case 'neq':
                return {
                    [Op.ne]: search_text
                }
            case 'gt':
                return {
                    [Op.gt]: search_text
                }
            case 'gte':
                return {
                    [Op.gte]: search_text
                }
            case 'lt':
                return {
                    [Op.lt]: search_text
                }
            case 'lte':
                return {
                    [Op.lte]: search_text
                }
            case 'isnull':
                return {
                    [Op.eq]: null
                }
            case 'isnotnull':
                return {
                    [Op.ne]: null
                }
            case 'contains_string':
                return {
                    [Op.substring]: search_text
                }
            case 'contains':
                return {
                    [Op.like]: '%' + search_text + '%'
                }
            case 'doesnotcontain':
                return {
                    [Op.notLike]: '%' + search_text + '%'
                }
            case 'startswith':
                return {
                    [Op.startsWith]: search_text
                }
            case 'endswith':
                return {
                    [Op.endsWith]: search_text
                }
            case 'isnotempty':
                return {
                    [Op.ne]: ""
                }
            case 'isempty':
                return {
                    [Op.eq]: ""
                }
            case 'multiselect':
                return {
                    [Op.in]: search_text
                }
            case 'inRange':

                if (filterTo) {
                    return {
                        [Op.between]: [search_text, filterTo]
                    }
                } else {
                    return false;
                }
            default:
                return false;
        }
    },

    /**
     * @deprecated 1.0.0
     * this function is used to create ag grid filters.
     * @param params, array of filters.
     * @param search_map, column name of the table.
     * @return json filters.
     */
    ag_grid_filter: async function (params, table, is_del = false, com_id_check = 0) {
        filter_obj = [];
        sort_term = [];
        search_term = {};
        limit = 10;
        start = 0;
        filter_obj["attributes"] = params.required ? await this.keyNamesTransform('RTL', params.required, table) : [];
        //Build sort expretion here as string
        if (params["sortModel"]) {
            for (key in params["sortModel"]) {
                const val = params["sortModel"][key];
                const st_key = await this.keyStringTransform(val.colId, table);
                if (st_key) {
                    sort_term.push([st_key, val.sort]);
                }
            }
        }
        //search cunstuct
        if (params["filterModel"]) {
            for (sc_key in params["filterModel"]) {
                const sc_val_obj = params["filterModel"][sc_key];
                sc_val_obj["filter"] = sc_val_obj["filter"] ? sc_val_obj["filter"] : sc_val_obj["dateFrom"] ? sc_val_obj["dateFrom"] : "";
                filter_to = sc_val_obj["filterTo"] ? sc_val_obj["filterTo"] : sc_val_obj["dateTo"] ? sc_val_obj["dateTo"] : "";
                const query_val = await this.filters(sc_val_obj["filter"], sc_val_obj["type"], filter_to);
                if (query_val)
                    search_term[sc_key] = query_val;
            }
        }

        if (is_del) {
            const query_val_del = await this.filters('0', "equals");
            if (query_val_del)
                search_term["is_deleted"] = query_val_del;
        }
        if (com_id_check) {
            const company_id_check = await this.filters(com_id_check, "equals");
            if (company_id_check)
                search_term["_company_id_fk"] = company_id_check;
        }

        if (params["startRow"])
            start = params["startRow"];

        if (params["endRow"])
            limit = params["endRow"] - start;

        filter_obj["order"] = sort_term;
        filter_obj["where"] = search_term;
        filter_obj["offset"] = start;
        filter_obj["limit"] = limit;
        return filter_obj;
    },
    /**
     * @deprecated 1.0.0
     * this function is used to create grid filters.
     * @param params, array of filters.
     * @param search_map, column name of the table.
     * @return json filters.
     */
    grid_filter_old: async function (data, table, is_del = false, com_id_check = 0) {
        if (!data) return {};
        var params = data ? data : {};
        filter_obj = [];
        sort_term = [];
        search_term = {};
        add_search = "";
        limit = 10;
        start = 0;
        filter_obj["attributes"] = data.required ? await this.keyNamesTransform('RTL', data.required, table) : [];
        //Build sort expretion here as string
        if (params["sort"]) {
            for (key in params["sort"]) {
                const val = params["sort"][key];
                for (st_key in val) {
                    st_val = val[st_key]
                    st_key = await this.keyStringTransform(st_key, table);
                    if (st_key) {
                        sort_term.push([st_key, st_val]);
                    }
                }
            }
        }

        if (params["search"]) {
            for (key in params["search"]) {
                const val = params["search"][key]
                for (sc_key in val) {
                    sc_val_obj = val[sc_key];
                    sc_val_obj["filter"] = sc_val_obj["filter"] ? sc_val_obj["filter"] : sc_val_obj["dateFrom"] ? sc_val_obj["dateFrom"] : "";
                    filter_to = sc_val_obj["filterTo"] ? sc_val_obj["filterTo"] : sc_val_obj["dateTo"] ? sc_val_obj["dateTo"] : "";
                    const query_val = await this.filters(sc_val_obj["filter"], sc_val_obj["type"], filter_to);
                    if (query_val)
                        sc_key = await this.keyStringTransform(sc_key, table);
                    search_term[sc_key] = query_val;
                    // if(search_map[sc_key] && preg_match("/^ca/",search_map[sc_key])) { 
                    //     add_search = add_search ? add_search+' AND '+preg_replace("/ca\./", '', queryString) : preg_replace("/ca\./", '', queryString);
                    // } 
                }
            }
        }

        if (is_del) {
            const query_val_del = await this.filters('0', "equals");
            if (query_val_del)
                search_term["is_deleted"] = query_val_del;
        }
        if (com_id_check) {
            const company_id_check = await this.filters(com_id_check, "equals");
            if (company_id_check)
                search_term["_company_id_fk"] = company_id_check;
        }

        if (params && params["start"])
            start = params["start"];

        if (params && params["skip"])
            start = params["skip"];

        if (params && params["limit"])
            limit = params["limit"];

        if (params && params["take"])
            limit = params["take"];

        filter_obj["where"] = search_term;
        filter_obj["order"] = sort_term;
        //filter_obj["add_search"] = add_search;
        filter_obj["offset"] = start;
        filter_obj["limit"] = limit;
        return filter_obj;
    },
    /**
     * this function is used to create grid filters.
     * @param params, array of filters.
     * @param search_map, column name of the table.
     * @return json filters.
     */
    grid_filter: async function (data, table, is_del = false, com_id_check = 0, date_fields = []) {
        if (!data) return {};
        var params = data ? data : {};
        filter_obj = [];
        sort_term = [];
        search_term = {};
        add_search = "";
        limit = 10;
        start = 0;
        filter_obj["attributes"] = data.required ? await this.keyNamesTransform('RTL', data.required, table) : [];
        //Build sort expretion here as string
        if (params["group"]) {
            let grouping = [];
            for (let group_col of params["group"]) {
                let dir = group_col.dir || "asc";
                if (params["sort"] && params["sort"].length) {
                    let exist_index = params["sort"].findIndex((val) => {
                        return group_col.field === val.field;
                    });
                    if (exist_index >= 0) {
                        //const sort_field = params["sort"][exist_index];
                        //dir = sort_field.dir;
                        params["sort"].splice(exist_index, 1);
                    }
                }
                grouping.push({
                    field: group_col.field,
                    dir
                })
            }
            params["sort"] = params["sort"] && params["sort"].length ? grouping.concat(params["sort"]) : grouping;
        }
        if (params["sort"]) {
            for (let val of params["sort"]) {
                const st_key = await this.keyStringTransform(val["field"], table);
                if (st_key) {
                    sort_term.push([st_key, val["dir"]]);
                }
            }
        }

        if (params["filter"] && params["filter"]["filters"] && params["filter"]["filters"].length) {
            for (let val of params["filter"]["filters"]) {
                const filter_to = "";
                if (val["field"]) {
                    if (val["is_operator_search"] && val["type"]) {
                        let query_val = "";
                        if (val["type"] == "text") {
                            query_val = await this.stringSearch(val["value"]);
                        } else if (val["type"] == "number") {
                            query_val = await this.numberSearch(val["value"]);
                        } else if (val["type"] == "date") {
                            const sc_key = await this.keyStringTransform(val["field"], table);
                            query_val = await this.constructDateSearch(sc_key, val["value"]);
                        }
                        if (query_val) {
                            const sc_key = await this.keyStringTransform(val["field"], table);
                            search_term[sc_key] = query_val;
                        }
                    } else {
                        const query_val = await this.filters(val["value"], val["operator"], filter_to);
                        if (query_val) {
                            const sc_key = await this.keyStringTransform(val["field"], table);
                            search_term[sc_key] = query_val;
                        }
                    }
                }
            }
        }

        if (is_del) {
            const query_val_del = await this.filters('0', "eq");
            if (query_val_del)
                search_term["is_deleted"] = query_val_del;
        }
        if (com_id_check) {
            const company_id_check = await this.filters(com_id_check, "eq");
            if (company_id_check)
                search_term["_company_id_fk"] = company_id_check;
        }
        if (params?.delivery == 1) {
            // check delivery date greater than from start date and less than from end date
            const val_deli_start = await this.filters(params?.start_delivery_date, "inRange", params?.end_delivery_date);
            if (val_deli_start) {
                search_term["delivery_date"] = val_deli_start;
            }
            //select only where delivery is yes(we delivery)
            const deliver_status = await this.filters('1', "eq");
            if (deliver_status) {
                search_term["is_delivery"] = deliver_status;
            }
            //select only status is not equal to QUOTE
            const type_status = await this.filters('Quote', "neq");
            if (type_status) {
                search_term["rental_type"] = type_status;
            }
            //show selected resource id
            if (params?.resource_id_list?.length) {
                const resource_id = await this.filters(params?.resource_id_list, "multiselect");
                if (resource_id) {
                    search_term["_resource_id_fk"] = resource_id;
                }
            }
            //show selected company id 
            if (params?.company_id_list?.length) {
                const selected_company_no = await this.filters(params?.company_id_list, "multiselect");
                if (selected_company_no) {
                    search_term["selected_company_no"] = selected_company_no;
                }
            }
        }
        if (params?.collection == 1) {
            // check delivery date greater than from start date 
            const val_deli_date = await this.filters(params?.start_delivery_date, "gte");
            if (val_deli_date) {
                search_term["delivery_date"] = val_deli_date;
            }
            // check collection date less than from end date
            const val_coll_date = await this.filters(params?.end_delivery_date, "lte");
            if (val_coll_date) {
                search_term["collection_date"] = val_coll_date;
            }
            //select only where collection is yes(we collect)
            const collection_status = await this.filters('1', "eq");
            if (collection_status) {
                search_term["is_collection"] = collection_status;
            }
            //select only status is not equal to QUOTE
            const type_status = await this.filters('Quote', "neq");
            if (type_status) {
                search_term["rental_type"] = type_status;
            }
            //show selected resource id
            if (params?.resource_id_list?.length) {
                const resource_id = await this.filters(params?.resource_id_list, "multiselect");
                if (resource_id) {
                    search_term["_resource_id_fk"] = resource_id;
                }
            }
            //show selected company id 
            if (params?.company_id_list?.length) {
                const selected_company_no = await this.filters(params?.company_id_list, "multiselect");
                if (selected_company_no) {
                    search_term["selected_company_no"] = selected_company_no;
                }
            }
        }
        if (params?.service == 1) {
            const val_date_start = await this.filters(params?.start_delivery_date, "inRange", params?.end_delivery_date);
            if (val_date_start) {
                search_term["date_start"] = val_date_start;
            }

            if (params?.vehicle_list?.length) {
                const select_vehicle = await this.filters(params?.vehicle_list, "multiselect");
                if (select_vehicle) {
                    search_term["vehicle"] = select_vehicle;
                }
            }

            const isNotDeliver = await this.filters('1', "neq");
            if (isNotDeliver) {
                search_term["is_delivery"] = isNotDeliver;
            }

            const isNotCollection = await this.filters('1', "neq");
            if (isNotCollection) {
                search_term["is_collection"] = isNotCollection;
            }
        }
        if (params?.viewAll == 1) {
            const val_date_start = await this.filters(params?.start_delivery_date, "inRange", params?.end_delivery_date);
            if (val_date_start) {
                search_term["date_start"] = val_date_start;
            }
        }


        if (params && params["skip"])
            start = params["skip"];

        if (params && params["take"])
            limit = params["take"];

        filter_obj["where"] = search_term;
        filter_obj["order"] = sort_term;
        //filter_obj["add_search"] = add_search;
        filter_obj["offset"] = start;
        filter_obj["limit"] = limit;
        return filter_obj;
    },
    //this function filter task for pdf
    grid_filter_task: async function (data, table, is_del = false, com_id_check = 0, date_fields = []) {
        if (!data) return {};
        var params = data ? data : {};
        filter_obj = [];
        sort_term = [];
        search_term = {};
        add_search = "";
        limit = 100;
        start = 0;
        filter_obj["attributes"] = data.required ? await this.keyNamesTransform('RTL', data.required, table) : [];
        //Build sort expretion here as string
        if (params["group"]) {
            let grouping = [];
            for (let group_col of params["group"]) {
                let dir = "asc";
                if (params["sort"] && params["sort"].length) {
                    let exist_index = params["sort"].findIndex((val) => {
                        return group_col.field === val.field;
                    });
                    if (exist_index >= 0) {
                        const sort_field = params["sort"][exist_index];
                        dir = sort_field.dir;
                        params["sort"].splice(exist_index, 1);
                    }
                }
                grouping.push({
                    field: group_col.field,
                    dir
                })
            }
            params["sort"] = params["sort"] && params["sort"].length ? grouping.concat(params["sort"]) : grouping;
        }
        if (params["sort"]) {
            for (let val of params["sort"]) {
                const st_key = await this.keyStringTransform(val["field"], table);
                if (st_key) {
                    sort_term.push([st_key, val["dir"]]);
                }
            }
        }

        if (params["filter"] && params["filter"]["filters"] && params["filter"]["filters"].length) {
            for (let val of params["filter"]["filters"]) {
                const filter_to = "";
                if (val["field"]) {
                    if (val["is_operator_search"] && val["type"]) {
                        let query_val = "";
                        if (val["type"] == "text") {
                            query_val = await this.stringSearch(val["value"]);
                        } else if (val["type"] == "number") {
                            query_val = await this.numberSearch(val["value"]);
                        } else if (val["type"] == "date") {
                            const sc_key = await this.keyStringTransform(val["field"], table);
                            query_val = await this.constructDateSearch(sc_key, val["value"]);
                        }
                        if (query_val) {
                            const sc_key = await this.keyStringTransform(val["field"], table);
                            search_term[sc_key] = query_val;
                        }
                    } else {
                        const query_val = await this.filters(val["value"], val["operator"], filter_to);
                        if (query_val) {
                            const sc_key = await this.keyStringTransform(val["field"], table);
                            search_term[sc_key] = query_val;
                        }
                    }
                }
            }
        }

        if (is_del) {
            const query_val_del = await this.filters('0', "eq");
            if (query_val_del)
                search_term["is_deleted"] = query_val_del;
        }
        if (com_id_check) {
            const company_id_check = await this.filters(com_id_check, "eq");
            if (company_id_check)
                search_term["_company_id_fk"] = company_id_check;
        }

        if (params && params["skip"])
            start = params["skip"];

        if (params && params["take"])
            limit = params["take"];

        filter_obj["where"] = search_term;
        filter_obj["order"] = sort_term;
        //filter_obj["add_search"] = add_search;
        filter_obj["offset"] = start;
        filter_obj["limit"] = limit;
        return filter_obj;
    },
    /**
     * number field searching with  '>', '>=', '<', '<=', '...'
     * @param $searchField - parameter to search
     * @return result query string
     */
    numberSearch: async function ($searchField) {
        if (!$searchField) {
            return '';
        }
        //search with '>', '>=', '<', '<=', '...'
        const regex = /(>=|<=)|(\.{3})|[><]|=|\*/;
        $newSearchField = $searchField.replace(regex, '');
        if ($newSearchField != "") {
            $output_array = $searchField.match(regex) || [];
            if ($output_array[0] == '...') {
                if ($searchField.match(/^\.{3}/)) {
                    // Ex: ...100
                    return { [Op.lte]: $newSearchField }
                }
                else if ($searchField.match(/\.{3}$/)) {
                    // Ex: 100...
                    return { [Op.gte]: $newSearchField }
                }
                const values = $searchField.split("...");
                if (values && values.length > 1) {
                    return {
                        [Op.between]: [values[0], values[1]]
                    }
                } else {
                    return { [Op.eq]: $searchField }
                }
            } else if ($output_array[0] == '>=') {
                return { [Op.gte]: $newSearchField }
            } else if ($output_array[0] == '<=') {
                return { [Op.lte]: $newSearchField }
            } else if ($output_array[0] == '>') {
                return { [Op.gt]: $newSearchField }
            } else if ($output_array[0] == '<') {
                return { [Op.lt]: $newSearchField }
            } else if ($output_array[0] == '=' && $newSearchField) {
                return { [Op.eq]: $newSearchField }
            } else {
                return { [Op.eq]: $searchField };
            }
        } else if ($searchField == "*") {
            return { [Op.and]: [{ [Op.ne]: "" }, { [Op.ne]: null }, { [Op.ne]: 0 }] }
        } else if ($searchField == "=") {
            return { [Op.or]: ["", null, 0] }
        } else {
            return { [Op.eq]: $searchField };
        }
    },

    /**
     * @author Kirankumar
     * @summary Function to convert the text field query search '=', '*', '*.*', ! etc.. like FileMaker
     * @summary Any changes to this function to be discussed with @author Linga<linga@tigeen.ch>
     * @param $searchField - text to search
     * @param $QueryDBField - column for sql query search 
     * @return $searchSet String of where condition
     */
    stringSearch: async function ($searchField) {
        if (!$searchField) {
            return '';
        }
        let $isSearchNotApplied = false;
        if ($searchField.length == 1) {
            if ($searchField == '*') {
                return {
                    [Op.and]: [{
                        [Op.ne]: "",
                    },
                    {
                        [Op.ne]: null,
                    }
                    ]
                }
            }
            else if ($searchField == '=') {
                return { [Op.or]: ["", null] }
            }
            // else if($searchField == '!'){
            //     return 'count(' . $QueryDBField . ') > 1 '; // Duplicates
            // }
            else {
                $isSearchNotApplied = true;
            }
        }
        else {
            $searchField = $searchField.replace(/(?<!\\\\)([*])/, '.*'); // Negative lookbehind. Replace * with .* but should not replace when \*
            $searchField = $searchField.replace(/\'/, '\\\''); // Replace ' with \'
            if ($searchField.match(/^\=\=.*/)) {
                // When the search value starts with ==
                $searchField = $searchField.replace(/\=\=/, '');
                if (!$searchField) {
                    return { [Op.or]: ["", null] }; // Searched only ==
                }
                else {
                    return { [Op.regexp]: '[[:<:]]' + $searchField + '[[:>:]]' };// Full word match
                    //return $QueryDBField . ' REGEXP \'[[:<:]]' . $this->substituteAscents($searchField) .'[[:>:]]\' '; // Full word match
                }
            }
            else if ($searchField.match(/^\=.*/)) {
                // When the search value starts with =
                $searchField = $searchField.replace(/\=/, '');
                if (!$searchField) {
                    return { [Op.or]: ["", null] };
                }
                else {
                    $isSearchNotApplied = true;
                }
            }
            else {
                $isSearchNotApplied = true;
            }
        }
        let $searchSet = '';
        if ($isSearchNotApplied) {
            const words_filters = [];
            const $searchWords = $searchField.split(/\s/); // Splitting with space
            for ($searchWord of $searchWords) {
                if ($searchWord) {
                    words_filters.push({ [Op.regexp]: '[[:<:]]' + $searchWord })
                    //$searchSet = empty($searchSet) ? ($QueryDBField . ' REGEXP \'[[:<:]]' . $this->substituteAscents($searchWord) . '\' ') : ($searchSet . ' AND ' . ($QueryDBField . ' REGEXP \'[[:<:]]' . $this->substituteAscents($searchWord) . '\' '));
                }
            }
            if (words_filters.length) {
                $searchSet = { [Op.and]: words_filters }
            }
        }

        return $searchSet;
    },

    /**
     * date field searching with formats '>', '>=', '<', '<=', '...', 1.*.19, *.1.19, *.*.19, 1.*.*, 1.01.*, *.*.*, 2019
     * @param $searchField - parameter to search
     * @param $QueryDBField - column for sql query search 
     * @return result searches
     */
    constructDateSearch: async function ($QueryDBField, $searchField) {
        let conditions = $searchField.match(/^(\<|\>)\=?/gm, $searchField) || [];
        $filtered = $searchField.replace(/^(\<|\>)\=?/gm, '');
        $timestamp = $filtered.replace(/(-|\.)/gm, '/');
        date_array = $timestamp.split("/") || [];

        if ($searchField == '*') {
            return {
                [Op.and]: [{
                    [Op.ne]: "",
                },
                {
                    [Op.ne]: "0000-00-00",
                },
                {
                    [Op.ne]: null,
                }]
            }
        }
        else if ($searchField == '=') {
            return { [Op.or]: ["", "0000-00-00", null] }
        } else if (date_array.length == 3) {
            $date = date_array[2] + "-" + date_array[1] + "-" + date_array[0];
            if (date_array[0] == "*" && date_array[1] == "*" && date_array[2] == "*") {
                return {
                    [Op.and]: [{
                        [Op.ne]: "",
                    },
                    {
                        [Op.ne]: "0000-00-00",
                    },
                    {
                        [Op.ne]: null,
                    }]
                }
            } else if (date_array[0] == "*" && date_array[1] == "*") {
                //$qry_date = ' YEAR('.$QueryDBField.')=' .'"' . date_array[1] . '" AND MONTH('.$QueryDBField.')=' .'"' . date_array[0] . '"';
                return Sequelize.where(Sequelize.fn('YEAR', Sequelize.col($QueryDBField)), date_array[2])
            } else if (date_array[1] == "*" && date_array[2] == "*") {
                return Sequelize.where(Sequelize.fn('DAY', Sequelize.col($QueryDBField)), date_array[0])
            } else if (date_array[0] == "*" && date_array[2] == "*") {
                return Sequelize.where(Sequelize.fn('MONTH', Sequelize.col($QueryDBField)), date_array[1])
            } else if (date_array[0] == "*") {
                return {
                    [Op.and]: [
                        Sequelize.where(Sequelize.fn('YEAR', Sequelize.col($QueryDBField)), date_array[2]),
                        Sequelize.where(Sequelize.fn('MONTH', Sequelize.col($QueryDBField)), date_array[1]),
                    ]
                }
            } else if (date_array[1] == "*") {
                return {
                    [Op.and]: [
                        Sequelize.where(Sequelize.fn('YEAR', Sequelize.col($QueryDBField)), date_array[2]),
                        Sequelize.where(Sequelize.fn('DAY', Sequelize.col($QueryDBField)), date_array[0]),
                    ]
                }
            } else if (date_array[2] == "*") {
                return {
                    [Op.and]: [
                        Sequelize.where(Sequelize.fn('MONTH', Sequelize.col($QueryDBField)), date_array[1]),
                        Sequelize.where(Sequelize.fn('DAY', Sequelize.col($QueryDBField)), date_array[0]),
                    ]
                }
            } else if (conditions.length > 0) {
                //return ' DATE('.$QueryDBField.')' . conditions[0] . '"' . $date . '"';
                if (conditions[0] == ">=") {
                    return { [Op.gte]: $date }
                } else if (conditions[0] == "<=") {
                    return { [Op.lte]: $date }
                } else if (conditions[0] == ">") {
                    return { [Op.gt]: $date }
                } else if (conditions[0] == "<") {
                    return { [Op.lt]: $date }
                } else {
                    return { [Op.eq]: $date };
                }
            } else {
                return { [Op.eq]: $date };
            }
        } else if (conditions && conditions.length > 0) {
            // When searching with >=2020 or <2020 for example.
            if (date_array.length == 3) {
                $date = date_array[2] + "-" + date_array[1] + "-" + date_array[0];
            }
            else if (date_array.length == 2) {
                if (conditions[0] == '<' || conditions[0] == '>=') {
                    // Example, <01.2020 means <01.01.2020 OR >= 2020 means >= 01.01.2020
                    $date = date_array[1] + "-" + date_array[0] + "-01";
                }
                else if (conditions[0] == '>' || conditions[0] == '<=') {
                    // Example, >01.2020 means >31.01.2020 OR <=01.2020 means <=31.01.2020
                    $date = date_array[1] + "-" + date_array[0] + "-01";
                    $date = await this.get_last_date_of_month($date); // Last day of the month
                }
                else {
                    $date = date_array[1] + "-" + date_array[0] + "-01";
                }
            }
            else {
                if (conditions[0] == '<' || conditions[0] == '>=') {
                    // Example, <2020 means <01.01.2020 OR >= 2020 means >= 01.01.2020
                    $date = date_array[0] + "-01-01";
                }
                else if (conditions[0] == '>' || conditions[0] == '<=') {
                    // Example, >2020 means >31.12.2020 OR <=2020 means <=31.12.2020
                    $date = date_array[0] + "-12-31";
                }
                else {
                    $date = date_array[0] + "-01-01";
                }
            }
            if (conditions[0] == ">=") {
                return { [Op.gte]: $date }
            } else if (conditions[0] == "<=") {
                return { [Op.lte]: $date }
            } else if (conditions[0] == ">") {
                return { [Op.gt]: $date }
            } else if (conditions[0] == "<") {
                return { [Op.gte]: $date }
            } else {
                return { [Op.eq]: $date };
            }
        } else {
            if ($searchField.match(/\.{3}/)) {
                // Handle the date format given by ranges (Ex: 1.1.16...31.1.16)
                $timestamp = $searchField.split(/\.{3}/);
                if ($timestamp.length == 2) {
                    $timestamp[0] = $timestamp[0].replace(/(-|\.)/gm, '/');
                    $timestamp[1] = $timestamp[1].replace(/(-|\.)/gm, '/');

                    date_array1 = $timestamp[0].split("/");
                    date_array2 = $timestamp[1].split("/");
                    $btw_date1 = $btw_date2 = '';

                    if (date_array1.length == 3) {
                        $btw_date1 = date_array1[2] + "-" + date_array1[1] + "-" + date_array1[0];
                    }
                    else if (date_array1.length == 2) {
                        $btw_date1 = date_array1[1] + "-" + date_array1[0] + "-01";
                    }
                    else if (date_array1.length == 1 && date_array1[0]) {
                        $btw_date1 = date_array1[0] + "-01-01";
                    } else {
                        $btw_date1 = "1970-01-01";
                    }

                    if (date_array2.length == 3) {
                        $btw_date2 = date_array2[2] + "-" + date_array2[1] + "-" + date_array2[0];
                    }
                    else if (date_array2.length == 2) {
                        $btw_date2 = date_array2[1] + "-" + date_array2[0] + "-01";
                        $btw_date2 = await this.get_last_date_of_month($btw_date2);// Get the last day of the month and put
                    }
                    else {
                        if (!date_array2[0]) {
                            $btw_date2 = '9999-12-31';
                        }
                        else {
                            $btw_date2 = date_array2[0] + "-12-31";
                        }
                    }
                    return { [Op.between]: [$btw_date1, $btw_date2] };
                    //return ' '.$QueryDBField .' BETWEEN "'. $btw_date1 .'" AND "'.$btw_date2.'"';
                }
                else {
                    return { [Op.eq]: $searchField };
                    //return ' DATE('.$QueryDBField.')= "' . $searchField . '"';
                }
            } else {
                $timestamp = $searchField.replace(/(-|\.)/, '/');
                date_array = $timestamp.split("/");
                $qry_date = '';
                if (date_array.length == 3) {
                    return { [Op.eq]: date_array[2] + "-" + date_array[1] + "-" + date_array[0] };
                    //$qry_date = ' DATE('.$QueryDBField.')="' . date_array[2]."-".date_array[1]."-".date_array[0] . '"';
                }
                else if (date_array.length == 2) {
                    //$qry_date = ' YEAR('.$QueryDBField.')=' .'"' . date_array[1] . '" AND MONTH('.$QueryDBField.')=' .'"' . date_array[0] . '"';
                    return {
                        [Op.and]: [
                            Sequelize.where(Sequelize.fn('YEAR', Sequelize.col($QueryDBField)), date_array[1]),
                            Sequelize.where(Sequelize.fn('MONTH', Sequelize.col($QueryDBField)), date_array[0]),
                        ]
                    }
                }
                else {
                    //$qry_date = ' YEAR('.$QueryDBField.')=' .'"' . $searchField . '"';
                    return Sequelize.where(Sequelize.fn('YEAR', Sequelize.col($QueryDBField)), date_array[0])
                }
            }
        }
    },
    /**
     * @author Kirankumar
     * @summary This function is used for get the last date of a month
     * @param {Date} date 
     * @returns last date of month
     */
    get_last_date_of_month: async function (date) {
        var date = new Date(date),
            y = date.getFullYear(),
            m = date.getMonth();
        return new Date(y, m + 1, 0);
    },
    /**
    * Function to get all possible ascents (i.e with special charcters) in order make multibyte search on word boundaries
    * @param $searchField is text that is typed by user
    * @return multibyte formatted value to be applied in word boundaries of a query
    * Example : Linga => L[iïìî]ng[aäàâ]
    **/
    //  substituteAscents: function ($searchField) {
    //     $searchField = mb_eregi_replace ( 'a|ä|à|â|á' , '[aäàâá]' , $searchField );
    //     $searchField = mb_eregi_replace ( 'e|ë|è|ê|é' , '[eëèêé]' , $searchField );
    //     $searchField = mb_eregi_replace ( 'i|ï|ì|î|í' , '[iïìîí]' , $searchField );
    //     $searchField = mb_eregi_replace ( 'o|ö|ò|ô|ó|õ' , '[oöòôóõ]' , $searchField );
    //     $searchField = mb_eregi_replace ( 'u|ü|ù|û' , '[uüùû]' , $searchField );
    //     $searchField = mb_eregi_replace ( 'n|ñ' , '[nñ]' , $searchField );
    //     $searchField = mb_eregi_replace ( 'c|ç' , '[cç]' , $searchField );
    //     $searchField = mb_eregi_replace ( '\o\e|œ' , '(oe|œ)' , $searchField );
    //     return $searchField;
    // }

    /**
     * this function is used to get the end row of data.
     * @param start, start count.
     * @param limit, expected count of records.
     * @param total_count, total count of records
     * @return Int -1 or count of records.
     */
    get_end_row: async function (start, limit, total_count) {
        if (typeof start == 'number' && typeof limit == 'number') {
            var count = start + limit;
            if (count >= total_count) {
                return total_count;
            } else {
                return -1;
            }
        } else {
            return total_count;
        }
    },
    /**
     * This function is used for create distinct filter
     * @param {Field name} key 
     * @returns Sequelize column filter query
     */
    getDistinct: function (key) {
        return [Sequelize.fn('DISTINCT', Sequelize.col(key)), key];
    },
    /**
     * @author Kirankumar
     * @summary This function is used for format the address
     * @param {*} address client address
     * @param {*} companyId company id
     * @returns formated address for company.
     */
    format_address: async function (address, companyId) {
        var is_valid = false;
        var format = await MasterCompany.findAll({ raw: true, attributes: ['address_full'], where: { __company_id_pk: companyId } });
        format = (format.length > 0) ? format[0].address_full : "{address1}, {zip}-{city}, {country}";
        if (format) {
            Object.entries(address).forEach(([key, value]) => {
                value = value ? value : " ";
                var keyVal = value.toString().replace(/^(\s)*/g, "");
                if (format.match(new RegExp('{' + key + '}')) && !keyVal) {
                    format = format.replace(new RegExp('{' + key + '}(,\\s|-|\.)?'), "");
                }
                if (keyVal && format.match(new RegExp('{' + key + '}'))) {
                    is_valid = true;
                    format = format.replace(new RegExp('{' + key + '}'), keyVal);
                }
            })
            format = format.replace(/(,\s|,|-|\.)+$/g, "");
            return is_valid ? format : "";
        }
    },
    /**
     * This function is used for check row exist or not
     * @param {*} table table name
     * @param {*} field column name
     * @param {*} value column value
     * @returns count of recors
     */
    check_item_exist: async function (table, field, value) {
        var check_record = await Client.count({ where: { [field]: value } })
        return check_record;
    },

    /**
     * this function for send messages mobile
     * @param to_number, To phone number
     * @param msg_body, message body content
     * @return (json text)twilio responds.
     */
    send_message: async function (to_number, msg_body) {
        // Download the helper library from https://www.twilio.com/docs/node/install
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        try {
            const sms_res = await client.messages.create({
                body: msg_body,
                from: envs.twilio_no,
                to: to_number
            });
            return sms_res;
        } catch (e) {
            return e;
        }
    },

    /**
     * This function is usefull to send the mail.
     * @param config, mail smtp config.
     * @param to, to mail address.
     * @param body, mail body.
     * @param subject, mail subject.
     * @param cc, cc mail address
     * @param files, attachments
     * @param inline_images, inline images
     * @param textBody, mail text body content
     * @return Status or error messages.
     */
    send_email: async function (config, to, body = '', subject = '', cc = '', files = [], inline_images = [], textBody = '', rental_id = 0) {
        //try {
        let mail_keys = JSON.parse(envs.mail_verify_key);
        const to_mail_adds = to.split(/,|;/);
        let to_mail_adds_for_send = '';
        let is_invalid_email = true;
        let val_data = {};
        for (to_mail_add of to_mail_adds) {
            let mail_validation = {};
            if (is_invalid_email) {
                for (mail_key of mail_keys) {
                    val_data = await this.check_mail_address(to_mail_add, mail_key);
                    if (val_data.code != 402) {
                        break;
                    }
                }
                if (val_data.body && val_data.body.result && val_data.body.result == "valid" && val_data.body.did_you_mean == "" && is_invalid_email) {
                    is_invalid_email = false;
                }
            }
            to_mail_adds_for_send += to_mail_adds_for_send ? ", " + to_mail_add : to_mail_add;
        }
        if (is_invalid_email && Object.keys(val_data).length) {
            return -1;
        }
        //config
        let transporter = nodemailer.createTransport({
            host: config.config_smtp_host,
            port: config.config_smtp_port,
            secure: config.config_smtp_secure == 465 ? true : false, // true for 465, false for other ports
            auth: {
                user: config.config_smtp_username, // generated ethereal user
                pass: config.config_smtp_password, // generated ethereal password
            },
        });
        let message = {};
        let from = config.config_smtp_from_username ? '"' + config.config_smtp_from_username + '" <' + config.config_smtp_from_email + '>' : config.config_smtp_from_email;
        message.from = from;
        message.to = to_mail_adds_for_send;
        if (cc) {
            message.cc = cc.replace(";", ", ");
        }
        message.subject = subject;
        if (textBody)
            message.text = textBody;
        message.html = body;
        let attachments = [];
        if ((inline_images && inline_images.length) || files.length) {
            inline_images = inline_images.concat(files);
            const inline_files = await Upload.findAll({ raw: true, attributes: [["file_name", "filename"], ["file_path", "path"], ["name_ref", "cid"]], where: { name_ref: inline_images } });
            attachments = inline_files;
        }
        if (attachments.length) {
            attachments = attachments.filter(item => {
                try {
                    if (fs.existsSync(item.path)) {
                        return true;
                    } else {
                        return false;
                    }
                } catch (err) {
                    return false;
                }
            })
            message.attachments = attachments;

        }
        // send mail with defined transport object
        let info = await transporter.sendMail(message);
        if (info.response.match(/ok/i)) {
            if (rental_id) {
                await Rental.update({ emailed_on: new Date(), emailed_by: user.username }, { where: { __rental_id_pk: rental_id } });
            }
            return true;
        } else {
            return false;
        }
        // } catch (e) {
        //     return false;
        // }
    },

    /**
     * not in use
     * @param {*} to 
     * @param {*} mail_key 
     */
    check_mail_address_old: async function (to, mail_key) {
        var quickemailverification = require('quickemailverification').client(mail_key).quickemailverification(); // Replace API_KEY with your API Key
        // Email address which need to be verified
        const data = await quickemailverification.verify(to, async (err, respons) => {
            return respons || err;
        });
    },
    /**
     * This function is used for ceck the email address is valid or not
     * @param {to email address} to 
     * @param {api keys} mail_key 
     * @returns mail response 
     */
    check_mail_address: async function (to, mail_key) {
        return new Promise(function (resolve, reject) {
            var quickemailverification = require('quickemailverification').client(mail_key).quickemailverification(); // Replace API_KEY with your API Key
            // Email address which need to be verified
            quickemailverification.verify(to, async (err, respons) => {
                if (err) {
                    resolve(err);
                } else {
                    resolve(respons);
                }
            });
        })
    },

    /**
     * This function is used to update all table data
     * @param {HTTP request} req 
     * @param {Logged in user data} user 
     * @returns status and updated data
     */
    create_update_table: async function (body, user, Model, table, pk) {
        let data = {};
        let stock_data = {};
        if (body) {
            let item = this.transformnames('RTL', body, table, {}, user);
            if (Model.rawAttributes.compeny_id) {
                item.compeny_id = user.company_id;
            } else if (Model.rawAttributes._company_id_fk) {
                item._company_id_fk = user.company_id;
            }

            if (item[pk]) {
                item.updated_by = user.user_id;
                const where = {};
                where[pk] = item[pk]
                if (Model.rawAttributes.is_deleted) {
                    where.is_deleted = 0;
                }
                const count = await Model.count({ where });
                if (!count)
                    return { status: false, message: lang('Validation.record_not_exist', user.lang) }
                await Model.update(item, { where });
                data = await Model.findOne({ attributes: Object.keys(item), where });
            } else {

                if (Model.rawAttributes.serial_no && Model.rawAttributes._company_id_fk) {
                    let serial_count = await Model.count({ where: { _company_id_fk: user.company_id } });
                    serial_count = serial_count + 1;
                    item.serial_no = serial_count;
                }
                if (Model.rawAttributes._staff_id_fk) {
                    item._staff_id_fk = user.user_id;
                }
                item.created_at = new Date();
                item.created_by = user.user_id;
                data = await Model.create(item);
            }
            if (Model.rawAttributes._inventory_id_fk) {
                const where = {};
                where[pk] = data[pk]
                const inv = await Model.findOne({ attributes: ["_inventory_id_fk"], where })
                if (inv && inv._inventory_id_fk) {
                    stock_data = await this.updateStock(inv._inventory_id_fk)

                }
            } else if (data.__inventory_id_pk) {
                stock_data = await this.updateStock(data.__inventory_id_pk)
            }
            data = this.transformnames('LTR', data, table, {}, user);
            if (Object.keys(stock_data).length) {
                data = { ...data, ...stock_data }
            }
            delete data.company_id
            delete data.updated_by
            return { status: true, data }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    },
    /**
     * This function is used to add date format to column names for DB
     * @param {column names} attributes 
     * @param {Date column names} columns 
     * @param {date format} format 
     * @returns attributes
     */
    setDateFormat: function (attributes, columns, format = "%d-%m-%Y") {
        for (attr_key in attributes) {
            if (columns.indexOf(attributes[attr_key]) >= 0) {
                attributes[attr_key] = [Sequelize.fn('date_format', Sequelize.col(attributes[attr_key]), format), attributes[attr_key]]
            }
        }
        return attributes;
    },
    /**
     * @author Kirankumar
     * @summary This function is used for update the the stock of Inventory
     * @param {inventory id} inventory_id 
     * @returns updated data
     */
    updateStock: async function (inventory_id) {
        const total_inactive = await AssetManagement.count({ where: { active: 0, _inventory_id_fk: inventory_id } })
        const loss = await InventoryLoss.sum("qty", { where: { _inventory_id_fk: inventory_id } }) || 0;
        const rental_qty = await RentalItems.sum("qty", { where: { _inventory_id_fk: inventory_id } }) || 0;
        const inv_qty = await InvoiceItems.sum("qty", { where: { _inventory_id_fk: inventory_id, type: "POS" } }) || 0;
        const data = await Inventory.findOne({ attributes: ["orders", "_item_type_id_fk", "starting_qty"], where: { __inventory_id_pk: inventory_id } })
        let stock = 0;
        if (data) {
            const start = data.starting_qty || 0;
            const inactive = total_inactive || 0;
            //const loss = data.loss_qty || 0;
            if (data._item_type_id_fk == 3) {
                //3 means SELL
                stock = start - (rental_qty + inv_qty);
            } else if (data._item_type_id_fk == 4) {
                //4 means SERVICE
                stock = start;
            } else {
                stock = (start - inv_qty) - (loss + inactive)
            }
            const update_data = { on_hand: stock, loss_qty: loss, total_inactive };
            await Inventory.update(update_data, { where: { __inventory_id_pk: inventory_id } });
            return update_data;
        } else {
            return {};
        }

    },
    /**
     * @author Kirankumar
     * @summary This function will calculate invoice data
     * @param {Invoice id} invoice_id 
     * @param {Logged in user data} user 
     * @returns Void
     */
    calculate_invoice_update: async function (invoice_id, user, can_update = false, return_inv_no = false) {

        let calculated_data = { invoice_id };
        Invoice.belongsTo(TaxRate, { targetKey: '__tax_rate_id_pk', foreignKey: '_tax_rate_id_fk' });
        let data = await Invoice.findOne({
            raw: true, where: { __invoice_id_pk: invoice_id }, include: [{
                model: TaxRate,
                attributes: ["percentage"]
            }]
        });
        if (!data) {
            return {};
        }
        data.invoice_item = await InvoiceItems.findAll({ raw: true, where: { _invoice_id_fk: invoice_id } })
        data = await this.transformnames('LTR', data, "Invoice", { InvoiceItems: "invoice_item" });
        const amount_paid = await Payment.sum("payment_amount", { where: { _invoice_id_fk: invoice_id } })
        calculated_data.amount_paid = parseFloat(amount_paid);
        data.amount_paid = amount_paid;
        let invoice_items = [];
        let discount = 0, subtotal = 0, tax = 0, summary = 0;
        let { discount_cash, surcharge, bond, freight, date_start, date_end, delivery_charge, meterage_charge, collection_charge } = data;
        tax_rate = data["tax_rate.percentage"] <= 1 ? parseFloat(data["tax_rate.percentage"] || 0) : parseFloat(data["tax_rate.percentage"]) / 100;
        const credit_card_data = data.credit_card_rate_id ? await CreditCardRate.findOne({ where: { __credit_card_rate_id_pk: data.credit_card_rate_id } }) : {};
        let credit_card_rate = credit_card_data.card_percentage >= 1 ? (credit_card_data.card_percentage / 100) : (credit_card_data.card_percentage || 0);
        delete data["tax_rate.percentage"];
        bond = parseFloat(bond) || 0;
        surcharge = surcharge || 0;
        discount_cash = Number(discount_cash) || 0;
        let items_discount_amount = 0, items_amount = 0;
        let taxable_amount = 0;
        if (data.invoice_item) {
            invoice_items = data.invoice_item;
            delete data.invoice_item;
            for (let i = 0; i < invoice_items.length; i++) {
                let item = invoice_items[i];
                let discount_amount = 0;
                let item_amount = 0;
                let { qty, units, unit_price, taxable, discount_rate, metres } = item;
                discount_rate = discount_rate >= 1 ? (discount_rate / 100) : discount_rate;
                if (units > 0) {
                    discount_amount = (qty * unit_price * units) * discount_rate;
                } else {
                    discount_amount = (qty * unit_price) * discount_rate;
                }
                if (meterage_charge == 1 && !metres && units <= 0) {
                    item_amount += (unit_price * qty) - discount_amount;
                } else if (meterage_charge == 1 && !metres && units >= 1) {
                    item_amount += (unit_price * qty * units) - discount_amount;
                } else if (meterage_charge == 1 && metres && units >= 1) {
                    item_amount += (unit_price * metres * qty * units) - discount_amount;
                } else if (meterage_charge == 1 && metres && units <= 0) {
                    item_amount += (unit_price * metres * qty) - discount_amount;
                } else if (units > 0) {
                    item_amount += (unit_price * qty * units) - discount_amount;
                } else if (units < 0) {
                    item_amount += (unit_price * qty) - discount_amount;
                }
                items_amount += item_amount;
                if (taxable) {
                    taxable_amount += item_amount;
                }
                items_discount_amount += Number(discount_amount);
                item = this.transformnames('RTL', item, "InvoiceItems");
                if (item.__invoice_item_id_pk) {
                    await InvoiceItems.update(item, { where: { __invoice_item_id_pk: item.__invoice_item_id_pk } });
                }
            }
        }
        discount = items_discount_amount + discount_cash;

        //xero_active need to check here from business need to check with linga
        const xero_active = 0;
        if (xero_active) {
            if (!data.items.length && !delivery_charge) {
                subtotal = 0;
            } else {
                subtotal = items_amount + bond + freight + surcharge - discount_cash;
            }
        } else {
            subtotal = items_amount + bond + freight + surcharge - discount_cash;
        }

        // if(!delivery_charge){
        //     subtotal = Math.round((items_amount + bond + delivery_charge+collection_charge + surcharge - discount_cash)/0.05)*0.05;
        // }
        if (credit_card_rate) {
            if (((subtotal - bond) * credit_card_rate) >= 0) {
                credit_card_charge = Math.round(((subtotal - bond) * credit_card_rate) / 0.05) * 0.05;
            } else {
                credit_card_charge = - Math.round((Math.abs((subtotal - bond)) * credit_card_rate) / 0.05) * 0.05;
            }
        } else {
            credit_card_charge = 0;
        }
        if (tax_rate) {
            tax = Math.round(((taxable_amount + credit_card_charge + delivery_charge + collection_charge - discount_cash) * tax_rate) / 0.05, 0) * 0.05;
        }
        // if (!data.summary) {
        //     data.summary = "Rental Period: " + date_start + " - " + date_end;
        //     calculated_data.summary = data.summary;
        // }

        data.total = subtotal + tax + credit_card_charge;
        calculated_data.balance = parseFloat(data.total - amount_paid);
        data.balance = calculated_data.balance;
        data.status = "";
        calculated_data.discount = parseFloat(discount);
        calculated_data.subtotal = parseFloat(subtotal);
        calculated_data.total = parseFloat(data.total);
        const diff_days = Math.round((new Date(new Date().getFullYear() + "-" + (new Date().getMonth() + 1).toString().padStart(2, 0) + "-" + new Date().getDate()) - new Date(data.due_date)) / (1000 * 60 * 60 * 24));
        if (diff_days < 0 && data.total != amount_paid) {
            data.status = "NOT DUE";
        } else if ((amount_paid != 0 || data.type == "CREDIT NOTE") && data.total <= amount_paid) {
            data.status = "PAID";
        } else if (diff_days == 0 && data.total != amount_paid) {
            data.status = "UNPAID";
        } else if (diff_days >= 0) {
            data.status = "UNPAID OVERDUE";
        }
        calculated_data.status = data.status;
        data = this.transformnames('RTL', data, "Invoice");
        data.updated_by = user.user_id;
        if (can_update)
            await Invoice.update(data, { where: { __invoice_id_pk: invoice_id } });

        if (data._rental_id_fk) {
            if (can_update) {
                //calculated_data.stepper = await this.update_stepper(data._rental_id_fk);
                calculated_data.rental_calculated_data = await this.auto_update_or_calculate_rental(data._rental_id_fk, true, user, true);
            }
        }
        calculated_data.tax = tax;
        calculated_data.credit_card_charge = credit_card_charge;
        calculated_data = this.setDecimal("invoice_cal", calculated_data, user)
        calculated_data = this.setThousandSeparator("invoice_cal", calculated_data)
        if (invoice_id && can_update) {
            let client_id = await Invoice.sum("_client_id_fk", { where: { __invoice_id_pk: invoice_id } });
            await this.client_calculations(client_id, user, true);
        }
        if (return_inv_no)
            calculated_data.invoice_id_no = data.invoice_id_no;
        return calculated_data;
        //const responds = await getInvoice(0, req.params.invoice_id);
        //res.status(200).send(responds);
    },

    /**
     * @author Kirankumar
     * @summary This function is used for get invoice data by client id or rental id or invoice id
     * @param {Rental id} rental_id 
     * @param {Invoice id} invoice_id 
     * @param {Client id} client_id 
     * @returns Status and List of invoice data
     */
    getInvoice: async function (rental_id = 0, invoice_id = 0, client_id = 0, user, can_update = false) {
        let where_con = {};
        let invoice_calculated_data = "";
        let rental_calculated_data = {};
        if (invoice_id && can_update) {
            invoice_calculated_data = await this.calculate_invoice_update(invoice_id, user, can_update);
            const rental_id = await Invoice.sum("_rental_id_fk", { where: { __invoice_id_pk: invoice_id } });
            if (rental_id)
                rental_calculated_data = await this.auto_update_or_calculate_rental(rental_id, true, user, true);
        }
        if (rental_id) {
            where_con = { _rental_id_fk: rental_id, _task_id_fk: 0 };
        } else if (invoice_id) {
            where_con = { __invoice_id_pk: invoice_id };
        } else if (client_id) {
            where_con = { _client_id_fk: client_id };
        } else {
            return { status: false, data: [] }
        }
        let attributes = ["_tax_rate_id_fk", "__invoice_id_pk", "_company_id_fk", "_task_id_fk", "_invoice_quickbook_id_fk", "_invoice_xero_id_fk", "_client_id_fk", "_inventory_id_fk", "_rental_id_fk", "_staff_id_fk", "_credit_card_rate_id_fk", "age_of_invoice_stored", "amount_tendered", "amount_due_xero", "amount_paid_xero", "bond", "collection_charge", "comments", "credit_card_rate", "credit_card_charge", "credit_note_invoice_id", "creation_timestamp", "currency_code_xero", "currency_rate_xero", "date", "date_closed", "date_end", "date_payment", "date_reminder_sent", "date_start", "date_month", "date_year", "delivery_charge", "delivery_charge_tax", "delivery_method", "delivery_notes", "discount_cash", "discount_selector", "disp_amount_paid", "disp_balance", "disp_company", "disp_total", "due_date", "invoice_no", "invoice_json", "invoice_number_xero", "invoice_type_xero", "invoice_url", "invoice_type", "is_created_from_xero", "is_updated", "is_updated_q", "is_xero_id_manual", "key_payment_repetition", "key__pos", "key_pos", "key_product_list", "line_amount_types_xero", "line_items_json", "meterage_charge", "method", "month", "month_name", "payment_amount", "payment_method", "payments", "process_invoice", "quickbook_created_by", "quickbook_created_date", "quickbook_currency_code", "quickbook_currency_rate", "quickbook_modified_by", "quickbook_modified_date", "quickbook_push_status", "quickbook_sync_token", "reference_xero", "selected_company_no", "sent_on", "staff_member", "sub_total_xero", "summary", "surcharge", "status", "tax_name", "tax_rate_label", "tax_rate_label_2", "temp_id_payment", "temp_applied", "temp_applied_last", "terms", "total_all_sql", "total_tax_xero", "total", "type", "xero_created_by", "zz_constant_zero", "xero_created_date", "xero_modified_by", "xero_modified_date", "xero_push_status", "xero_status", "year", "tax", "invoice_id_no"]
        attributes = this.setDateFormat(attributes, ["date"], user.date_format);
        Invoice.belongsTo(Auth, { targetKey: '__staff_id_pk', foreignKey: 'created_by' })
        var invoice_data = await Invoice.findAll({
            attributes, where: where_con, include: {
                model: Auth,
                attributes: ["display_staff_name"]
            }
        });
        if (!invoice_data) {
            return { status: true, data: [] };
        }
        invoice_data = this.transformnames('LTR', invoice_data, "Invoice", { staff: "Auth" }, user);
        for (let key in invoice_data) {
            const incoice_id = invoice_data[key].invoice_id;
            var invoice_item_data = await InvoiceItems.findAll({ raw: true, where: { _invoice_id_fk: incoice_id } });
            invoice_item_data = this.transformnames('LTR', invoice_item_data, "InvoiceItems", {}, user);
            invoice_data[key].invoice_items = invoice_item_data;
            invoice_data[key].invoice_calculated_data = invoice_calculated_data || await this.calculate_invoice_update(incoice_id, user, can_update);
            invoice_data[key].invoice_calculated_data.rental_calculated_data = rental_calculated_data;
            invoice_data[key].balance = invoice_data[key].invoice_calculated_data.balance;
        }
        return { status: true, data: invoice_data };
    },
    /**
     * @author Kirankumar
     * @summary This functio used to get rental data by rental id
     * @param {HTTP ressponds} res 
     * @param {Rental id} rental_id 
     * @param {Logged in user data} user 
     * @returns status and Rental data
     */
    getRentalData: async function (rental_id, user) {
        let client_get = ["name_full", "account_customer", "account_name", "email", ["parent_id", "contact_parent_id"]];
        let address_get = ["address1", "city", "state", "country", "zip", "is_active", "is_billing", "is_delivery"]
        Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
        Rental.belongsTo(Address, { targetKey: '__address_id_pk', foreignKey: '_address_id_fk' });
        Rental.belongsTo(Terms, { targetKey: '__config_term_id_pk', foreignKey: '_config_term_id_fk' });
        let rental_get = await Rental.findOne({ attributes: { exclude: ["updated_by", "created_at", "updated_at"] }, where: { is_deleted: 0, _company_id_fk: user.company_id, __rental_id_pk: rental_id }, include: [{ model: Client, attributes: client_get }, { model: Terms }, { model: Address, attributes: address_get }] })
        rental_get = await this.transformnames('LTR', rental_get, "Rental", { address: "Address", client: "Client" });
        if (rental_get) {
            //rental_get[0].address = [];
            // let temp_add = {};
            // temp_add['address_id'] = rental_get[0].address_id;
            // temp_add['address'] = rental_get[0].address1;
            // temp_add['city'] = rental_get[0].city;
            // temp_add['state'] = rental_get[0].state;
            // temp_add['country'] = rental_get[0].country;
            // temp_add['zip'] = rental_get[0].zip;
            // temp_add['is_billing'] = rental_get[0].is_billing;
            // temp_add['is_active'] = rental_get[0].is_active;
            // temp_add['is_delivery'] = rental_get[0].is_delivery;
            // rental_get[0].address.push(temp_add);
            //Notes
            let get_notes = await ClientNotes.findAll({ order: [['__client_notes_id_pk', 'DESC']], attributes: [["__client_notes_id_pk", "rental_notes_id"], "notes", "created_at", "created_by"], where: { _rental_id_fk: rental_id } })
            for (let gtn = 0; gtn < get_notes.length; gtn++) {
                let get_notes_staff = await Auth.findOne({ raw: true, attributes: ["display_staff_name"], where: { __staff_id_pk: get_notes[gtn].created_by, is_deleted: 0 } })
                get_notes[gtn].created_by = get_notes_staff ? get_notes_staff.display_staff_name : "";
            }
            rental_get.notes = get_notes;
            let rental_staff_name = await Auth.findOne({ raw: true, attributes: ["display_staff_name"], where: { __staff_id_pk: rental_get.created_by, is_deleted: 0 } })
            if (rental_staff_name) {
                rental_get.display_staff_name = rental_staff_name.display_staff_name;
            }
            //Items
            let get_data_item = ["__rental_item_id_pk", "_rental_item_id_fk", "_rate_config_id_fk", "is_asset_no_added", "asset_no", "file_ref", "_client_id_fk", "_inventory_id_fk", "_project_id_fk", "_rental_id_fk", "account_code", "amount", "bin_no", "category", "date", "date_end", "discount_rate", "header", "hours_in", "hours_out", "hours_total", "hours_used", "isfromweb", "item", "item_serialised", "jobstatus", "last_service_hours", "level", "lineitemserial", "metre_charge", "metres", "off_hire_cost", "off_hire_date", "off_hire_period", "orders", "prorata_cost", "prorata_date", "prorata_period", "qty", "quantity_dispatched", "replacement_cost", "resource", "service_period", "servicestatus", "sku", "sort", "source", "sub_item", "sub_rent", "sub_rental_cost", "taxable", "time_end", "time_start", "total_price", "type", "unit_price", "unit_type", "units", "year", "is_header", "is_details"]
            let get_items = await RentalItems.findAll({ order: [["sort", "ASC"]], attributes: get_data_item, where: { _rental_id_fk: rental_id } })
            rental_get.item = await this.transformnames('LTR', get_items, "RentalItems");
            //rental_get.item = get_items;
            //rental_get.stepper = await update_stepper(rental_id);
            //rental_get = await calculate_rental_data(rental_get, user, rental_id)
            rental_get.rental_calculated_data = await this.auto_update_or_calculate_rental(rental_id, false, user, false)
            return { status: true, data: rental_get }
        }
        else {
            return { status: false }
        }
    },
    /**
     * @author Kirankumar
     * @summary This function is used for update the billing detailes to rental
     * @param {rental id} rental_id 
     * @param {Logged in user details} user 
     * @returns status
     */
    update_rental_billing_dates: async function (rental_id, user) {
        Rental.belongsTo(Rate, { targetKey: '__rate_config_id_pk', foreignKey: '_rate_config_id_fk' })
        const rental = await Rental.findOne({
            where: { '__rental_id_pk': rental_id }, include: {
                model: Rate,
                attributes: ["is_hourly"]
            }
        });
        const rental_update_data = {};
        const admin = await Administration.findOne({ raw: true, attributes: ["default_billing_period", "weekly_billing_days"], where: { _company_id_fk: user.company_id } })
        if (!rental.billing_cycle) {
            rental.billing_cycle = admin.default_billing_period;
            rental_update_data.billing_cycle = admin.default_billing_period;
        }

        if (rental.billing_date_start == "0000-00-00") {
            return {};
        }
        let startDate = rental.billing_date_start;
        let endtDate = rental.date_end;
        let number = rental.billing_period_amount;
        let proRata = rental.prorata_billing;
        const period = rental.check_box_billing_set;
        let cycle = rental.billing_cycle;
        const nextMontDate = new Date(startDate).setMonth(new Date(startDate).getMonth() + 1);
        let invoiceCount = await Invoice.count({ where: { _rental_id_fk: rental.__rental_id_pk } });
        const lastDate = await this.get_last_date_of_month(startDate);
        const daysInMonth = lastDate.getDate();
        let daysInMonth2 = await this.get_last_date_of_month(nextMontDate);
        daysInMonth2 = daysInMonth2.getDate();


        let period_no = 0;
        if (cycle == "Weekly") {
            period_no = 7;
        } else if (cycle == "Fortnightly") {
            period_no = 14;
        } else if (cycle == "Monthly") {
            period_no = daysInMonth;
        } else if (cycle == "2 Monthly") {
            period_no = daysInMonth + daysInMonth2;
        }

        let amount = "";
        if (number == 1) {
            amount = 0;
        } else {
            amount = period_no;
        }

        let billing_date_end = "";
        if (rental.config_rate && rental.config_rate.is_hourly) {
            billing_date_end = rental.billing_date_start;
        } else if (period && invoiceCount == 0) {
            billing_date_end = new Date(new Date(endtDate).setDate(new Date(endtDate).getDate() + amount * number))
        } else if (proRata && cycle == "Weekly" && invoiceCount < 1) {
            billing_date_end = new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 7 - new Date(startDate).getDay()))
        } else if ((proRata && rental.billing_cycle == "Monthly") || (proRata && rental.billing_cycle == "2 Monthly" && invoiceCount < 1)) {
            billing_date_end = lastDate;
        } else if (rental.billing_cycle == "Weekly") {
            billing_date_end = new Date(new Date(startDate).setDate(new Date(startDate).getDate() + (7 * number - 1)))
        } else if (rental.billing_cycle == "Fortnightly") {
            billing_date_end = new Date(new Date(startDate).setDate(new Date(startDate).getDate() + (14 + amount * number)))
        } else if (rental.billing_cycle == "Monthly") {
            billing_date_end = new Date(new Date(startDate).setDate(new Date(startDate).getDate() + (daysInMonth - 1 + amount * number)))
        } else if (rental.billing_cycle == "2 Monthly") {
            billing_date_end = new Date(new Date(startDate).setDate(new Date(startDate).getDate() + (daysInMonth + daysInMonth2 - 1 + amount * number)));
        }
        if (rental.billing_date_start && rental.billing_date_start != "0000-00-00") {
            let term = await Terms.findOne({ where: { '__config_term_id_pk': rental._config_term_id_fk } });
            if (term) {
                const term_no = term.term_label ? parseInt(term.term_label.slice(-2)) || 0 : 0;
                if (term_no) {
                    rental_update_data.billing_due_date = new Date(new Date(rental.billing_date_start).setDate(new Date(rental.billing_date_start).getDate() + term_no));
                } else if (new Date(rental.billing_due_date) < new Date(rental.billing_date_start)) {
                    rental_update_data.billing_due_date = rental.billing_date_start;
                }
            }
        }

        rental_update_data.billing_period_no = admin.weekly_billing_days == 5 ? period_no - Math.round(period_no / 7, 0) * 2 : period_no;
        rental_update_data.billing_date_end = billing_date_end;
        rental_update_data.billing_date_next = new Date(new Date(billing_date_end).setDate(new Date(billing_date_end).getDate() + 1));
        await Rental.update(rental_update_data, { where: { __rental_id_pk: rental_id } });
        return rental_update_data;
    },
    /**
     * @author Kirankumar
     * @summary This function is used for get pdf based on action
     * @param {data} input data 
     * @param {Logged in user details} user 
     * @returns status and alert or created pdf ref id
     */
    get_pdf: async function (data, user) {
        let data_admin = await Administration.findOne({ attributes: ["company_name", "colour_palette", "pdf_date_format", "trading_as", "checkbox_use_trading_name", "bank_account_number", "bank_account_bsb", "bank_account_name", "bank_name", "credit_cards_yes_no", "currency", "postal_code_shipping", "state_shipping", "city_shipping", "address_1_shipping", "postal_code", "state", "city", "address_1", "office_phone", "office_email", "country", "company_number", "no_show_unit_price"], where: { __administration_id_pk: user.company_id } })

        if (data.action == "print_statement" && data.client_id) {
            const where = { _client_id_fk: data.client_id };
            if (data.start_date && data.end_date) {
                where.date = { [Op.and]: { [Op.gte]: data.start_date, [Op.lte]: data.end_date } }
            }
            data.admin = data_admin; //send pdf_date_format
            //invoice data
            const invoice_list = await Invoice.findAll({ where })
            if (data.start_date && data.end_date) {
                delete where.date;
                where.payment_date = { [Op.and]: { [Op.gte]: data.start_date, [Op.lte]: data.end_date } }
            }
            //payment data
            const payment_list = await Payment.findAll({ where })
            if (!invoice_list?.length && !payment_list?.length) {
                return { status: true, alert: lang('Validation.print_statement_items_not_found', user.lang) };
            }
            data.client_calculation = await this.client_calculations(data?.client_id, user);
            data.invoice_list = invoice_list;
            data.payment_list = payment_list;
            data.business_get = await this.getDefaultBusinessDetails(user?.company_id);
            return await pdf.print_statement(data, user);
        } else if (data.action == "print_inventory_item") {
            if (!data.inventory_id) {
                return { status: false, message: lang('Validation.invalid_inventory_id', user.lang) };
            }
            data.business_get = await this.getDefaultBusinessDetails(user?.company_id);
            return await pdf.print_statement(data, user);
        } else if (data.action == "print_rental_item") {
            if (!data.invoice_id) {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
            data.admin = data_admin; //send pdf_date_format
            let invoiceData = await this.getInvoice(0, data?.invoice_id, 0, user);
            if (invoiceData && invoiceData?.status == true && invoiceData?.data?.length > 0) {
                data.invoice_data = invoiceData.data[0];
                if (!data?.invoice_data?.invoice_items?.length > 0) {
                    return { status: false, message: lang('Validation.item_not_found_job', user.lang) }
                }
                if (invoiceData.data[0]) {
                    let tax_data = await this.getTaxByID(invoiceData.data[0].tax_rate_id);
                    Rental.belongsTo(Terms, { targetKey: '__config_term_id_pk', foreignKey: '_config_term_id_fk' });
                    let res_get_data = await Rental.findOne({ attributes: ["_client_id_fk", "delivery_date", "delivery_address", "selected_company_no", "delivery", "pickup", "collection"], where: { is_deleted: 0, _company_id_fk: user.company_id, __rental_id_pk: invoiceData?.data[0]?.rental_id }, include: [{ model: Terms }] })
                    res_get_data = await this.transformnames('LTR', res_get_data, "Rental");

                    // get credit card details 
                    let cardDetails = await CreditCardRate.findOne({ attributes: ["card_name", "card_percentage"], where: { __credit_card_rate_id_pk: invoiceData?.data[0]?.credit_card_rate_id } })
                    data.cardDetails = await this.transformnames('LTR', cardDetails, "CreditCardRate");

                    data.invoice_data.invoice_tax_data = tax_data;
                    if (res_get_data?.selected_company_no) {
                        data.business_get = await this.getBusinessDetails(res_get_data?.selected_company_no);
                    }
                    if (res_get_data) {
                        data.rental_data = res_get_data;
                    }
                }
                return await pdf.print_statement(data, user);
            } else {
                return { status: false, message: lang('Validation.record_not_found', user.lang) }
            }
        } else if (data.action == "print_payment") {
            if (!data.rental_id && !data.payment_id) {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
            data.admin = data_admin; //send pdf_date_format
            let payment_data = [];
            if (data.rental_id) {
                payment_data = await this.getPaymentByRentalId(data.rental_id);
            } else if (data.payment_id) {
                payment_data = await this.getPaymentByPaymentId(data.payment_id);
            }
            // get data for selected company
            if (payment_data[0]?.rental_id) {
                let address_get = ["address1", "city", "state", "country", "zip"];
                Rental.belongsTo(Address, { targetKey: '__address_id_pk', foreignKey: '_address_id_fk' });
                let rental_data = await Rental.findOne({
                    attributes: ["selected_company_no"], where: { is_deleted: 0, __rental_id_pk: payment_data[0]?.rental_id }, include: [
                        { model: Address, attributes: address_get }
                    ]
                });
                rental_data = await this.transformnames('LTR', rental_data, "Rental") || {};
                data.address = rental_data?.address || {};
                if (rental_data?.selected_company_no) {
                    data.business_get = await this.getBusinessDetails(rental_data?.selected_company_no);
                } else {
                    data.business_get = {};
                }
            }
            data.rental_payment_data = payment_data;
            if (data.rental_payment_data.length > 0) {
                return await pdf.print_statement(data, user);
            } else {
                return { status: false, message: lang('Validation.no_items_found', user.lang) };
            }
        } else if (data.action == "print_booking_docket") {
            if (!data.rental_id) {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
            data.admin = data_admin; //send pdf_date_format
            let rental_data_res = await this.getDetailByRentalId(data.rental_id, user);
            data.rental_data = rental_data_res;
            if (data.rental_data && Object.keys(data.rental_data).length > 0) {
                if (!rental_data_res?.item?.length > 0) {
                    return { status: false, message: lang('Validation.rental_item_not_found', user.lang) };
                } else {
                    return await pdf.print_statement(data, user);
                }
            } else {
                return { status: false, message: lang('Validation.record_not_found', user.lang) };
            }
        } else if (data.action == "print_service_invoice") {
            if (!data.task_id) {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
            let invoiceData = await this.getServiceInvoice(data.task_id, user);
            data.admin = data_admin; //send pdf_date_format
            if (invoiceData?.alert) {
                return invoiceData;
            } else if (invoiceData && invoiceData.status == true) {
                Rental.belongsTo(TaxRate, { targetKey: '__tax_rate_id_pk', foreignKey: '_tax_rate_id_fk' });
                Rental.belongsTo(Terms, { targetKey: '__config_term_id_pk', foreignKey: '_config_term_id_fk' });
                let rental_get = await Rental.findOne({
                    attributes: ["_client_id_fk", "bond", "selected_company_no"], where: { is_deleted: 0, _company_id_fk: user.company_id, __rental_id_pk: invoiceData?.data?.rental_id }, include: [
                        { model: TaxRate },
                        { model: Terms }
                    ]
                })
                data.rental_get = await this.transformnames('LTR', rental_get, "Rental", { tax: "TaxRate", Terms: "Terms" }) || {};
                data.service_invoice_data = invoiceData;
                if (data?.rental_get?.selected_company_no) {
                    data.business_get = await this.getBusinessDetails(data?.rental_get?.selected_company_no);
                }
                return await pdf.print_statement(data, user);
            } else {
                return { status: false, message: lang('Validation.invoice_not_create', user.lang) }
            }
        } else if (data.action == "sub_rental_report") {
            if (!data.rental_id) {
                return { status: false, message: lang('Validation.rental_id_null', user.lang) };
            }
            data.admin = data_admin; //send pdf_date_format
            let sub_rental_data = await SubRent.findAll({ attributes: { exclude: ["created_by", "updated_by", "created_at", "updated_at"] }, where: { _rental_id_fk: data.rental_id } });
            sub_rental_data = await this.transformnames('LTR', sub_rental_data, "SubRent", {}, user) || [];
            data.sub_rental_data = sub_rental_data;
            if (data.sub_rental_data.length > 0) {
                Rental.belongsTo(ConfigRate, { targetKey: '__rate_config_id_pk', foreignKey: '_rate_config_id_fk' });
                let rental_details = await Rental.findOne({ attributes: { exclude: ["updated_by", "created_at", "updated_at"] }, where: { is_deleted: 0, _company_id_fk: user.company_id, __rental_id_pk: data.rental_id }, include: [{ model: ConfigRate, attributes: ["label_name"] }] })
                rental_details = await this.transformnames('LTR', rental_details, "Rental", {}, user) || {};
                if (rental_details?.selected_company_no) {
                    data.business_get = await this.getBusinessDetails(rental_details?.selected_company_no);
                }
                data.rental_details = rental_details;
                if (Object.keys(data?.rental_details).length > 0) {
                    return await pdf.print_statement(data, user);
                } else {
                    return { status: false, message: lang('Validation.rental_details_not_found', user.lang) };
                }
            } else {
                return { status: false, message: lang('Validation.no_items_found', user.lang) };
            }
        } else if (data.action == "filter_task_invoice") {
            data.admin = data_admin; //send pdf_date_format
            data.taskDetials = await this.get_task_pdf_invoice(data, user);
            data.business_get = await this.getDefaultBusinessDetails(user?.company_id);
            return await pdf.print_statement(data, user);
        } else if (data.action == "print_pos_invoice") {
            if (!data?.invoice_id) {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
            data.admin = data_admin;
            data.business_get = await this.getDefaultBusinessDetails(user?.company_id);
            data.invoiceData = await this.getPosInvoice(data?.invoice_id, user);
            if (data?.invoiceData) {
                if (data?.invoiceData?.items?.length > 0) {
                    data.invoice_calculated_data = await this.calculate_invoice_update(data?.invoice_id, user);
                } else {
                    return { status: false, message: lang('Validation.item_not_found_job', user.lang) };
                }
            } else {
                return { status: false, message: lang('Validation.record_not_found', user.lang) };
            }
            return await pdf.print_statement(data, user);
        } else if (data.action == "print_logistic_report") {
            data.admin = data_admin; //send pdf_date_format
            data.business_get = await this.getDefaultBusinessDetails(user?.company_id);
            if (data?.start_delivery_date && data?.end_delivery_date) {
                const logisticData = await this.getLogisticDataPdf(data, user);
                let assigned = [];
                let notAssigned = [];
                if (logisticData?.length > 0) {
                    logisticData.map((dt) => {
                        if (dt?.vehicle_list?.length) {
                            assigned.push(dt);
                        } else {
                            notAssigned.push(dt);
                        }
                    });

                    let pdfResponse = [];
                    if (assigned?.length) {
                        data.logistics = assigned;
                        const assignResp = await pdf.print_statement(data, user);
                        pdfResponse.push(assignResp);
                    }
                    if (notAssigned?.length) {
                        data.logistics = notAssigned;
                        const notAssignedResp = await pdf.print_statement(data, user);
                        pdfResponse.push(notAssignedResp);
                    }
                    return pdfResponse;
                } else {
                    return { status: false, message: lang('Validation.record_not_found', user.lang) };
                }
            } else {
                return { status: false, message: lang('Validation.invalid_data', user.lang) };
            }
        }
        else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
    },


    getPosInvoice: async function (invoice_id, user) {
        Invoice.belongsTo(TaxRate, { targetKey: '__tax_rate_id_pk', foreignKey: '_tax_rate_id_fk' });
        Invoice.belongsTo(Terms, { targetKey: '__config_term_id_pk', foreignKey: 'terms' });
        let data = await Invoice.findOne({
            where: { __invoice_id_pk: invoice_id }, include: [
                {
                    model: Terms,
                    attributes: ['__config_term_id_pk', 'term_label']
                },
                {
                    model: TaxRate,
                    attributes: ["percentage", "tax_code", "tax_name"]
                }
            ]
        });
        if (data) {
            data = this.transformnames('LTR', data, "Invoice");
            const items = await InvoiceItems.findAll({ where: { _invoice_id_fk: invoice_id } });
            data.items = this.transformnames('LTR', items, "InvoiceItems") || [];
            return data;
        } else {
            return {};
        }
    },
    /**
     * @author Kirankumar
     * @summary This function is used for calculate the client invoice data
     * @param {client id} client_id 
     * @param {logged in user data} user 
     * @returns calculated data
     */
    client_calculations: async function (client_id, user, is_can_update = false) {
        const return_data = {
            to14: '0.00',
            to30: '0.00',
            to45: '0.00',
            to60: '0.00',
            plus60: '0.00',
            bal: '0.00'
        };
        if (client_id) {
            let inv = 0.00,
                cred = 0.00;
            const invoice_data = await Invoice.findAll({ attributes: ["__invoice_id_pk", "total", "type", "due_date"], where: { _client_id_fk: client_id } })
            for (let item of invoice_data) {
                const amount_paid = await Payment.sum("payment_amount", { where: { _invoice_id_fk: item.__invoice_id_pk } })
                let inv_age = 0;
                if (item.due_date && new Date(item.due_date) != "Invalid Date") {
                    inv_age = Math.floor((new Date() - new Date(item.due_date)) / (1000 * 60 * 60 * 24));
                }
                const balance = parseFloat(item.total - amount_paid).toFixed(2);
                if (inv_age >= 0 && inv_age <= 14 && amount_paid < item.total) {
                    return_data.to14 = return_data.to14 ? Number(parseFloat(return_data.to14) + parseFloat(balance)).toFixed(2) : balance;
                } else if (inv_age > 14 && inv_age <= 30 && amount_paid < item.total) {
                    return_data.to30 = return_data.to30 ? Number(parseFloat(return_data.to30) + parseFloat(balance)).toFixed(2) : balance;
                } else if (inv_age > 30 && inv_age <= 45 && amount_paid < item.total) {
                    return_data.to45 = return_data.to45 ? Number(parseFloat(return_data.to45) + parseFloat(balance)).toFixed(2) : balance;
                } else if (inv_age > 45 && inv_age <= 60 && amount_paid < item.total) {
                    return_data.to60 = return_data.to60 ? Number(parseFloat(return_data.to60) + parseFloat(balance)).toFixed(2) : balance;
                } else if (inv_age > 60 && amount_paid < item.total) {
                    return_data.plus60 = return_data.plus60 ? Number(parseFloat(return_data.plus60) + parseFloat(balance)).toFixed(2) : balance;
                }
                if (item.type != "CREDIT NOTE") {
                    inv += item.total;
                } else {
                    cred += item.total;
                }
            }
            const payment_data = await Payment.findAll({ attributes: ["__payment_id_pk", "payment_type", "payment_amount", "payment_total"], where: { _client_id_fk: client_id } })
            let paid = 0.00, ref = 0.00;
            for (let item of payment_data) {
                if (item.payment_type != "REFUND") {
                    paid += item.payment_amount;
                } else {
                    ref += item.payment_total;
                }
            }
            if (inv == paid && ref != cred) {
                return_data.bal = cred * -1;
            } else if ((inv == paid && ref == cred) || (inv != paid && cred == 0)) {
                return_data.bal = inv - paid;
            } else if (paid == 0 && cred > 0 && cred != ref) {
                return_data.bal = inv - cred;
            } else if (inv != paid && cred > 0 && cred != ref) {
                return_data.bal = inv - paid - cred
            } else if (inv != paid && cred == ref) {
                return_data.bal = inv - paid - ref;
            } else if (inv != paid && ref == cred) {
                return_data.bal = inv - paid;
            }
            return_data.bal, return_data.balance = parseFloat(return_data.bal).toFixed(2);
            return_data.total_invoice = parseFloat(inv);
            return_data.total_credit_note = parseFloat(cred);
            return_data.total_paid = parseFloat(paid);
            if (is_can_update) {
                await Client.update(return_data, { where: { __client_id_pk: client_id } });
            }
            return return_data;
        } else {
            return return_data;
        }
    },
    /**
     * @author Kirankumar
     * @summary This function is usefull to delete the object from cache data
     * @param {cache store} cache 
     * @param {key of data for delete} key 
     * @param {Logged in user details} user 
     * @param {root folder} root 
     * @returns cache json
     */
    cacheDel: function (cache, key, user, root = "") {
        let company = "company_" + user.company_id;
        if (root) {
            company = root;
        }
        let data = cache.get(company) || {};
        if (data[key]) {
            delete data[key];
            cache.set(company, data)
        }
        return cache;
    },

    /**
     * @author Kirankumar
     * @summary This function is used for update the stepper status for rental.
     * @param {Rental id} rental_id 
     * @returns Status and steppr id
     */
    update_stepper: async function (rental_id) {
        if (rental_id) {
            const rental_data = await Rental.findOne({ attributes: ["stepper", "is_quote", "is_rental"], where: { __rental_id_pk: rental_id, is_deleted: 0 } });
            let stepper = 0;
            if (rental_data) {
                if (rental_data.stepper <= 2) {
                    if (rental_data.is_quote) {
                        stepper = 1
                    }
                    if (rental_data.is_rental) {
                        stepper = 2
                    }
                }
                const logistic_count = await RentalItems.count({ where: { _rental_id_fk: rental_id, type: ["RENTAL", "KIT"] } });
                const in_count = await RentalItems.count({ where: { _rental_id_fk: rental_id, type: ["RENTAL", "KIT"], status: "IN" } });
                const invoice_count = await Invoice.count({ where: { _rental_id_fk: rental_id } })
                if ((rental_data.stepper >= 3 && rental_data.stepper < 7)) {
                    const out_count = await RentalItems.count({ where: { _rental_id_fk: rental_id, type: ["RENTAL", "KIT"], status: "OUT" } });
                    if ((out_count + in_count) == logistic_count) {
                        stepper = 4;
                    } else if (logistic_count > 0 && (out_count + in_count) != logistic_count) {
                        stepper = 3;
                    } else if (logistic_count == in_count && invoice_count > 0) {
                        stepper = 6;
                    }
                }

                if ((rental_data.stepper > 3 && rental_data.stepper < 7 && stepper != 3) || stepper == 4) {
                    if (invoice_count) {
                        stepper = 5
                    } else {
                        stepper = 4
                    }
                }

                if ((rental_data.stepper > 3 && rental_data.stepper < 7 && stepper != 4) || stepper == 5) {
                    if (in_count == logistic_count) {
                        stepper = 6;
                    }
                }

                if (rental_data.stepper >= 7) {
                    //const invoice_count = await Invoice.count({ where: { _rental_id_fk: rental_id } });
                    const invoice_paid_count = await Invoice.count({ where: { _rental_id_fk: rental_id, status: "PAID" } })
                    if (invoice_count == invoice_paid_count) {
                        stepper = 8;
                    } else {
                        stepper = 7;
                    }
                }
                stepper = stepper || rental_data.stepper;
                if (stepper != rental_data.stepper)
                    await Rental.update({ stepper }, { where: { __rental_id_pk: rental_id, is_deleted: 0 } });

                return stepper
            } else {
                return 0
            }
        } else {
            return 0
        }

    },
    /**
     * @author Kirankumar
     * @summary This function is used for update the rental auto calculation fields
     * @param {Rental id} rental_id 
     * @return Updated data.
     */
    auto_update_or_calculate_rental: async function (rental_id, update_to_rental = false, user, update_stepper = false) {
        let update_data = {}
        const decimal = user.decimal || 2;
        if (rental_id) {
            //get the rental and rental related required data with rental id.
            Rental.belongsTo(ConfigBusiness, { targetKey: '__business_id_pk', foreignKey: '_business_id_fk' });
            Rental.belongsTo(Administration, { targetKey: '_company_id_fk', foreignKey: '_company_id_fk' });
            Rental.belongsTo(TaxRate, { targetKey: '__tax_rate_id_pk', foreignKey: '_tax_rate_id_fk' });
            Rental.belongsTo(CreditCardRate, { targetKey: '__credit_card_rate_id_pk', foreignKey: '_credit_card_rate_id_fk' });
            Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
            const rental_data = await Rental.findOne({
                raw: true, where: { __rental_id_pk: rental_id, is_deleted: 0 },
                include: [
                    {
                        model: ConfigBusiness,
                        attributes: ["is_xero_active"]
                    },
                    {
                        model: Administration,
                        attributes: ["surcharge_rate", "bond_rate"]
                    },
                    {
                        model: TaxRate,
                        attributes: ["percentage"]
                    },
                    {
                        model: CreditCardRate,
                        attributes: ["card_percentage"]
                    },
                    {
                        model: Client,
                        attributes: ["pay_commision", "company_discount"]
                    }
                ]
            });
            if (!rental_data) {
                return {};
            }
            rental_data["client.pay_commision"] = parseFloat(rental_data["client.pay_commision"]) || 0;
            const client_commission = rental_data["client.pay_commision"] >= 1 ? rental_data["client.pay_commision"] / 100 : (rental_data["client.pay_commision"] || 0);
            const xero_active = rental_data["config_business.is_xero_active"] || 0;
            const surcharge_rate = rental_data["administration.surcharge_rate"] || 0;
            const tax_rate = rental_data["tax_rate.percentage"] >= 1 ? (rental_data["tax_rate.percentage"] / 100) : (rental_data["tax_rate.percentage"] || 0);
            const credit_card_rate = rental_data["credit_card_rate.card_percentage"] >= 1 ? (rental_data["credit_card_rate.card_percentage"] / 100) : (rental_data["credit_card_rate.card_percentage"] || 0);
            const rental_item_data = await RentalItems.findAll({ where: { _rental_id_fk: rental_id } });
            const cal_item = {
                taxable_amount: 0,
                total_loss: 0,
                total_balence: 0,
                total_kit: 0,
                total_subrent: 0,
                total_sales: 0,
                total_services: 0,
                items_amount: 0,
                discount_amount: 0,
                loss_cost: 0,
                commission_cost: 0,
                staff_cost: 0,
                sub_rental_cost: 0,
                sub_rental_qty: 0
            };
            let var1 = 0;
            let var2 = 0;
            let var3 = 0;
            for (curr_item of rental_item_data) {
                //sum the taxable amount from rental
                curr_item.amount = parseFloat(curr_item.amount) || 0;
                cal_item.taxable_amount += curr_item.taxable ? curr_item.amount : 0;
                cal_item.total_loss += parseFloat(curr_item.unstored_loss) || 0;
                cal_item.staff_cost += parseFloat(curr_item.total_service_cost);

                if (curr_item.type == "RENTAL") {
                    cal_item.total_balence += curr_item.amount;
                }
                if (curr_item.type == "KIT") {
                    cal_item.total_kit += curr_item.amount;
                }
                if (curr_item.type == "SUBRENT") {
                    cal_item.total_subrent += curr_item.amount;
                }
                if (curr_item.type == "SERVICE") {
                    cal_item.total_services += curr_item.amount;
                }
                if (curr_item.type == "SELL") {
                    cal_item.total_sales += curr_item.amount;
                }
                if (curr_item.type != "SERVICE" && curr_item.type != "SELL") {
                    if (curr_item.status == "PENDING")
                        var1++;

                    if (curr_item.status == "OUT")
                        var2++;

                    if (curr_item.status == "IN")
                        var3++;
                }

                let discount_amount = 0;
                curr_item.discount_rate = parseFloat(curr_item.discount_rate) || 0;
                curr_item.units = parseInt(curr_item.units) || 0;
                curr_item.qty = parseInt(curr_item.qty) || 0;
                curr_item.unit_price = parseFloat(curr_item.unit_price) || 0;
                curr_item.cost = parseFloat(curr_item.cost) || 0;
                curr_item.metres = parseInt(curr_item.metres) || 0;

                const discount_rate = curr_item.discount_rate >= 1 ? (curr_item.discount_rate / 100) : curr_item.discount_rate;

                if (curr_item.units > 0) {
                    discount_amount = (curr_item.qty * curr_item.unit_price * curr_item.units) * discount_rate;
                }
                else {
                    discount_amount = (curr_item.qty * curr_item.unit_price) * discount_rate;
                }
                cal_item.discount_amount += discount_amount;
                if (curr_item.loss > 0) {
                    cal_item.loss_cost += curr_item.cost;
                }
                let amount = 0;
                switch (true) {
                    case curr_item.metre_charge == 1 && !curr_item.metres && curr_item.units <= 0:
                        amount = (curr_item.unit_price * curr_item.qty) - discount_amount;
                        break;
                    case curr_item.metre_charge == 1 && !curr_item.metres && curr_item.units >= 1:
                        amount = (curr_item.unit_price * curr_item.qty * curr_item.units) - discount_amount;
                        break;
                    case curr_item.metre_charge == 1 && curr_item.metres && curr_item.units >= 1:
                        amount = (curr_item.unit_price * curr_item.metres * curr_item.units) - discount_amount;
                        break;
                    case curr_item.metre_charge == 1 && curr_item.metres && curr_item.units <= 0:
                        amount = (curr_item.unit_price * curr_item.metres) - discount_amount;
                        break;
                    case curr_item.units > 0:
                        amount = (curr_item.unit_price * curr_item.qty * curr_item.units) - discount_amount;
                        break;
                    case curr_item.units <= 0:
                        amount = (curr_item.unit_price * curr_item.qty) - discount_amount;
                        break;
                }

                //calculate commission cost
                cal_item.commission_cost += ((amount * client_commission) || 0);

                cal_item.items_amount += amount;
            }
            const cal_rental = {};
            //get paments records count witch are have the BOND type in payment table 
            cal_rental.bond_paid = await Payment.count({ where: { payment_type: "BOND", _rental_id_fk: rental_id } });
            cal_rental.bond_rate = rental_data["administration.bond_rate"] ? rental_data["administration.bond_rate"] : 0;
            //get the total invoice amount for rental
            const invoices = await Invoice.findAll({ attributes: ["total"], where: { _rental_id_fk: rental_id } });
            let total_invoices = 0;
            if (invoices.length) {
                cal_rental.status_invoiced = 2;
            }
            for (invoice of invoices) {
                total_invoices += parseFloat(invoice.total);
            }
            cal_rental.total_invoices = total_invoices;
            if (var1 != 0) {
                cal_rental.status_dispatch = 1;
            } else if (var2 > 0) {
                cal_rental.status_dispatch = 2;
            } else if (var2 == 0 && var3 > 0) {
                cal_rental.status_dispatch = 3;
            }
            //calculate sur_charge for rental
            cal_rental.total_rental = cal_item.total_balence > 0 ? cal_item.total_balence + cal_item.total_kit + cal_item.total_subrent : 0.00;
            cal_rental.sur_charge = rental_data.use_surcharge ? (cal_rental.total_rental * surcharge_rate) : 0;

            //calculate the sub total for rental
            rental_data.bond = (!rental_data.bond) ? cal_rental.bond_rate : parseFloat(rental_data.bond);
            rental_data.delivery_charge = parseFloat(rental_data.delivery_charge);
            rental_data.collection_charge = parseFloat(rental_data.collection_charge);
            if ((cal_item.items_amount + (rental_data.bond || 0.00) + (rental_data.delivery_charge || 0.00) + (rental_data.collection_charge || 0.00) + cal_rental.sur_charge)) {
                let temp_val = (cal_item.items_amount + (rental_data.bond || 0) + (rental_data.delivery_charge || 0) + (rental_data.collection_charge || 0) + cal_rental.sur_charge + (rental_data.damage || 0) + cal_item.total_loss - (rental_data.discount_cash || 0));
                if (temp_val >= 0) {
                    cal_rental.sub_total = Math.round(temp_val / 0.05) * 0.05;
                } else {
                    cal_rental.sub_total = -Math.round(Math.abs(temp_val) / 0.05) * 0.05;
                }

            } else {
                cal_rental.sub_total = 0;
            }

            //calculating the credit card charge for rental
            if (credit_card_rate) {
                let temp_val = ((cal_rental.sub_total - (rental_data.bond || 0)) * credit_card_rate);
                if (temp_val >= 0) {
                    cal_rental.credit_card_charge = Math.round(temp_val / 0.05) * 0.05;
                } else {
                    cal_rental.credit_card_charge = -Math.round(Math.abs(temp_val) / 0.05) * 0.05;
                }

            } else {
                cal_rental.credit_card_charge = 0;
            }


            //calculating the tax for rental
            const temp_tax = tax_rate ? ((cal_item.taxable_amount + (rental_data.delivery_charge || 0) + (rental_data.collection_charge || 0) + cal_item.total_loss + (rental_data.damage || 0) + cal_rental.sur_charge + cal_rental.credit_card_charge - (rental_data.discount_cash || 0)) * tax_rate) : 0;
            if (xero_active) {
                cal_rental.tax = parseFloat(temp_tax) || 0;
            } else {
                cal_rental.tax = Math.round(((temp_tax / 0.05) || 0), 0) * 0.05;
            }

            //Calculating total amount for rental
            if (rental_data.long_term_hire == 1 && (cal_rental.total_invoices > (cal_rental.tax + cal_rental.sub_total))) {
                cal_rental.total = parseFloat(cal_rental.total_invoices) || 0;
            } else {
                cal_rental.total = parseFloat(cal_rental.sub_total + cal_rental.tax + cal_rental.credit_card_charge) || 0.00;
            }

            //update deposit balance
            cal_rental.deposit_balance = rental_data.deposit ? cal_rental.total - parseFloat(rental_data.deposit) : 0;
            //calculate the profit for the rental
            cal_rental.total_costs = cal_item.staff_cost + cal_item.commission_cost + cal_rental.tax + cal_item.loss_cost;
            cal_rental.profit = cal_rental.total - cal_rental.total_costs - (rental_data.bond || 0);
            //calculate rental discount
            cal_rental.discount = cal_item.discount_amount + (rental_data.discount_cash || 0);
            //calculate rental related payments
            const payment_results = await Payment.findAll({ attributes: ['payment_amount', 'payment_type'], where: { _rental_id_fk: rental_id } });
            //cal_rental.total_invoices = await Invoice.sum("total", { where: { _rental_id_fk: rental_id } }) || 0;
            //sub_rent_cost = await SubRent.sum('cost', { where: { id_invoice: rental_id } });
            cal_rental.total_refund = 0;
            cal_rental.total_paid = 0;
            cal_rental.pament_amount = 0;
            cal_rental.bond_paid_amount = rental_data.bond_paid_amount || 0;
            for (currpayt of payment_results) {

                if (currpayt.payment_type == "REFUND BOND") {
                    cal_rental.total_refund += currpayt.payment_amount;
                }
                if (currpayt.payment_type !== "REFUND BOND") {
                    cal_rental.pament_amount += currpayt.payment_amount;
                }
                if (currpayt.payment_type !== "REFUND BOND" && currpayt.payment_type !== "BOND") {
                    cal_rental.total_paid += currpayt.payment_amount;
                }
            }
            cal_rental.paid = cal_rental.total_paid + cal_rental.bond_paid_amount - Math.abs(cal_rental.total_refund);

            //calculate balance for rental
            if (cal_rental.total_invoices < 1) {
                cal_rental.balance = cal_rental.total - cal_rental.paid;
            } else if (cal_rental.bond_paid_amount == rental_data.bond && cal_rental.total_refund != 0) {
                cal_rental.balance = cal_rental.total_invoices - cal_rental.paid;
            } else {
                cal_rental.balance = cal_rental.total_invoices + rental_data.bond - cal_rental.paid;
            }

            //calculate total due for rental
            if (rental_data.bond > 0 && cal_rental.bond_paid_amount == 0) {
                cal_rental.total_due = Math.round((cal_rental.balance + rental_data.bond) * 100) / 100;
            } else if (rental_data.bond > 0 && cal_rental.bond_paid_amount > 0) {
                cal_rental.total_due = Math.round((cal_rental.total_invoices - cal_rental.total_refund) * 100) / 100;
            } else if (rental_data.bond == 0 && cal_rental.bond_paid_amount == 0) {
                cal_rental.total_due = Math.round(cal_rental.balance * 100) / 100;
            }
            //Find the status payment
            // // 2 = Paid, 1 = Part payment, 0 = Unpaid
            if (cal_rental.pament_amount == 0) {
                cal_rental.status_payment = 0;
            } else if (cal_rental.pament_amount && cal_rental.balance > 0) {
                cal_rental.status_payment = 1;
            } else if (cal_rental.pament_amount && cal_rental.balance <= 0) {
                cal_rental.status_payment = 2;
            }
            //Sub rent header icon color change
            cal_rental.status_overbooked = await this.update_status_overbooked(rental_id);

            //Calculate subrental total_cost
            cal_item.sub_rental_cost = await SubRent.sum("total_cost", { where: { _rental_id_fk: rental_id } }) || 0;

            //Calculate subrental total_cost
            cal_item.sub_rental_qty = await SubRent.sum("qty", { where: { _rental_id_fk: rental_id } }) || 0;

            //required fields in finatial tab
            cal_rental.total_loss = cal_item.total_loss;
            cal_rental.total_services = cal_item.total_services;
            cal_rental.total_sales = cal_item.total_sales;
            cal_rental.commission_cost = cal_item.commission_cost;
            cal_rental.staff_cost = cal_item.staff_cost;
            cal_rental.sub_rental_cost = cal_item.sub_rental_cost;
            cal_rental.sub_rental_qty = cal_item.sub_rental_qty;
            //const commission_percentage = rental_data["client.company_discount"]
            //cal_rental.client_commission = commission_percentage ? commission_percentage * 100 : 0;
            cal_rental.client_commission = client_commission ? client_commission * 100 : 0;
            if (rental_data.prep_date && new Date(rental_data.prep_date) != "Invalid Date") {
                cal_rental.start_date_calc = rental_data.prep_date;
            } else if (rental_data.delivery_date && new Date(rental_data.delivery_date) != "Invalid Date") {
                cal_rental.start_date_calc = rental_data.delivery_date;
            } else {
                cal_rental.start_date_calc = rental_data.date;
            }

            if (rental_data.de_prep_date && new Date(rental_data.de_prep_date) != "Invalid Date") {
                cal_rental.end_date_calc = rental_data.de_prep_date;
            } else if (rental_data.collection_date && new Date(rental_data.collection_date) != "Invalid Date") {
                cal_rental.end_date_calc = rental_data.collection_date;
            } else {
                cal_rental.end_date_calc = rental_data.date_end;
            }

            //cal_rental.end_date_calc
            let unstored_period_prorata = 0;
            if (rental_data.off_hire_date && new Date(rental_data.off_hire_date) != "Invalid Date") {
                if (rental_data.billing_date_start && new Date(rental_data.billing_date_start) != "Invalid Date") {
                    unstored_period_prorata = (Math.abs(new Date(rental_data.off_hire_date) - new Date(rental_data.billing_date_start)) / (1000 * 3600 * 24));
                }
            } else {
                if (rental_data.billing_date_start && new Date(rental_data.billing_date_start) != "Invalid Date" && rental_data.billing_date_end && new Date(rental_data.billing_date_end) != "Invalid Date") {
                    unstored_period_prorata = (Math.abs(new Date(rental_data.billing_date_end) - new Date(rental_data.billing_date_start)) / (1000 * 3600 * 24));
                }
            }
            cal_rental.unstored_period_prorata = Math.round(unstored_period_prorata) + 1;
            let off_hire_number_days_partial_return = 0
            if (rental_data.off_hire_date && new Date(rental_data.off_hire_date) != "Invalid Date") {
                off_hire_number_days_partial_return = Math.round(((new Date(rental_data.off_hire_date) - new Date(rental_data.billing_date_start)) / (1000 * 60 * 60 * 24)), 0) + 1;
            } else {
                off_hire_number_days_partial_return = Math.round(((new Date(this.getDateOnly()) - new Date(this.getDateOnly(rental_data.billing_date_start))) / (1000 * 60 * 60 * 24)), 0) + 1;
            }
            cal_rental.off_hire_number_days_partial_return = off_hire_number_days_partial_return || 0;
            let off_hire_partial_return_percentage = 0;
            let days = cal_rental.off_hire_number_days_partial_return;
            let month_length = 0;
            if (rental_data.billing_date_start && new Date(rental_data.billing_date_start) != "Invalid Date") {
                const last_date = await this.get_last_date_of_month(rental_data.billing_date_start);
                month_length = last_date.getDate();
            }
            const rate_config = await Rate.findOne({ where: { '__rate_config_id_pk': rental_data._rate_config_id_fk } });
            if (rate_config && rate_config.label.toLowerCase() == "daily") {
                off_hire_partial_return_percentage = days;
            } else if (rate_config && rate_config.label.toLowerCase() == "weekly") {
                off_hire_partial_return_percentage = days / 7;
            } else if (rate_config && rate_config.label.toLowerCase() == "monthly" && rental_data.billing_cycle == "Monthly") {
                off_hire_partial_return_percentage = days / month_length;
            }
            cal_rental.off_hire_partial_return_percentage = Math.round(off_hire_partial_return_percentage * 100) / 100 || 0;
            let unstored_period_propata_days = 0;
            if (rental_data.billing_date_start && new Date(rental_data.billing_date_start) != "Invalid Date" && rental_data.billing_date_end && new Date(rental_data.billing_date_end) != "Invalid Date") {
                unstored_period_propata_days = ((new Date(rental_data.billing_date_start) - new Date(rental_data.billing_date_end)) / (1000 * 60 * 60 * 24)) + 1;
            }
            cal_rental.unstored_period_propata_days = unstored_period_propata_days;
            cal_rental.unstored_count_invoices = invoices.length;
            //if need can update to rental for that set update_to_rental as true
            if (update_to_rental && rental_data) {
                const { unstored_period_prorata, unstored_period_propata_days, unstored_count_invoices, total, sur_charge, sub_rental_qty, sub_rental_cost, status_payment, status_overbooked, status_invoiced, status_dispatch, start_date_calc, off_hire_partial_return_percentage, off_hire_number_days_partial_return, balance, bond_paid_amount, deposit_balance, end_date_calc } = cal_rental;
                let check_avails_last_run = "";
                cal_rental.check_avails_last_run = "";
                await Rental.update({ check_avails_last_run, unstored_period_prorata, unstored_period_propata_days, unstored_count_invoices, total, sur_charge, sub_rental_qty, sub_rental_cost, status_payment, status_overbooked, status_invoiced, status_dispatch, start_date_calc, off_hire_partial_return_percentage, off_hire_number_days_partial_return, balance, bond_paid_amount, deposit_balance, end_date_calc }, { where: { __rental_id_pk: rental_id } })
            }
            update_data = this.setDecimal("rental_cal", cal_rental, user);
            update_data = this.setThousandSeparator("rental_cal", cal_rental);
            if (update_stepper) {
                update_data.stepper = await this.update_stepper(rental_id);
            } else {
                update_data.stepper = rental_data.stepper;
            }
            cal_rental.rental_id = rental_id;
        }
        return update_data;
    },

    /**
     * @author JoysanJawahar
     * @summary This function is used for update header/update status overbooked
     * @param {rental id} id
     * @returns status overbooked value
     */
    update_status_overbooked: async function (id) {
        SubRent.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk' })
        let overallItems = await SubRent.findAll({
            raw: true,
            attributes: ["qty", "qty_received"],
            where: { _rental_id_fk: id },
            include: {
                model: Rental,
                attributes: ["sub_rental_date_sent", "sub_rental_received"]
            }
        });
        let overallQty = 0;
        let overallQtyReceived = 0;
        let count = 0;
        let sent, received, update_status_overbooked;
        for (item of overallItems) {
            overallQty += item.qty;
            overallQtyReceived += item.qty_received;
            count++;
            sent = item['rental.sub_rental_date_sent'];
            received = item['rental.sub_rental_received']
        }
        let diff = overallQty - overallQtyReceived;
        switch (true) {
            case count < 0:
                update_status_overbooked = 0;
                break;
            case count > 0 && overallQty != overallQtyReceived && !sent:
                update_status_overbooked = 1;
                break;
            case count > 0 && overallQty != overallQtyReceived && !!sent:
                update_status_overbooked = 2;
                break;
            case count > 0 && diff > 0:
                update_status_overbooked = 2;
                break;
            case count > 0 && diff == 0:
                update_status_overbooked = 3;
                break;
        }
        return update_status_overbooked;
    },

    /**
     * @author Kirankumar
     * @summary This function is used for create the notes for rental
     * @param {notes data} data 
     * @param {Logged in user details} user 
     * @returns status and updated data
     */
    create_notes: async function (data, user) {
        if (data.rental_id && data.notes) {
            let body_notes = {
                notes: data.notes,
                created_by: user.user_id,
                created_at: new Date(),
                _rental_id_fk: data.rental_id
            };
            let insert_notes = await ClientNotes.create(body_notes);
            let get_notes_staff = await Auth.findOne({ attributes: ["display_staff_name"], where: { __staff_id_pk: user.user_id, is_deleted: 0 } })
            //get_all_notes = [];
            if (insert_notes.__client_notes_id_pk) {
                //get_all_notes = await ClientNotes.findAll({ raw: true, order: [['__client_notes_id_pk', 'DESC']], attributes: ["__client_notes_id_pk", "notes", "created_at"], where: { _rental_id_fk: req.body.rental_id } })
                get_all_notes = await this.transformnames('LTR', insert_notes, "ClientNotes", {}, user);
                insert_notes.created_by = get_notes_staff ? get_notes_staff.display_staff_name : "";
                return { status: true, data: insert_notes }
            } else {
                return { status: false, message: lang('Validation.record_not_inserted', user.lang) }
            }
        }
        else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    },
    /**
     * @author Kirankumar
     * @summary This function is used for delete the tasks
     * @param {Task ids} data 
     * @param {Logged in user details} user 
     * @returns status and message
     */
    delete_task: async function (data, user) {
        if (data && data.task_ids && data.task_ids.length) {
            const del_status = await Task.update({ is_deleted: 1 }, { where: { __task_id_pk: data.task_ids } });
            if (del_status && del_status[0]) {
                //remove all task items while delete task
                await RentalItems.destroy({ where: { _task_id_fk: data.task_ids } });
                //remove all task resources while delete task
                await TaskResource.destroy({ where: { _task_id_fk: data.task_ids } });
                //remove all task vehicles while delete task
                await TaskVehicle.destroy({ where: { _task_id_fk: data.task_ids } });
                return { status: true, message: lang("Validation.record_deleted", user.lang) };
            } else {
                return { status: false, message: lang('Validation.record_not_deleted', user.lang) };
            }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }

    },

    /**
     * @author Kirankumar
     * @summary This function is used for create excel file.
     * @param {excel data} data 
     * @param {Settings for doc} settingss 
     * @param {Logged in user details} user 
     * @param {File name for doc} file_name 
     * @returns Joson file related data
     */
    create_excel_file: async function (data = [], settingss = {}, user, file_name = "") {
        const excel = require('node-excel-export');
        if (data.length == 0) {
            return false;
        }
        const uid = v4();
        let upload_path = envs.documents_path + '/temp';
        const new_filename = uid + ".xlsx";
        if (!fs.existsSync(envs.documents_path)) {
            fs.mkdirSync(envs.documents_path);
        }
        if (!fs.existsSync(upload_path)) {
            fs.mkdirSync(upload_path);
        }
        // Create the excel report.
        // This function will return Buffer
        const report = excel.buildExport(
            [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
                {
                    name: data[0].sheet, // <- Specify sheet name (optional)
                    specification: data[0].columns, // <- Report specification
                    data: data[0].content       // <-- Report data
                }
            ]
        );
        fs.writeFileSync(upload_path + '/' + new_filename, report); // Will write the excel file
        let create_file_data = {
            file_name: file_name,
            file_path: upload_path + '/' + new_filename,
            name_ref: uid,
            file_name_fm: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            days_limit: 1,
            ext: ".xlsx",
            created_by: user.user_id,
            created_at: new Date()
        }
        const file_create_data = await Upload.create(create_file_data);
        return create_file_data;
    },


    getPaymentByRentalId: async function (rental_id) {
        const query = {};
        if (rental_id) {
            query._rental_id_fk = rental_id;
        }
        let data = await Payment.findAll({ where: query });
        data = await this.transformnames('LTR', data, "Payment");
        return data || {};
    },
    /**
    * @author Anik
    * @summary This function is used control date format for pdfs
    * @param {date} date
    * @returns formated date
    */
    setFormatedDate(date, pdf_date_format) {
        var date_regex = /^(0[1-9]|1\d|2\d|3[01])\.|\/|\-(0[1-9]|1[0-2])\.|\/|\-(19|20)\d{2}$/;
        const format = date_regex.test(date) ? 'DD.MM.YYYY' : "";
        let formated_date = date ? moment(date, format).format(pdf_date_format || 'ddd D MMM YYYY') : "";
        if (formated_date == "Invalid date") {
            formated_date = "";
        }
        return formated_date;
    },
    /**
    * @author JoysanJawahar
    * @summary This function is used format date in mm/dd/yyyy
    * @param {date} date
    * @returns formated date
    */
    getFormatDate(data, attributes, user) {
        if (data.length > 0) {
            for (var iterateData in data) {
                for (var colVal in attributes) {
                    let formatColumn = attributes[colVal]
                    if (data[iterateData][formatColumn]) {
                        data[iterateData][formatColumn] = moment(data[iterateData][formatColumn]).format("DD-MM-YYYY")
                    }
                }
            }
            return data;
        }
    },
    /**
     * @author Anik
     * @summary This function is used for seperate the price_amount by commas
     * @param {amount} amount
     * @returns  seperate amount by commas
     */
    numberWithCommas(x) {
        if (`${x}`?.includes(",")) {
            x = `${x}`.replaceAll(",", "");
        }
        if (!isNaN(x)) {
            var formatter = new Intl.NumberFormat();
            const amnt = formatter.format(x);
            return amnt || 0;
        } else {
            return 0;
        }
    },
    /**
     * @author Anik
     * @summary This function is used for seperate the amount by commas with float number
     * @param {amount} amount
     * @returns  seperate amount by commas with float number
     */
    floatnumberWithCommas(x) {
        if (`${x}`?.includes(",")) {
            x = `${x}`.replaceAll(",", "");
        }
        var formatter = new Intl.NumberFormat('hi', {
            style: 'currency',
            currency: 'INR',
        });
        if (!isNaN(x)) {
            let amount = formatter.format(x);
            amount = amount?.substr(1);
            return amount || "0.00";
        } else {
            return "0.00";
        }
    },
    /**
     * @author Anik
     * @summary This function is used to get selected company data for rental
     * @param  {company no} company_no
     * @returns company data
     */
    getBusinessDetails: async function (company_no) {
        let data = {};
        let businessGet = ["company", "company_no", "office_phone", "office_email", "address", "city", "state", "zip", "warehouse_address", "warehouse_city", "warehouse_state", "warehouse_zip", "website"];
        if (company_no) {
            const business_data = await ConfigBusiness.findOne({
                raw: true, attributes: businessGet, where: { __business_id_pk: company_no, is_deleted: 0 }
            });
            data = this.transformnames('LTR', business_data, "ConfigBusiness");
        }
        return data || {};
    },
    /**
     * @author Anik
     * @summary This function is used to get default selected company data 
     * @param  {company id} company_id 
     * @returns company data
     */
    getDefaultBusinessDetails: async function (company_id) {
        let data = {};
        let businessGet = ["company", "company_no", "office_phone", "office_email", "address", "city", "state", "zip", "warehouse_address", "warehouse_city", "warehouse_state", "warehouse_zip", "website"];
        if (company_id) {
            let business_data = await ConfigBusiness.findOne({
                raw: true, attributes: businessGet, where: { _company_id_fk: company_id, is_deleted: 0, is_main_business: 1 }
            });
            if (!business_data || !Object.keys(business_data).length > 0) {
                business_data = await ConfigBusiness.findOne({
                    raw: true, attributes: businessGet, where: { _company_id_fk: company_id, is_deleted: 0 }
                });
            }
            data = this.transformnames('LTR', business_data, "ConfigBusiness");
        }
        return data || {};
    },
    getPaymentByPaymentId: async function (payment_id) {
        const query = {};
        if (payment_id) {
            query.__payment_id_pk = payment_id;
        }
        let data = await Payment.findAll({ where: query });
        data = await this.transformnames('LTR', data, "Payment");
        return data || {};
    },
    getDetailByRentalId: async function (rental_id, user) {
        let client_get = ["name_full", "account_customer", "account_name", "email", ["parent_id", "contact_parent_id"]];
        let address_get = ["address1", "city", "state", "country", "zip", "is_active", "is_billing", "is_delivery"]
        Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk' });
        Rental.belongsTo(Address, { targetKey: '__address_id_pk', foreignKey: '_address_id_fk' });
        Rental.belongsTo(TaxRate, { targetKey: '__tax_rate_id_pk', foreignKey: '_tax_rate_id_fk' });
        Rental.belongsTo(ConfigRate, { targetKey: '__rate_config_id_pk', foreignKey: '_rate_config_id_fk' });
        Rental.belongsTo(CreditCardRate, { targetKey: '__credit_card_rate_id_pk', foreignKey: '_credit_card_rate_id_fk' });
        let rental_get = await Rental.findOne({ attributes: { exclude: ["updated_by", "created_at", "updated_at"] }, where: { is_deleted: 0, _company_id_fk: user.company_id, __rental_id_pk: rental_id }, include: [{ model: Client, attributes: client_get }, { model: Address, attributes: address_get }, { model: TaxRate, attributes: ["percentage", "tax_code", "tax_name"] }, { model: ConfigRate, attributes: ["label_name"] }, { model: CreditCardRate, attributes: ["card_name", "card_percentage"] }] });
        rental_get = await this.transformnames('LTR', rental_get, "Rental", { address: "Address", client: "Client" });
        if (rental_get) {
            //terms
            let term_get = await Terms.findAll({ order: [['term_label', 'ASC']], attributes: ['__config_term_id_pk', 'term_label'], where: { _company_id_fk: user.company_id } });
            term_get = this.transformnames('LTR', term_get, "Terms");
            const payment_term = term_get.filter(dt => dt.term_id == rental_get.term_id);
            rental_get.term_id = payment_term[0];
            //Notes
            let get_notes = await ClientNotes.findAll({ order: [['__client_notes_id_pk', 'DESC']], attributes: [["__client_notes_id_pk", "rental_notes_id"], "notes", "created_at", "created_by"], where: { _rental_id_fk: rental_id } })
            for (let gtn = 0; gtn < get_notes.length; gtn++) {
                let get_notes_staff = await Auth.findOne({ raw: true, attributes: ["display_staff_name"], where: { __staff_id_pk: get_notes[gtn].created_by, is_deleted: 0 } })
                get_notes[gtn].created_by = get_notes_staff ? get_notes_staff.display_staff_name : "";
            }
            rental_get.notes = get_notes;
            let rental_staff_name = await Auth.findOne({ raw: true, attributes: ["display_staff_name"], where: { __staff_id_pk: rental_get.created_by, is_deleted: 0 } })
            if (rental_staff_name) {
                rental_get.display_staff_name = rental_staff_name.display_staff_name;
            }
            //Items
            let get_data_item = ["__rental_item_id_pk", "_rental_item_id_fk", "_rate_config_id_fk", "is_asset_no_added", "asset_no", "file_ref", "_client_id_fk", "_inventory_id_fk", "_project_id_fk", "_rental_id_fk", "account_code", "amount", "bin_no", "category", "date", "date_end", "discount_rate", "header", "hours_in", "hours_out", "hours_total", "hours_used", "isfromweb", "item", "item_serialised", "jobstatus", "last_service_hours", "level", "lineitemserial", "metre_charge", "metres", "off_hire_cost", "off_hire_date", "off_hire_period", "orders", "prorata_cost", "prorata_date", "prorata_period", "qty", "quantity_dispatched", "replacement_cost", "resource", "service_period", "servicestatus", "sku", "sort", "source", "sub_item", "sub_rent", "sub_rental_cost", "taxable", "time_end", "time_start", "total_price", "type", "unit_price", "unit_type", "units", "year", "is_header", "is_details", "location", "balance"]
            let get_items = await RentalItems.findAll({ order: [["sort", "ASC"]], attributes: get_data_item, where: { _rental_id_fk: rental_id } })
            rental_get.item = await this.transformnames('LTR', get_items, "RentalItems");
            // get image path 
            for (let i in rental_get.item) {
                if (rental_get.item[i].file_ref) {
                    let filePath = await Upload.findAll({ attributes: ["file_path"], where: { name_ref: rental_get.item[i].file_ref } });
                    filePath = await this.transformnames('LTR', filePath, "Upload");
                    rental_get.item[i].file_path = filePath[0].file_path;
                } else {
                    rental_get.item[i].file_path = "";
                }
            }
            //rental_get.item = get_items;
            // rental_get.stepper = await update_stepper(rental_id);
            //rental_get = await calculate_rental_data(rental_get, user, rental_id)
            rental_get.rental_calculated_data = await this.auto_update_or_calculate_rental(rental_id, false, user, false)
            // get selected company details
            if (rental_get?.selected_company_no) {
                rental_get.business_get = await this.getBusinessDetails(rental_get?.selected_company_no);
            }
            return rental_get || {};
        }
    },

    getTaxByID: async function (tax_id) {
        let data = await TaxRate.findOne({ attributes: { exclude: ["_company_id_fk", "updated_at", "created_at", "updated_by", "created_by"] }, where: { __tax_rate_id_pk: tax_id } });
        data = this.transformnames('LTR', data, "TaxRate");
        return data || {};
    },
    /**
    * @author anik
    * @summary This is usefull to create condition for query
    * @return condition data
    */
    get_logistic_data_filters: async function (req, user) {
        let rental_req = [];
        let rental_where = {};
        let rental_order = [];

        let date_fields = ["date_start", "date_end"];
        let { start, limit, offset, where, attributes, order } = await this.grid_filter(req, "Task", true, user.company_id);
        //separate orders
        for (o_key in order) {
            if (rental_fields.indexOf(order[o_key][0]) >= 0)
                order[o_key] = [Rental].concat(order[o_key]);
        }
        //separate attributes and where conditions
        if (attributes && Array.isArray(attributes)) {
            attributes = attributes ? attributes.concat(task_mandatory) : task_mandatory;
            attributes = [...new Set(attributes)];
            let req_data = Array.from(attributes);
            for (key in req_data) {
                if (rental_fields.indexOf(req_data[key]) >= '0') {
                    rental_req.push(req_data[key]);
                    if (where[req_data[key]]) {
                        rental_where[req_data[key]] = where[req_data[key]]
                        delete where[req_data[key]];
                    }
                    if (attributes.indexOf(req_data[key]) >= 0)
                        attributes.splice(attributes.indexOf(req_data[key]), 1);
                }
            }
        }
        Task.belongsTo(Rental, { targetKey: '__rental_id_pk', foreignKey: '_rental_id_fk', })

        //place rental conditions for filters
        let sub_conditions = [];
        if (rental_req.length) {
            let rental_condition = {
                model: Rental, // will create a left join
            }
            if (Object.keys(rental_where).length > 0)
                rental_condition.where = rental_where;
            rental_condition.attributes = rental_req;
            if (rental_order.length)
                rental_condition.order = rental_order;
            sub_conditions.push(rental_condition);
        }

        attributes = this.setDateFormat(attributes, ["date_start", "date_end"], user.date_format);
        let condition = {
            limit, offset, where, attributes, order,
            include: sub_conditions
        }
        return condition;

    },
    /**
    * @author JoysanJawahar
    * @summary This is usefull to create condition for query
    * @return condition data
    */
    get_task_driver_data_filters: async function (req, user) {
        let resource_id = ''

        if (req.params && req.params.resource_id) {
            resource_id = req.params.resource_id;
        } else {
            return { status: false, message: lang("Validation.resource_id_not_exist") };

        }
        let { start, limit, offset, where, attributes, order } = await this.grid_filter(req.body, "Task", true, user.company_id);

        TaskResource.belongsTo(Task, { targetKey: '__task_id_pk', foreignKey: '_task_id_fk', })

        let sub_condition = {
            model: Task,
            attributes,
            order,
            where
        }

        attributes = this.setDateFormat(attributes, ["date_start", "date_end"], user.date_format);
        let condition = {
            limit, offset, where: { _resource_id_fk: resource_id }, attributes: ["_resource_id_fk"], order: [],
            include: sub_condition
        }
        return condition;

    },
    /**
    * @author Anik
    * @summary This function is used for get the vehicle and driver list 
    * @param {task id}  
    * @param {Logged in user details} user 
    * @returns status and resource list and vehicle list.
    */
    get_task_driver_vehicles: async function (data, user) {
        if (data.length) {
            let res_data = [];
            res_data = data?.map(async (dt) => {
                if (dt?.task_id) {
                    let task_resource = await TaskResource.findAll({
                        attributes: ["__task_resource_id_pk", "_resource_id_fk"],
                        where: { _task_id_fk: dt?.task_id },
                    });

                    let task_vehicle = await TaskVehicle.findAll({
                        attributes: ["__task_vehicle_id_pk", "_resource_id_fk"], where: { _task_id_fk: dt?.task_id },
                    });


                    let item_get = ["item", "qty", "sku", "sub_item", "__rental_item_id_pk"];
                    let items = await RentalItems.findAll({ attributes: item_get, where: { _task_id_fk: dt?.task_id } });

                    dt.resource_list = this.transformnames('LTR', task_resource, "Task", { task_resource: "TaskResource" }, user) || [];
                    dt.vehicle_list = this.transformnames('LTR', task_vehicle, "Task", { task_vehicle: "TaskVehicle" }, user) || [];
                    dt.items = await this.transformnames('LTR', items, "RentalItems", {}, user);

                }
                return dt;
            });
            const task_data = await Promise.all(res_data)
            return { status: true, data: task_data || [] };
        } else {
            return { status: true, data: data }
        }
    },
    getServiceInvoice: async function (task_id, user) {
        if (task_id) {
            let data = await Task.findOne({ raw: true, where: { __task_id_pk: task_id, is_deleted: 0 } });
            if (data) {
                data = await this.transformnames('LTR', data, "Task", {}, user);
                data.items = await RentalItems.findAll({ where: { _task_id_fk: data.task_id } });
                data.items = await this.transformnames('LTR', data.items, "RentalItems", {}, user);
                // get invoice data
                if (data?.task_id) {
                    let InvoiceData = await Invoice.findOne({
                        where: { _task_id_fk: data?.task_id }
                    });
                    data.serviceData = await this.transformnames("LTR", InvoiceData, "Invoice", { staff: "Auth" }, user);
                }
                return { status: true, data };
            } else {
                return ({ status: false, message: lang('Validation.record_not_found', user.lang) });
            }
        } else {
            return ({ status: false, message: lang('Validation.invalid_data', user.lang) });
        }
    },
    /**
     * @author Anik
     * @summary This function is used for getting details of all task
     * @param {http request} req 
     * @returns task detail data
     */
    get_task_pdf_invoice: async function (req, user) {
        let { start, limit, offset, where, attributes, order } = await this.grid_filter_task(req, "Task", true, user.company_id);
        let condition = {
            limit, offset, where, attributes, order
        }
        var res_data = await Task.findAndCountAll(condition);
        let data = await this.transformnames('LTR', res_data.rows, "Task", {}, user);
        data = data ? data : [];
        const endRow = await this.get_end_row(offset, limit, res_data.count);
        return data || {};
    },
    //have to create for zz_avilable_qty
    /**
     * @author Kirankumar
     * @summary This function is used for get zz_available_qty values for inventory based on rental
     * @param {Input data} data 
     * @param {Logged in user details} user 
     * @returns list of inventory available qty data
     */
    inventory_available_stock: async function (data, user) {
        if (data && data.inventory_ids && data.rental_id) {
            let { inventory_ids, rental_id } = data;
            inventory_ids = inventory_ids ? inventory_ids : [];
            const return_data = [];
            const rental = await Rental.findOne({ attributes: ["date_start", "date_end", "selected_company_no"], where: { __rental_id_pk: rental_id, is_deleted: 0 } })
            if (!rental) {
                return { status: false, message: lang('Validation.invalid_data', user.lang) }
            }
            const admin = await Administration.findOne({ attributes: ["use_stock_allocation"], where: { _company_id_fk: user.company_id } });
            const _tbl_rental = "rental";//"Interface";
            const _tbl_line_item = "rental_item";//"LineItems";
            const _field_qty = "balance";//"Balance";
            const _field_id_invoice = "_rental_id_fk"//"id_Invoice";
            //const _field_sku = "sku";//"SKU";//replacing with _inventory_id_fk
            const _field_sku = "_inventory_id_fk";
            const _field_id = "__rental_id_pk";//"id";//doubt
            const _status = "is_rental";//status";//"Status";
            const _field_date_start = "start_date_calc";//"Start_date_calc";
            const _field_date_end = "end_date_calc";//End_date_calc;
            const _field_comp_no = "selected_company_no";//"SelectedCompanyNo";
            //const _sku = "tv";//inventory.sku;//i am replacing this with inventory id
            for (inventory_id of inventory_ids) {
                if (inventory_id) {
                    const inventory = await Inventory.findOne({ attributes: ["on_hand"], where: { __inventory_id_pk: inventory_id, is_deleted: 0 } });
                    if (!inventory) {
                        return_data.push({ inventory_id, zz_available_qty: 0 })
                        continue;
                    }
                    const inv_business = rental.selected_company_no ? await InvetoryBusiness.findOne({ where: { _inventory_id_fk: inventory_id, _business_id_fk: rental.selected_company_no } }) || {} : {};
                    const _sku = inventory_id;
                    const _start_date = rental.date_start;//rental.start_date;
                    const _end_date = rental.date_end;//rental.end_date;
                    const com_no = rental.selected_company_no; //$$COMPANY.NO
                    let _total = admin.use_stock_allocation != 1 ? inventory.on_hand || 0 : inv_business.qty || 0; //Inventory::DepotStock[$$COMPANY.NO]  ;
                    let query = "SELECT Sum(l." + _field_qty + ") as avl_qty from " + _tbl_line_item + " as l  INNER JOIN " + _tbl_rental + " as r on l." + _field_id_invoice + " = r." + _field_id
                        + " WHERE r.is_deleted = '0' AND l." + _field_sku + " = '" + _sku + "'  AND l." + _field_comp_no + " = " + com_no
                        + " AND (r." + _status + " <> '0' ) AND ((r." + _field_date_start + " BETWEEN '" + _start_date + "' AND '" + _end_date + "' ) OR (r."
                        + _field_date_end + " BETWEEN '" + _start_date + "' AND '" + _end_date + "' ) OR (r."
                        + _field_date_start + " <= '" + _start_date + "' AND r." + _field_date_end + " >= '" + _end_date + "'))";

                    let sum = await sequelizeQuery.query(query, { type: Sequelize.QueryTypes.SELECT });
                    const _count = sum[0].avl_qty || 0;
                    const avilable_qty = _total - _count;
                    return_data.push({ inventory_id, zz_available_qty: avilable_qty })
                }
            }
            return { status: true, data: return_data };
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) }
        }
    },
    /**
     * @author Kirankumar
     * @summary This function is used for get date only from date;
     * @param {Date} date 
     * @returns Date as string;
     */
    getDateOnly: function (date = new Date()) {
        date = new Date(date);
        return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    },
    /**
    * @author Anik
    * @summary This function is used to get data for logistic pdf
    * @param  {http request} req
    * @returns logistic data
    */
    getLogisticDataPdf: async function (req, user) {
        const condition = await this.get_logistic_data_filters(req, user);
        var res_data = await Task.findAndCountAll(condition);
        let data = await this.transformnames('LTR', res_data.rows, "Task", {}, user);
        data = data ? data : [];
        if (data.length) {
            data = await this.get_task_driver_vehicles(data, user);
        }
        return data?.data || [];
    },


    // createLoss: async function (data){
    //     if(data){
    //         if(!(data.length >= 0)){
    //             data = [data];
    //         }
    //         for(loss_item of data){
    //             let loss_set = { id_product: loss_item.id_product, sku: loss_item.sku, item: loss_item.item, qty: loss_item.loss, id_invoice: loss_item._inventory_id_fk };

    //             InventoryLoss.create();
    //         }
    //     }
    // }
};

// var lfunc = commonchange.transformnames('LTR',data1,"Invoice")
