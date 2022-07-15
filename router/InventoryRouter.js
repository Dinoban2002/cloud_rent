const { Administration, Client, Inventory, InventoryComponent, InventoryRateDetails, InvetoryBusiness, ConfigRentalStatus, InventoryRate, ItemType, Rate, Upload, ConfigBusiness, AssetManagement, Task, RentalItems, Rental } = require("../models/Model")(
    ["Administration", "Client", "Inventory", "InventoryComponent", "InventoryRateDetails", "InvetoryBusiness", "ConfigRentalStatus", "InventoryRate", "ItemType", "Rate", "Upload", "ConfigBusiness", "AssetManagement", "Task", "RentalItems", "Rental"]
);
const { Sequelize, DATE } = require('sequelize');
const Op = Sequelize.Op;
let handy = require("../config/common");
let lang = require('../language/translate').validationMsg;


async function InventoryRouter(fastify, opts) {

    /**
     * @author Kirankumar
     * @summary This rout is usefull to get inventory dashboard data
     * @returns status and count data of inventory
     */
    fastify.get('/inventory/dashboard', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = {};
            //data.total = await Inventory.count({where:{is_deleted:0, _company_id_fk: user.company_id}});
            const group_data = await Inventory.findAll({
                group: ['category'],
                where: { is_deleted: 0, _company_id_fk: user.company_id },
            })
            data.category = group_data.length;
            data.total = await Inventory.sum("starting_qty", { where: { is_deleted: 0, _company_id_fk: user.company_id } }) || 0;
            data.inStock = await Inventory.sum("on_hand", { where: { is_deleted: 0, _company_id_fk: user.company_id } }) || 0;
            Rental.belongsTo(RentalItems, { targetKey: '_rental_id_fk', foreignKey: '__rental_id_pk' });
            data.onRental = await Rental.count("qty", {
                where: {
                    is_deleted: 0,
                    _company_id_fk: user.company_id
                },
                include: [
                    {
                        model: RentalItems,
                        where: {
                            _inventory_id_fk: {
                                [Op.ne]: [0, null]
                            }
                        }
                    }
                ]
            }) || 0;
            res.status(200).send({ status: true, data });
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for create or update the inventory
     * @returns status and updated data
     */
    fastify.post('/item/update', async (req, res) => {
        try {
            const item_data = req.body;
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await create_or_update_item(item_data, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for delete the inventory rate
     * @returns status and Message
     */
    fastify.delete('/item/rate/delete/:rate_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params.rate_id) {
                const del_count = await InventoryRate.destroy({ where: { __inventory_rate_id_pk: req.params.rate_id } });
                if (del_count) {
                    res.status(200).send({ status: true, message: lang("Validation.record_deleted", user.lang) });
                } else {
                    res.status(404).send({ status: true, message: lang("Validation.record_not_exist", user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: lang("Validation.invalid_data", user.lang) })
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for create rates data for inventory when change the inventory type
     * @returns status and updated data
     */
    fastify.post('/item/rates/create', async (req, res) => {
        try {
            const item_data = req.body;
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            await createRates(item_data.inventory_id, item_data.item_type_id, user);
            const data = await getRate(item_data.inventory_id);
            res.status(200).send({ status: true, data });
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used to delete inventory by id
     * @returns status and message
     */
    fastify.delete('/item/delete/:inventory_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const inventory_id = req.params.inventory_id;
            const count = await Inventory.count({ where: { __inventory_id_pk: inventory_id, _company_id_fk: user.company_id, is_deleted: 0 } });
            if (!count) {
                res.status(200).send({ status: false, message: lang("Validation.record_not_exist", user.lang) });
                return;
            }
            let update_status = await Inventory.update({ updated_by: user.user_id, is_deleted: 1 }, { where: { __inventory_id_pk: inventory_id } });
            if (update_status && update_status[0]) {
                res.status(200).send({ status: true, message: lang("Validation.record_deleted", user.lang) });
            } else {
                res.status(501).send({ status: false, message: lang("Validation.record_not_deleted", user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author JoysanJawahar
     * @summary This rout is used to delete inventory by id
     * @returns status and message
     */
    fastify.delete('/item/description/delete/:inventory_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const inventory_id = req.params.inventory_id;
            const count = await Inventory.count({ where: { __inventory_id_pk: inventory_id, _company_id_fk: user.company_id, is_deleted: 0 } });
            if (!count) {
                res.status(200).send({ status: false, message: lang("Validation.record_not_exist", user.lang) });
                return;
            }
            let update_status = await Inventory.update({ updated_by: user.user_id, container_advert: "" }, { where: { __inventory_id_pk: inventory_id } });
            if (update_status && update_status[0]) {
                res.status(200).send({ status: true, message: lang("Validation.image_deleted", user.lang) });
            } else {
                res.status(501).send({ status: false, message: lang("Validation.image_not_deleted", user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This rout is used to get inventory data by id
     * @returns status and inventory data
     */
    fastify.get('/item/get/:inventory_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let data = await getInventory(user, req.params.inventory_id);
            res.status(200).send(data);
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This rout is used to get inventory list with filters
     * @returns status and inventory list
     */
    fastify.post('/item/list', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const file_index = (req.body && req.body.required) ? req.body.required.indexOf('files') : -1;
            const components_index = (req.body && req.body.required) ? req.body.required.indexOf('component') : -1;
            if (file_index >= 0)
                req.body.required.splice(file_index, 1);
            if (components_index >= 0)
                req.body.required.splice(components_index, 1);
            let inventory_data = req.body;
            let is_distinct = false;
            //used for get the unique inventory type list 
            if (inventory_data["rowGroupCols"] && inventory_data["rowGroupCols"][0] && inventory_data["rowGroupCols"][0]["field"] && !(inventory_data["groupKeys"] && inventory_data["groupKeys"][0])) {
                inventory_data["required"] = [inventory_data["rowGroupCols"][0]["field"]];
                is_distinct = true;
            }
            //Used for get perticuler type  of inventory
            if (inventory_data["groupKeys"] && inventory_data["groupKeys"][0]) {
                inventory_data["filterModel"] = inventory_data["filterModel"] ? inventory_data["filterModel"] : [];
                inventory_data["filterModel"]["type"] = { "filterType": "text", "type": "equals", "filter": inventory_data["groupKeys"][0] };
            }
            // let rate_type = "";
            // let { limit, offset, where, attributes, order } = await handy.grid_filter(req.body, "Inventory", true, user.company_id);
            // //separete the inventory type attributes
            // if (attributes && attributes.length && attributes.indexOf("type") >= 0) {
            //     rate_type = {
            //         model: ItemType,
            //         attributes: []
            //     }
            //     rate_type.attributes.push(["type_name", "type"]);
            //     if (where.type) {
            //         rate_type.where = {};
            //         rate_type.where["type_name"] = where["type"];
            //         delete where.type;
            //     }
            //     attributes.splice(attributes.indexOf("type"), 1);
            // }
            // if (req.body && req.body.filter && req.body.filter.logic == "or") {
            //     let where_and = {};
            //     if (where.is_deleted) {
            //         where_and.is_deleted = where.is_deleted;
            //         delete where.is_deleted;
            //     }
            //     if (where._company_id_fk) {
            //         where_and._company_id_fk = where._company_id_fk;
            //         delete where._company_id_fk;
            //     }
            //     where = { [Op.or]: where, [Op.and]: where_and };
            // }
            // let condition = { limit, offset, where, attributes, order }
            // for (o_key in order) {
            //     if (order[o_key][0] == "type") {
            //         order[o_key][0] = "type_name";
            //         order[o_key] = [ItemType].concat(order[o_key]);
            //     }

            // }
            // if (rate_type) {
            //     condition.include = rate_type;
            // }
            let condition = await inventory_filtes(req, user);
            let { limit, offset, where, attributes, order } = condition;
            if (is_distinct) {
                condition.attributes = [];
                condition.limit = 1000000000;
            }
            Inventory.belongsTo(ItemType, { targetKey: '__item_type_id_pk', foreignKey: '_item_type_id_fk', })
            let res_data = await Inventory.findAndCountAll(condition);
            let data = await handy.transformnames('LTR', res_data.rows, "Inventory", { item_type: "ItemType" });
            let setObj = new Set(); // create key value pair from array of array
            if (is_distinct) {
                data = data.reduce((return_array, item) => {
                    if (!setObj.has(item.type)) {
                        setObj.add(item.type)
                        return_array.push(item)
                    }
                    return return_array;
                }, [])
                res_data.count = data.length;
            }
            //Get files for inventory
            const quantity = inventory_data.quantity;
            if (file_index >= 0) {
                for (let key in data) {
                    if (data[key].inventory_id)
                        data[key]['files'] = await getFiles(data[key].inventory_id);
                }
            }
            //here will get quick quote data and asset data for thr inventory list
            for (let key in data) {
                const asset_data = await AssetManagement.findAll({
                    attributes: { exclude: ["created_by", "updated_by", "created_at", "updated_at"] }, where: {
                        test_date_next: { [Op.lte]: new DATE() },
                        _inventory_id_fk: data[key].inventory_id
                    }
                });
                data[key].assets = handy.transformnames("LTR", asset_data, "AssetManagement")
                data[key].rate_details = await InventoryRate.findAll({ attributes: [["__inventory_rate_id_pk", "inventory_rate_id"], "rate_name", "rate_label", "is_hourly", "is_daily", "cost", "price_extra_tax"], where: { _inventory_id_fk: data[key].inventory_id }, });
                if (quantity && Object.keys(quantity).length) {
                    if (quantity[data[key].inventory_id]) {
                        data[key].ui_quantity = quantity[data[key].inventory_id].quantity;
                    } else {
                        data[key].ui_quantity = '';
                    }
                }
            }
            if (components_index >= 0) {
                data = await getComponent(data);
            }
            data = data ? data : [];
            const endRow = await handy.get_end_row(offset, limit, res_data.count);
            res.status(200).send({ status: true, count: res_data.count, endRow, data });
        } catch (e) {
            res.status(501).send(e);
        }
    });
    /**
     * @author Kirankumar
     * @summary This function is usefull to create filter conditions for inventory.
     * @param {HTTP request} req 
     * @param {Logged in user details} user 
     * @returns json inventory filter condition.
     */
    async function inventory_filtes(req, user) {
        let rate_type = "";
        let { limit, offset, where, attributes, order } = await handy.grid_filter(req.body, "Inventory", true, user.company_id);
        //separete the inventory type attributes
        if (attributes && attributes.length && attributes.indexOf("type") >= 0) {
            rate_type = {
                model: ItemType,
                attributes: []
            }
            rate_type.attributes.push(["type_name", "type"]);
            if (where.type) {
                rate_type.where = {};
                rate_type.where["type_name"] = where["type"];
                delete where.type;
            }
            attributes.splice(attributes.indexOf("type"), 1);
        }
        if (req.body && req.body.filter && req.body.filter.logic == "or") {
            let where_and = {};
            if (where.is_deleted) {
                where_and.is_deleted = where.is_deleted;
                delete where.is_deleted;
            }
            if (where._company_id_fk) {
                where_and._company_id_fk = where._company_id_fk;
                delete where._company_id_fk;
            }
            where = { [Op.or]: where, [Op.and]: where_and };
        }
        let condition = { limit, offset, where, attributes, order }
        for (o_key in order) {
            if (order[o_key][0] == "type") {
                order[o_key][0] = "type_name";
                order[o_key] = [ItemType].concat(order[o_key]);
            }

        }
        if (rate_type) {
            condition.include = rate_type;
        }
        return condition;

    }

    /**
     * @author Kirankumar
     * @summary This rout is used to get inventory list based on type
     * @returns status and Inventory data
     */
    fastify.post('/item/category', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let data = await getInventory(user, "", "", req.body.category, req.body.search);
            res.status(200).send(data);
        } catch (e) {
            res.status(501).send(e);
        }
    });
    /**
     * @author Kirankumar
     * @summary This rout is used for get rates for inventory by inventory id
     * @returns status and list of rates data
     */
    fastify.get('/inventory/rate/get/:inventory_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const rate_details = await getRate(req.params.inventory_id)
            //const rate_list = await getRateList(user.company_id);
            res.status(200).send({
                status: true, data: {
                    rate_details
                    //rate_list
                }
            });
        } catch (e) {
            res.status(501).send(e);
        }
    });
    /**
     * @author Kirankumar
     * @summary This rout is used for get inventory data with quick quote for inventory by inventory id's
     * @returns status and quick quote of rates data
     */
    fastify.post('/item/quickquote/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const { inventory_ids, quantity } = req.body;
            if (!inventory_ids || !inventory_ids.length || !quantity) {
                res.status(501).send({ status: false, message: lang("Validation.invalid_data", user.lang) });
                return;
            }
            Inventory.belongsTo(ItemType, { targetKey: '__item_type_id_pk', foreignKey: '_item_type_id_fk' })
            let data = await Inventory.findAll({
                where: { __inventory_id_pk: inventory_ids }, include: {
                    model: ItemType,
                    attributes: [["type_name", "type"]]
                }
            });
            data = await handy.transformnames('LTR', data, "Inventory", { item_type: "ItemType" });
            if (data && data.length) {
                let value = data[key];
                for (key in data) {
                    const inventory_id = data[key].inventory_id;
                    if (inventory_id && (quantity[inventory_id] || quantity[inventory_id.toString().padStart(6, '0')])) {
                        const ui_qty = quantity[inventory_id] ? quantity[inventory_id].quantity : quantity[inventory_id.toString().padStart(6, '0')].quantity;
                        data[key]["ui_quantity"] = ui_qty;

                    }
                    InventoryComponent.belongsTo(Inventory, { targetKey: '__inventory_id_pk', foreignKey: '_parent_inventory_id_fk' });
                    let components = await InventoryComponent.findAll({
                        where: { _inventory_id_fk: inventory_id }, order: [["sort_order", "ASC"]], include: {
                            model: Inventory,
                            attributes: { exclude: ["item", "price", "created_by", "updated_by", "created_at", "updated_at"] }
                        }
                    });
                    data[key]["components"] = await handy.transformnames('LTR', components, "InventoryComponent", { inventory: "Inventory" });
                    data[key]['files'] = await getFiles(inventory_id);

                }
            }
            res.status(200).send({ status: true, data });
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This rout is used for get the inventory data list by company id
     * @returns status and list of data
     */
    fastify.get('/item/get/rental/:rental_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            let data = await getInventory(user, '', '', '', '', true, req.params.rental_id);
            res.status(200).send(data);
        } catch (e) {
            res.status(501).send(e);
        }
    });
    /**
     * @author Kirankumar
     * @summary This rout is used for delete the asset by id
     * @returns status and message
     */
    fastify.delete('/inventory/asset/delete/:asset_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const asset_data = await AssetManagement.findOne({ attributes: ["_inventory_id_fk"], where: { __asset_management_id_pk: req.params.asset_id } });
            const inventory_data = await AssetManagement.destroy({ where: { __asset_management_id_pk: req.params.asset_id } });
            if (inventory_data) {
                const data = await handy.updateStock(asset_data._inventory_id_fk);
                res.status(200).send({ status: true, data, message: lang("Validation.record_deleted", user.lang) });
            } else {
                res.status(200).send({ status: true, message: lang("Validation.record_not_exist", user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @summary This rout is use for get assets for inventory by inventory id
     * @returns Status and list of assets data
     */
    fastify.post('/inventory/asset/get', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.body && req.body.inventory_id) {
                const data = await get_assets(req.body.inventory_id, req.body.required);
                res.status(200).send({ status: true, data });
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }

        } catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @summary This rout is useful to create the assets for inventory.
     * @param inventory_id, Inventory id
     * @return Status and created asset data
     */
    fastify.post('/inventory/asset/create/:inventory_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await createAssets(req.params.inventory_id, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This rout is used for update the asset by asset id
     * @returns status and updated data
     */
    fastify.put('/inventory/asset/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.body && req.body.asset_management_id) {
                const data = await handy.create_update_table(req.body, user, AssetManagement, "AssetManagement", "__asset_management_id_pk");
                if (data.status) {
                    res.status(200).send(data);
                } else {
                    res.status(500).send(data);
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @ignore 1.0.0
     * @author Kirankumar
     * @summary This function for create or update the inventory rates
     * @param $inventory_id,  inventory id
     * @returns status and updated data
     */
    fastify.put('/inventory/rate/update/:inventory_id', async (req, res) => {
        let user = await handy.verfiytoken(req, res);
        if (!user) return;
        let $rate_item_array = req.body;
        const inventory_id = req.params.inventory_id;
        try {
            //$insert_update_data = array();
            if (inventory_id) {
                //$insert_update_data[$this->ItemModel->_inventory_id_fk] = $inventory_id;
                if ($rate_item_array && Array.isArray($rate_item_array["rates"]) && $rate_item_array["rates"].length > 0) {
                    let $rate_id_arr = [];
                    //loop the inventory rates
                    for ($rate of $rate_item_array["rates"]) {
                        $rate.inventory_id = inventory_id;
                        let rate_normal = [];
                        let rate_extra = [];
                        if ($rate.rate && Object.keys($rate.rate).length) {
                            rate_normal = $rate.rate.normal;
                            rate_extra = $rate.rate.extra;
                            delete $rate.rate;
                        }
                        $rate = await handy.transformnames('RTL', $rate, "InventoryRate");
                        let $id = $rate['__inventory_rate_id_pk'];
                        if ($id) {
                            $rate.updated_by = user.user_id;
                            await InventoryRate.update($rate, { where: { __inventory_rate_id_pk: $id } });
                        } else {
                            $rate.created_by = user.user_id;
                            $rate.created_at = new Date();
                            const rate_data = await InventoryRate.create($rate);
                            $id = rate_data.__inventory_rate_id_pk;
                        }
                        if ($id) {
                            $rate_id_arr.push($id);
                            let $price_id_arr = [];
                            //loop the price normal array from input obj
                            if (rate_normal && rate_normal.length) {
                                for (normal_rate_item of rate_normal) {
                                    normal_rate_item = await handy.transformnames('RTL', normal_rate_item, "InventoryRateDetails");
                                    let price_id = normal_rate_item["price_id"];
                                    normal_rate_item.is_normal = 1;
                                    normal_rate_item._inventory_rate_id_fk = $id;
                                    if (price_id) {
                                        normal_rate_item.updated_by = user.user_id;
                                        await InventoryRateDetails.update(normal_rate_item, { where: { __inventory_rate_detail_id_pk: price_id } })
                                    } else {
                                        normal_rate_item.created_by = user.user_id
                                        normal_rate_item.created_at = new Date();
                                        let price_data = await InventoryRateDetails.create(normal_rate_item);
                                        price_id = price_data.__inventory_rate_detail_id_pk;
                                    }
                                    $price_id_arr.push(price_id);
                                }
                            }
                            if (rate_extra && rate_extra.length) {
                                for (extra_rate_item of rate_extra) {
                                    extra_rate_item = await handy.transformnames('RTL', extra_rate_item, "InventoryRateDetails");
                                    let price_id = extra_rate_item["price_id"];
                                    extra_rate_item.is_extra = 1;
                                    extra_rate_item._inventory_rate_id_fk = $id;
                                    if (price_id) {
                                        extra_rate_item.updated_by = user.user_id;
                                        await InventoryRateDetails.update(extra_rate_item, { where: { __inventory_rate_detail_id_pk: price_id } })
                                    } else {
                                        extra_rate_item.created_by = user.user_id
                                        extra_rate_item.created_at = new Date();
                                        let price_data = await InventoryRateDetails.create(extra_rate_item);
                                        price_id = price_data.__inventory_rate_detail_id_pk;
                                    }
                                    $price_id_arr.push(price_id);
                                }
                            }
                            if ($price_id_arr.length) {
                                InventoryRateDetails.destroy({ where: { __inventory_rate_detail_id_pk: { [Op.notIn]: $price_id_arr }, _inventory_rate_id_fk: $id } });
                            }
                        }
                        if ($rate_id_arr.length) {
                            InventoryRate.destroy({ where: { __inventory_rate_id_pk: { [Op.notIn]: $rate_id_arr }, _inventory_id_fk: inventory_id } });
                        }
                    }
                }
                //getting the result for updated one
                //$res = $this->get_item_rate($inventory_id);
                let data = await getRate(inventory_id);
                if (data) {
                    res.status(200).send({ status: true, data });
                } else {
                    res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This function for create or update the inventory rates
     * @param $inventory_id,  inventory id
     * @returns status and updated data
     */
    fastify.post('/item/rate/update', async (req, res) => {
        let user = await handy.verfiytoken(req, res);
        if (!user) return;
        try {
            let data = await handy.create_update_table(req.body, user, InventoryRate, "InventoryRate", "__inventory_rate_id_pk");
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }

        } catch (e) {
            res.status(501).send(e);
        }
    });

    /**
     * @author Kirankumar
     * @summary This function for create or update the depot qty
     * @param inventory_id,  business_id
     * @returns status and updated data
     */
    fastify.post('/item/depot/update', async (req, res) => {
        let user = await handy.verfiytoken(req, res);
        if (!user) return;
        try {
            let data = await create_or_update_depot(req.body, user);
            if (data.status) {
                res.status(200).send(data);
            } else {
                res.status(500).send(data);
            }

        } catch (e) {
            res.status(501).send(e);
        }
    });
    /**
     * @author Kirankumar
     * @summary This function is used for create or update the depot qty
     * @param {Input data} data 
     * @param {Logged in user details} user 
     * @return status and message
     */
    async function create_or_update_depot(body, user) {
        if (body.inventory_id && body.business_id && body.qty) {
            //let data = await handy.create_update_table(req.body, user, InventoryRate, "InventoryRate", "__inventory_rate_id_pk");
            const depot = await InvetoryBusiness.findOrCreate({
                where: {
                    _inventory_id_fk: body.inventory_id,
                    _business_id_fk: body.business_id
                },
                defaults: {
                    qty: body.qty
                }
            })
            if (!depot[1]) {
                depot[0].qty = body.qty;
                await InvetoryBusiness.update({ qty: body.qty }, { where: { __invetory_business_id_pk: depot[0].__invetory_business_id_pk } })
            }
            const data = await handy.transformnames('LTR', depot[0], "InvetoryBusiness");
            return { status: true, data }
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }

    /**
     * @author Kirankumar
     * @summary This rout is used for get inventory history Data
     * @returns status and history data
     */
    fastify.post('/inventory/history/get/:inventory_id', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const body = req.body;
            if (body && req.params.inventory_id) {
                const condition = {};
                const where = {};
                if (body.start_date && body.end_date) {
                    where.date = { [Op.and]: { [Op.between]: [body.start_date, body.end_date], [Op.ne]: null } };

                } else {
                    condition.order = ["created_at", "desc"];
                    condition.limit = 10;
                }
                where._inventory_id_fk = req.params.inventory_id;
                condition.where = where;
                //where._rental_id_fk     = await handy.filters(0,"neq");
                const items_data = await RentalItems.findAll({
                    attributes: ["_rental_id_fk", "qty", "units", "unit_price", "date", "date_end"],
                    where
                });
                let history = [];
                const rental_ids = [];
                for (item_data of items_data) {
                    if (item_data._rental_id_fk && !(rental_ids.indexOf(item_data._rental_id_fk) >= 0)) {
                        rental_ids.push(item_data._rental_id_fk)
                        let { units, qty, unit_price } = item_data;
                        units = units || 0; qty = qty || 0; unit_price = unit_price || 0;
                        let price = 0;
                        if (units && qty)
                            price = units * qty * unit_price;
                        else if (units)
                            price = units * unit_price;
                        else
                            price = qty * unit_price;

                        Rental.belongsTo(Client, { targetKey: '__client_id_pk', foreignKey: '_client_id_fk', })
                        Rental.belongsTo(ConfigRentalStatus, { targetKey: '__config_rental_status_id_pk', foreignKey: '_config_rental_status_id_fk' })
                        let rental_data = await Rental.findOne({
                            attributes: ["__rental_id_pk", "company", "address_full", "time_start", "time_end", "pickup", "delivery"], where: {
                                __rental_id_pk: item_data._rental_id_fk
                            }, include: [{
                                model: Client,
                                attributes: ["account_name", "telephone"]
                            }, {
                                model: ConfigRentalStatus,
                                attributes: ["status_label", "color_code"]
                            }]
                        })
                        rental_data = await handy.transformnames('LTR', rental_data, "Rental", { client: "Client", config_rental_status: "ConfigRentalStatus" });
                        if (rental_data && Object.keys(rental_data).length > 0) {
                            rental_data.qty = qty;
                            rental_data.price = price;
                            rental_data.date_start = item_data.date;
                            rental_data.date_end = item_data.date_end;
                            let rental_items_data = await RentalItems.findAll({ attributes: ["__rental_item_id_pk", "_client_id_fk", "_inventory_id_fk", "_rental_id_fk", "_rental_item_id_fk", "item", "qty", "date", "date_end"], where: { _rental_id_fk: item_data._rental_id_fk } });
                            rental_data.items = await handy.transformnames('LTR', rental_items_data, "RentalItems");
                            history.push(rental_data);
                        }
                    }
                }
                res.status(200).send({ status: true, data: history })
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @depricated 1.0.0 api exist in service router
     * @author Kirankumar
     * @summary This rout is used for get task data for inventory by inventory id
     * @returns status and task data
     */
    fastify.get('/inventory/maintenance/get/:inventory_id', async (req, res) => {
        let user = await handy.verfiytoken(req, res);
        if (!user) return;
        try {
            if (req.params && req.params.inventory_id) {
                let data = await Task.findAll({ raw: true, attributes: ["__task_id_pk", "_inventory_id_fk", "asset_no", "date_start", "status", "description", "summary", "is_repeated", "is_invoiced"], where: { _inventory_id_fk: req.params.inventory_id, is_deleted: 0 } });
                for (const key in data) {
                    const task_id = data[key].__task_id_pk;
                    data[key].cost = await RentalItems.sum("amount", { where: { _task_id_fk: task_id } });
                }
                data = await handy.transformnames('LTR', data, "Task");
                res.status(200).send({ status: true, data });
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for delete the task(maintenance) by task id
     * @return status and message
     */
    fastify.delete('/inventory/maintenance/delete/:task_id', async (req, res) => {
        let user = await handy.verfiytoken(req, res);
        if (!user) return;
        try {
            if (req.params && req.params.task_id) {
                const count = await Task.count({ where: { __task_id_pk: req.params.task_id, is_deleted: 0 } });
                if (count) {
                    const data = await handy.delete_task({ task_ids: [req.params.task_id] }, user)
                    if (data.status) {
                        res.status(200).send(data);
                    } else {
                        res.status(500).send(data);
                    }
                    // const del_status = await Task.update({ is_deleted: 1 }, { where: { __task_id_pk: req.params.task_id } });
                    // if (del_status && del_status[0]) {
                    //     //await RentalItems.update({ is_deleted: 1 }, { where: { _task_id_fk: req.params.task_id } });
                    //     await RentalItems.destroy({ where: { _task_id_fk: req.params.task_id } });
                    //     res.status(200).send({ status: true, message: lang("Validation.record_deleted", user.lang) });
                    // } else {
                    //     res.status(501).send({ status: false, message: lang('Validation.record_not_deleted', user.lang) });
                    // }
                } else {
                    res.status(404).send({ status: false, message: lang("Validation.record_not_exist", user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This function is used for get the components.
     * @param {List of Inventory data} inventory_data 
     * @returns Inventory data
     */
    async function getComponent(inventory_data) {
        if (inventory_data && inventory_data.length) {
            for (item_id in inventory_data) {
                let components = await InventoryComponent.findAll({ raw: true, order: [["sort_order", "ASC"]], where: { _inventory_id_fk: inventory_data[item_id].inventory_id } });
                components = await handy.transformnames('LTR', components, "InventoryComponent");
                inventory_data[item_id].component = components ? components : [];
            }
        }
        return inventory_data;
    }

    /**
     * @author Kirankumar
     * @summary This function is used for create or update the rats.
     * @param {Inventory data} item_data 
     * @param {Logged in user} user 
     * @returns Status and updated data
     */
    async function create_or_update_item(item_data, user) {
        if (!item_data) {
            return { status: false, message: lang("Validation.invalid_data", user.lang) };
        }
        if (!item_data.inventory_id && !item_data.item_type_id) {
            return { status: false, message: lang("Validation.invalid_data", user.lang) };
        }
        if (item_data && Object.keys(item_data).length && item_data.sku) {
            const inventory_id = item_data.inventory_id;
            let where = {};
            where.sku = await handy.filters(item_data.sku, "eq");
            if (inventory_id) {
                where.__inventory_id_pk = await handy.filters(inventory_id, "neq");
            }
            const count = await Inventory.count({ where });
            if (count) {
                return { status: false, message: lang("Validation.sku_invalid", user.lang) };
            }
        }
        const data = await handy.create_update_table(item_data, user, Inventory, "Inventory", "__inventory_id_pk");
        if (!item_data.inventory_id && data.data) {
            const out_inventory_id = data.data.inventory_id;
            if (out_inventory_id) {
                data.data.rate_list = await createRates(out_inventory_id, item_data._item_type_id_fk, user);
            }
        }
        return data;
    }

    /**
     * @summary This function is used for create the rates data for inventory
     * @author Kirankumar
     * @param {Inventory id} inventory_id 
     * @param {Item type id} type_id 
     * @returns List of created data
     */
    async function createRates(inventory_id, type_id, user) {
        let data = [];
        if (inventory_id && type_id) {
            await InventoryRate.destroy({ where: { _inventory_id_fk: inventory_id } })
            let update_rate = await Rate.findAll({
                raw: true, attributes: [["__rate_config_id_pk", "_rate_config_id_fk"],
                ["label", "rate_name"],
                ["in_days", "period_days"],
                ["label_name", "rate_label"],
                    "is_daily",
                    "is_hourly"
                ], where: { compeny_id: user.company_id, _item_type_id_fk: type_id }
            })
            if (update_rate.length) {
                update_rate = update_rate.map(element => {
                    element._inventory_id_fk = inventory_id;
                    return element;
                })
                const created_rate_data = await InventoryRate.bulkCreate(update_rate);
                data = await handy.transformnames("LTR", created_rate_data, "InventoryRate")
            }
        }
        return data;
    }

    /**
     * @author Kirankumar
     * @summary This function is used for create the assets data for inventory
     * @param {inventory id} inventory_id 
     * @param {Logged in user} user 
     * @returns status and assets list of data
     */
    async function createAssets(inventory_id, user) {
        const inventory_data = await Inventory.findOne({ attributes: ["is_track_serial_no", "starting_qty", "model_no", "brand", "item"], where: { __inventory_id_pk: inventory_id } });
        const admin = await Administration.findOne({ attributes: ["period"], where: { _company_id_fk: user.company_id } });
        let test_period = admin ? admin.period || 0 : 0;
        if (inventory_data) {
            if (inventory_data.is_track_serial_no) {
                const starting_qty = inventory_data.starting_qty;
                const asset_data = await AssetManagement.findAll({ attributes: ["__asset_management_id_pk"], where: { _inventory_id_fk: inventory_id }, order: [['__asset_management_id_pk', 'DESC']] });
                if (starting_qty < asset_data.length) {
                    const diff = asset_data.length - starting_qty;
                    const delet_ids = await AssetManagement.destroy({ where: { _inventory_id_fk: inventory_id }, order: [['__asset_management_id_pk', 'DESC']], limit: diff });
                } else if (starting_qty > asset_data.length) {
                    const diff = starting_qty - asset_data.length;
                    let max = await AssetManagement.max('serial_no', { where: { _inventory_id_fk: inventory_id } });
                    const date = new Date();
                    let update_data = [];
                    for (key = 0; key < diff; key++) {
                        update_data.push({
                            _inventory_id_fk: inventory_id,
                            serial_no: ++max,
                            item_name: inventory_data.item,
                            test_date_next: new Date(new Date().setDate(date.getDate() + 30)),
                            record_status: "Active",
                            active: 1,
                            created_by: user.user_id,
                            created_at: date,
                            brand: inventory_data.brand,
                            model_no: inventory_data.model_no,
                            period_till_service: 0,
                            hours_used: 0,
                            test_period,
                            //test_date_next : TestDate   +  TestPeriod
                        });
                    }
                    await AssetManagement.bulkCreate(update_data);
                }
                let data = await get_assets(inventory_id);
                const stock_data = await handy.updateStock(inventory_id);
                data = { ...stock_data, asset_list: data };
                return { status: true, data };
            } else {
                return { status: false, message: lang('Validation.not_track_serial', user.lang) };
            }
        } else {
            return { status: false, message: lang('Validation.invalid_inventory_id', user.lang) };
        }
    }

    /**
     * @author Kirankumar
     * @summary This function is used for get assets for inventory by inventory id
     * @param {inventory id} inventory_id 
     * @returns list of asset data
     */
    async function get_assets(inventory_id, required) {
        const query = { where: { _inventory_id_fk: inventory_id } };
        if (required && required.length) {
            query.attributes = required
        }
        let data = await AssetManagement.findAll(query);
        data = await handy.transformnames('LTR', data, "AssetManagement");
        return data ? data : [];
    }


    /**
     * @author Kirankumar
     * @summary This rout is used for get inventory list with some conditions
     * @param {company id} company_id 
     * @param {inventory id} item_id 
     * @param {inventory type} item_type 
     * @param {inventory category} itam_category 
     * @param {inventory query data} item_search 
     * @param {ignore null or not} ignore_empty 
     * @returns list of inventory data
     */
    async function getInventory(user, item_id = "", item_type = "", itam_category = "", item_search = "", ignore_empty = true, rental_id = "") {
        const company_id = user.company_id;
        let where_con = {};
        let is_get_by_id = 0;
        let admin = await Administration.findOne({ attributes: ["checkbox_show_supplier_code", "bond_rate"], where: { _company_id_fk: user.company_id } });
        let attributes = ["__inventory_id_pk", "item", "sku", "prompt", "is_track_serial_no", "category", "taxable", "on_hand", "total_inactive", "location", "replacement_cost"];
        if (admin && admin.checkbox_show_supplier_code)
            attributes.push("supplier_code");
        if (item_id) {
            where_con.__inventory_id_pk = item_id;
            is_get_by_id = 1;
            attributes = { exclude: ["updated_at", "created_at", "updated_by", "created_by"] }
        } else if (item_type) {
            where_con._item_type_id_fk = item_type;
        } else if (itam_category) {
            where_con.category = itam_category;
        } else if (item_search) {
            where_con = {
                [Op.or]: [{
                    sku: {
                        [Op.like]: item_search
                    }
                }, {
                    item: {
                        [Op.like]: item_search
                    }
                }]
            };
        } else if (ignore_empty) {
            where_con = {
                [Op.not]: [{
                    item: ""
                }, {
                    sku: ""
                }]
            };
        } else {
            return { status: false, data: [] }
        }
        where_con._company_id_fk = company_id;
        where_con.is_deleted = 0;
        Inventory.belongsTo(ItemType, { targetKey: '__item_type_id_pk', foreignKey: '_item_type_id_fk' });
        let inventory_data = await Inventory.findAll({
            attributes,
            where: where_con, include: {
                model: ItemType,
                attributes: ["type_name"]
            }
        });
        inventory_data = handy.transformnames('LTR', inventory_data, "Inventory", { item_type: "ItemType" });
        //InventoryRateDetails.findAll({ raw: true,where:{_inventory_id_fk:inventory_id}})
        if (inventory_data && inventory_data.length) {
            for (let key in inventory_data) {
                item_id = inventory_data[key].inventory_id;
                let rate_details = [];
                if (is_get_by_id) {
                    rate_details = await getRate(item_id)
                }
                InventoryComponent.belongsTo(Inventory, { targetKey: '__inventory_id_pk', foreignKey: '_parent_inventory_id_fk' });
                let components = await InventoryComponent.findAll({
                    attributes: ["__inventory_component_id_pk", "_inventory_id_fk", "_parent_inventory_id_fk", "item", "is_show_on_docket", "price", "quantity", "sort_order"],
                    where: { _inventory_id_fk: item_id }, order: [["sort_order", "ASC"]], include: {
                        model: Inventory,
                        attributes: ["zz__available_qty", "sku", "category", "taxable", "on_hand", "total_inactive", "is_track_serial_no"],
                        include: {
                            model: ItemType,
                            attributes: ["type_name"]
                        }
                    }
                });
                components = await handy.transformnames('LTR', components, "InventoryComponent", { inventory: "Inventory" });
                for (com_key in components) {
                    components[com_key] = await handy.transformnames('LTR', components[com_key], "InventoryComponent", { item_type: "ItemType" });
                }
                inventory_data[key].component = components ? components : [];
                if (is_get_by_id)
                    inventory_data[key].rate_details = rate_details ? rate_details : [];
                inventory_data[key].files = await getFiles(item_id);
                inventory_data[key].depot_stock = await get_inventory_business_allocation(item_id, user)
                let data_to_update = {
                    "inventory_ids": [item_id],
                    "rental_id": rental_id
                }
                //rental id
                if (rental_id) {
                    let availableqty = await handy.inventory_available_stock(data_to_update, user);
                    inventory_data[key].zz__available_qty = availableqty.data && availableqty.data.length > 0 && availableqty.data[0] ? availableqty.data[0].zz_available_qty : 0;
                }
                if (!inventory_data[key].bond) {
                    inventory_data[key].bond = admin["bond_rate"];
                }
            }

        } else {
            inventory_data = [];
        }
        return { status: true, data: inventory_data };
    }
    /**
     * @author Kirankumar
     * @ignore 1.0.0
     * @summary This fuction is used for geet rate list for inventory by inventory id
     * @param {inventory id} inventory_id 
     * @returns rate list
     */
    async function getRate(inventory_id) {
        //InventoryRate.belongsTo(Rate, { targetKey: '__rate_config_id_pk', foreignKey: '_rate_config_id_fk', });
        let rate_data = await InventoryRate.findAll({
            attributes: { exclude: ["updated_at", "created_at", "updated_by", "created_by"] }, where: { _inventory_id_fk: inventory_id },
            // include: [{
            //     model: Rate,
            //     attributes: [["label", "rate_category"]]
            // }]
        });
        rate_data = handy.transformnames('LTR', rate_data, "InventoryRate", { config_rate: "Rate" });
        //Not in use
        // for(let key in rate_data){
        //     let rate = rate_data[key];
        //     let rate_details = await InventoryRateDetails.findAll({ raw: true,where:{_inventory_rate_id_fk:rate.inventory_rate_id}})
        //     rate_details = rate_details?rate_details:[];
        //     if(rate_details.length){
        //         rate_details = handy.transformnames('LTR',rate_details,"InventoryRateDetails");
        //     }
        //     let normal = [];
        //     let extra  = [];
        //     for(rate_details_item of rate_details){
        //         if(rate_details_item.is_normal > 0){
        //             normal.push(rate_details_item)
        //         }else{
        //             extra.push(rate_details_item);
        //         }
        //     }
        //     rate_data[key].rate = {normal,extra};
        //     //rate_data[key].rate = rate_details;
        // }
        rate_data = rate_data ? rate_data : [];
        return rate_data;
    }

    /**
     * @author Kirankumar
     * @summary This function is used for get the files for inventory by inventory list
     * @param {Inventory id} inventory_id 
     * @returns file list
     */
    async function getFiles(inventory_id) {
        const files = await Upload.findAll({ raw: true, where: { _inventory_id_fk: inventory_id, is_deleted: 0 }, attributes: [['__upload_id_pk', 'file_id'], 'file_name', 'name_ref', 'file_name_fm', 'is_main_file', 'is_revenue'] });
        return files ? files : [];
    }
    /**
     * @author Kirankumar
     * @summary This function is used for get the business and it's qty for inventory.
     * @param {inventory id} inventory_id 
     * @param {Logged in user data} user 
     * @returns list of business list with qty
     */
    async function get_inventory_business_allocation(inventory_id, user) {
        if (inventory_id) {
            const business = await ConfigBusiness.findAll({ raw: true, attributes: [["__business_id_pk", "business_id"], ["company", "label"]], where: { _company_id_fk: user.company_id, is_deleted: 0 } })
            for (let key in business) {
                business[key].qty = await InvetoryBusiness.findOne({ attributes: ["qty"], where: { _business_id_fk: business[key].business_id, _inventory_id_fk: inventory_id } }) || 0;
                business[key].qty = business[key].qty.qty ? business[key].qty.qty : business[key].qty;
            }
            return business;
        } else {
            return { status: false, message: lang('Validation.invalid_data', user.lang) };
        }
    }
    /**
     * @author Kirankumar
     * @summary This rout is used for get task data for inventory by inventory id
     * @returns status and task data
     */
    fastify.post('/inventory/availableqty/get', async (req, res) => {
        let user = await handy.verfiytoken(req, res);
        if (!user) return;
        try {
            if (req.body && req.body.inventory_ids && req.body.rental_id) {
                const data = await handy.inventory_available_stock(req.body, user);
                if (data.status) {
                    res.status(200).send(data);

                } else {
                    res.status(500).send(data);
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @summary This rout is used for get task data for inventory by inventory id
     * @returns status and task data
     */
    fastify.post('/inventory/excel/get', async (req, res) => {
        let user = await handy.verfiytoken(req, res);
        if (!user) return;
        try {
            const data = await get_inventory_excel(req, user);
            if (data.status) {
                res.status(200).send(data);

            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })
    /**
     * @author Kirankumar
     * @summary This function is used for get excel file for filtered Inventories
     * @param {HTTP request} req 
     * @param {Logged in user details} user
     * @returns Json 
     */
    async function get_inventory_excel(req, user) {
        let return_data = {};
        const column_names = {
            inventory_id: "Inventory id",
            type: "Type",
            sku: "SKU"
        };
        const condition = await inventory_filtes(req, user);
        if (condition.attributes && condition.attributes.length) {
        } else {
            condition.attributes = ["__inventory_id_pk"];
        }
        if (condition.attributes.indexOf("files") >= 0) {
            condition.attributes.splice(condition.attributes.indexOf("files"), 1);
        }
        Inventory.belongsTo(ItemType, { targetKey: '__item_type_id_pk', foreignKey: '_item_type_id_fk', })
        let res_data = await Inventory.findAll(condition);
        res_data = await handy.transformnames('LTR', res_data, "Inventory", { item_type: "ItemType" });

        //To make header bold in excel
        let styles = {
            headerDark: {
                font: {
                    bold: true
                }
            }
        };

        columns = {};
        let res_columns = [];
        if (res_data && res_data.length) {
            res_columns = Object.keys(res_data[0]);
        }
        for (let name of res_columns) {
            columns[name] = {
                displayName: column_names[name] || name, // <- Here you specify the column header
                headerStyle: styles.headerDark, // <- Header style
                width: 120 // <- width in pixels
            }
        }
        let excel_data = [{
            sheet: "Inventory",
            content: res_data,
            columns
        }];
        return_data = await handy.create_excel_file(excel_data, {}, user, "Inventory");
        return { status: true, data: return_data };
    }
    /**
     * @author Kirankumar
     * @deprecated 1.0.0
     * @summary This function is used for get asset by asset id
     * @param {asset id} asset_id 
     * @returns asset data
     */
    async function get_asset(asset_id) {
        let data = await AssetManagement.findAll({ raw: true, attributes: { exclude: ["updated_at", "created_at", "updated_by", "created_by"] }, where: { __asset_management_id_pk: asset_id } });
        data = await handy.transformnames('LTR', data, "AssetManagement");
        return data ? data : [];
    }

    /**
     * @author Kirankumar
     * @ignore 1.0.0
     * @summary This function is used for get rate list for company by company id
     * @param {company id} company_id 
     * @returns list of rates
     */
    async function getRateList(company_id) {
        let rate_data = await Rate.findAll({ attributes: [[`__rate_config_id_pk`, 'id'], `label`, `label_name`, `price`, "in_hours", "in_days"], where: { compeny_id: company_id } });
        rate_data = handy.transformnames('LTR', rate_data, "Rate");
        rate_data = rate_data ? rate_data : [];
        return rate_data;
    }

    /**
     * @author Kirankumar
     * @deprecated 1.0.0
     * @summary this will update the stock count in inventory table when create the inventory order
     * @param $inventory_id, inventory id (mandatory)
     * @param $stock_count, inventory stock count (mandatory)
     * @returns 0 or 1
     */
    async function add_inventory_stock(inventory_id, stock_count) {
        let res = false;

        let result = await Inventory.findOne({
            attributes: ["stock"], where: {
                __inventory_id_pk: inventory_id
            }
        });
        if (result.stock) {
            res = await Inventory.update({ stock: parseInt(result.stock) + parseInt(stock_count) }, { where: { __inventory_id_pk: inventory_id } });
        }
        return res[0];
    }

    // async function insert_update_order(req,res, order_id = ''){
    //     try{
    //         let user = await handy.verfiytoken(req,res);
    //         if(!user)return;
    //         let status_data={};
    //         let data = req.body;
    //         if(data){
    //             const inventory_id = data.inventory_id;
    //             if(inventory_id){
    //                 data = await handy.transformnames('RTL',data,"InventoryOrder");
    //                 if(order_id){
    //                     status_data = await InventoryOrder.update(data,{where:{__inventory_order_id_pk:order_id}});
    //                 }else{
    //                     status_data =  await InventoryOrder.create(data);
    //                 }
    //                 if(data.qty > 0)
    //                 add_inventory_stock(inventory_id,data.qty);
    //                 if(status_data.__inventory_order_id_pk){
    //                     const ser_count = await Inventory.count({where:{__inventory_id_pk:inventory_id,is_track_serial_no:"1"}})
    //                     if(ser_count && !order_id && status_data.amount){
    //                         const inv_data = await Inventory.findOne({attributes:["item"], where:{__inventory_id_pk:inventory_id}});
    //                         let create_data = {
    //                             _inventory_id_fk:inventory_id,
    //                             item_name:inv_data.item,
    //                             purchase_amount:status_data.amount,
    //                             created_by:user.user_id,
    //                             created_at:new Date()
    //                         }
    //                         const asset_data =  await AssetManagement.create(create_data);
    //                     }
    //                 }
    //                 const res_dat = await getItemOrder(inventory_id);
    //                 res.status(200).send({status:true,data:res_dat});
    //             }else{
    //                 res.status(501).send({status:false,message:lang("Validation.invalid_data",user.lang)});
    //                 return;
    //             }
    //         }else{
    //             res.status(501).send({status:false,message:lang("Validation.invalid_data",user.lang)});
    //             return;
    //         }
    //     }catch(e){
    //         res.status(501).send(e);
    //     }

    // }

    // async function getItemOrder(inventory_id){
    //     let data = await InventoryOrder.findAll({where:{_inventory_id_fk:inventory_id}})
    //     data = await handy.transformnames('LTR',data,"InventoryOrder");
    //     return data?data:[];
    // }

}

module.exports = InventoryRouter;