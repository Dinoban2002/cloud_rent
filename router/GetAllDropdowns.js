const commonchange = require("../config/common");
const { Auth, ConfigCalendarStatus, ConfigBusiness, ConfigLocation, ConfigUnitType, Rate, ConfigRentalStatus, Terms, Inventory, AccountypeModel, ItemType, CreditCardRate, TaxRate, Countries, Client, CategoryModel, Resource, XeroCode, Task } = require("../models/Model")(
    ["Auth", "ConfigCalendarStatus", "ConfigBusiness", "ConfigLocation", "Rate", "ConfigUnitType", "ConfigRentalStatus", "Inventory", "Terms", "AccountypeModel", "ItemType", "CreditCardRate", "TaxRate", "Countries", "Client", "CategoryModel", "Resource", "XeroCode", "Task"]
);
const translate = require('../language/translate').validationMsg;
const { Sequelize } = require('sequelize');
const { Op } = Sequelize;
async function dropdownRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary This rout is used for get all drop down list
     * @input required keys for get required drop downs
     * @returns ctatus and Dropdown list data
     */
    fastify.post('/dropdown/get', async (req, res) => {
        try {
            let isDefault = true;
            let savedata = {};
            const requiredParam = req.body.required;
            let user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            let drop_down_data = fastify.appCache.get("company_" + user.company_id + "_drop_down_data") || {};
            let is_chache_updated = false;
            if (requiredParam !== undefined && requiredParam.length > 0) {
                isDefault = false;
            }
            if (isDefault || (requiredParam !== undefined && requiredParam.includes('rental_status_list'))) {
                if (drop_down_data.rental_status_list) {
                    savedata['rental_status_list'] = drop_down_data.rental_status_list;
                } else {
                    let rental_status_get = await ConfigRentalStatus.findAll({ order: [['status_label', 'ASC']], attributes: ['__config_rental_status_id_pk', ['status_label', 'label'], 'color_code'], where: { _company_id_fk: user.company_id } });
                    rental_status_get = commonchange.transformnames('LTR', rental_status_get, "ConfigRentalStatus");
                    drop_down_data.rental_status_list = savedata['rental_status_list'] = rental_status_get;
                    is_chache_updated = true;
                }

            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('term_list'))) {
                if (drop_down_data.term_list) {
                    savedata['term_list'] = drop_down_data.term_list;
                } else {
                    let term_get = await Terms.findAll({ order: [['term_label', 'ASC']], attributes: ['__config_term_id_pk', 'term_label'], where: { _company_id_fk: user.company_id } });
                    term_get = commonchange.transformnames('LTR', term_get, "Terms");
                    drop_down_data.term_list = savedata['term_list'] = term_get;
                    is_chache_updated = true;
                }

            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('business_list'))) {
                if (drop_down_data.business_list) {
                    savedata['business_list'] = drop_down_data.business_list;
                } else {
                    let business_get = await ConfigBusiness.findAll({ order: [['company', 'ASC']], attributes: ['__business_id_pk', 'company'], where: { _company_id_fk: user.company_id, is_deleted: 0 } });
                    business_get = commonchange.transformnames('LTR', business_get, "ConfigBusiness");
                    drop_down_data.business_list = savedata['business_list'] = business_get;
                    is_chache_updated = true;
                }

            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('tax_list'))) {
                if (drop_down_data.tax_list) {
                    savedata['tax_list'] = drop_down_data.tax_list;
                } else {
                    let tax_get = await TaxRate.findAll({ attributes: ['__tax_rate_id_pk', 'percentage', 'tax_code', 'tax_name', 'is_default'], where: { _company_id_fk: user.company_id } });
                    tax_get = commonchange.transformnames('LTR', tax_get, "TaxRate");
                    drop_down_data.tax_list = savedata['tax_list'] = tax_get;
                    is_chache_updated = true;
                }
            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('credit_rate_list'))) {
                if (drop_down_data.credit_rate_list) {
                    savedata['credit_rate_list'] = drop_down_data.credit_rate_list;
                } else {
                    let credit_get = await CreditCardRate.findAll({ attributes: ['__credit_card_rate_id_pk', 'card_name', 'card_percentage'], where: { _company_id_fk: user.company_id } });
                    credit_get = commonchange.transformnames('LTR', credit_get, "CreditCardRate");
                    drop_down_data.credit_rate_list = savedata['credit_rate_list'] = credit_get;
                    is_chache_updated = true;
                }
            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('rate_list'))) {
                if (drop_down_data.rate_list) {
                    savedata['rate_list'] = drop_down_data.rate_list;
                } else {
                    let rate_get = await Rate.findAll({ order: [['rates_order', 'ASC']], attributes: ['__rate_config_id_pk', 'label', 'label_name', 'price', 'in_days', 'is_hourly', 'is_daily', 'is_half_day', 'is_weekly', 'is_monthly', 'is_quarterly', 'is_half_yearly', 'is_yearly', 'rates_order', 'rate_type'], where: { compeny_id: user.company_id } });
                    rate_get = commonchange.transformnames('LTR', rate_get, "Rate");
                    drop_down_data.rate_list = savedata['rate_list'] = rate_get;
                    is_chache_updated = true;
                }

            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('item_type_list'))) {
                if (drop_down_data.item_type_list) {
                    savedata['item_type_list'] = drop_down_data.item_type_list;
                } else {
                    let item_get = await ItemType.findAll({ attributes: ['__item_type_id_pk', 'type_name', 'is_sell'] });
                    item_get = commonchange.transformnames('LTR', item_get, "ItemType");
                    drop_down_data.item_type_list = savedata['item_type_list'] = item_get;
                    is_chache_updated = true;
                }

            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('account_type_list'))) {
                if (drop_down_data.account_type_list) {
                    savedata['account_type_list'] = drop_down_data.account_type_list;
                } else {
                    let account_get = await AccountypeModel.findAll({ order: [['name', 'ASC']], attributes: ['__account_type_id_pk', '_company_id_fk', 'is_active', 'name'], where: { _company_id_fk: user.company_id } });
                    account_get = commonchange.transformnames('LTR', account_get, "AccountTypeModel");
                    drop_down_data.account_type_list = savedata['account_type_list'] = account_get;
                    is_chache_updated = true;
                }

            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('country_list'))) {
                if (drop_down_data.country_list) {
                    savedata['country_list'] = drop_down_data.country_list;
                } else {
                    let Countries_get = await Countries.findAll({ order: [['countries_name', 'ASC']], attributes: ['__countries_id_pk', 'countries_name', 'countries_iso_code', 'countries_isd_code'] });
                    Countries_get = commonchange.transformnames('LTR', Countries_get, "Countries");
                    drop_down_data.country_list = savedata['country_list'] = Countries_get;
                    is_chache_updated = true;
                }

            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('supplier_list'))) {
                // if (drop_down_data.supplier_list) {
                //     savedata['supplier_list'] = drop_down_data.supplier_list;
                // } else {
                let suplier_get = await Client.findAll({ order: [['__client_id_pk', 'ASC']], attributes: [['__client_id_pk', 'supplier_id'], 'account_name'], where: { is_supplier: 1, account_name: { [Op.ne]: '' }, account_name: { [Op.ne]: 'Null' } } });
                suplier_get = commonchange.transformnames('LTR', suplier_get, "Client");
                savedata['supplier_list'] = suplier_get;
                //is_chache_updated = true;
                //}

            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('category_list'))) {
                if (drop_down_data.category_list) {
                    savedata['category_list'] = drop_down_data.category_list;
                } else {
                    let Category_get = await CategoryModel.findAll({ attributes: ['__category_id_pk', 'category_name'], where: { _company_id_fk: user.company_id, is_active: 1 } });
                    Category_get = commonchange.transformnames('LTR', Category_get, "CategoryModel");
                    drop_down_data.category_list = savedata['category_list'] = Category_get;
                    is_chache_updated = true;
                }

            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('inventory_category_list'))) {
                // if (drop_down_data.inventory_category_list) {
                //     savedata['inventory_category_list'] = drop_down_data.inventory_category_list;
                // } else {
                let Category_get = await Inventory.findAll({
                    attributes: [
                        [Sequelize.fn('DISTINCT', Sequelize.col('category')), 'category']
                    ], order: [["category", "ASC"]]
                })
                //let Category_get = await Inventory.aggregate('category', 'DISTINCT', { plain: false })
                //drop_down_data.inventory_category_list = savedata['inventory_category_list'] = Category_get;
                savedata['inventory_category_list'] = Category_get;
                //is_chache_updated = true;
                //}
            }
            //task status list
            if (isDefault || (requiredParam !== undefined && requiredParam.includes('task_status_list'))) {
                // let Category_get = await Task.findAll({
                //     attributes: [
                //         [Sequelize.fn('DISTINCT', Sequelize.col('status')), 'status']
                //     ], where: { _company_id_fk: user.company_id }, order: [["status", "ASC"]]
                // })
                savedata['task_status_list'] = [{
                    status: "DUE",
                    color: "#CC281F"
                }, {
                    status: "OVERDUE",
                    color: "#CC281F"
                }, {
                    status: "PENDING",
                    color: "#FD9A00"
                }, {
                    status: "IN PROGRESS",
                    color: "#9CCB5D"
                }, {
                    status: "COMPLETED",
                    color: "#6293FE"
                }];
            }
            //task summary list
            if (isDefault || (requiredParam !== undefined && requiredParam.includes('task_summary_list'))) {
                let Category_get = await Task.findAll({
                    attributes: [
                        [Sequelize.fn('DISTINCT', Sequelize.col('summary')), 'summary']
                    ], where: {
                        _company_id_fk: user.company_id, summary: {
                            [Op.and]: [{
                                [Op.ne]: null,
                            }, {
                                [Op.ne]: "",
                            }]

                        }
                    }, order: [["summary", "ASC"]]
                })
                savedata['task_summary_list'] = Category_get;
            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('location_list'))) {
                if (drop_down_data.location_list) {
                    savedata['location_list'] = drop_down_data.location_list;
                } else {
                    let location_get = await ConfigLocation.findAll({ attributes: ['__config_location_id_pk', 'location_name'], where: { _company_id_fk: user.company_id, is_active: 1 } });
                    location_get = commonchange.transformnames('LTR', location_get, "ConfigLocation");
                    drop_down_data.location_list = savedata['location_list'] = location_get;
                    is_chache_updated = true;
                }

            }

            if (isDefault || (requiredParam !== undefined && requiredParam.includes('vehicle_list'))) {
                if (drop_down_data.vehicle_list && drop_down_data.vehicle_list.length) {
                    savedata['vehicle_list'] = drop_down_data.vehicle_list;
                } else {
                    let vehicle_get = await Resource.findAll({ attributes: ['__resource_id_pk', 'name'], where: { _company_id_fk: user.company_id, is_deleted: 0, type: { [Op.in]: ['VEHICLE'] } } });
                    vehicle_get = commonchange.transformnames('LTR', vehicle_get, "Resource");
                    drop_down_data.vehicle_list = savedata['vehicle_list'] = vehicle_get;
                    is_chache_updated = true;
                }

            }
            if (isDefault || (requiredParam !== undefined && requiredParam.includes('rate_item_type_list'))) {
                if (drop_down_data.rate_item_type_list) {
                    savedata['rate_item_type_list'] = drop_down_data.rate_item_type_list;
                } else {
                    let item_get = await ItemType.findAll({ attributes: ['__item_type_id_pk', 'type_name'], where: { is_rate_applicable: 1 } });
                    item_get = commonchange.transformnames('LTR', item_get, "ItemType");
                    drop_down_data.rate_item_type_list = savedata['rate_item_type_list'] = item_get;
                    is_chache_updated = true;
                }

            }
            if (isDefault || (requiredParam !== undefined && requiredParam.includes('driver_list'))) {
                if (drop_down_data.driver_list) {
                    savedata['driver_list'] = drop_down_data.driver_list;
                } else {
                    let driver_get = await Resource.findAll({ attributes: ['__resource_id_pk', '_staff_id_fk', 'name', "mobile"], where: { _company_id_fk: user.company_id, is_deleted: 0, type: { [Op.in]: ['STAFF'] } } });
                    driver_get = commonchange.transformnames('LTR', driver_get, "Resource");
                    drop_down_data.driver_list = savedata['driver_list'] = driver_get;
                    is_chache_updated = true;
                }

            }
            if (isDefault || (requiredParam !== undefined && requiredParam.includes('xero_list'))) {
                if (drop_down_data.xero_list) {
                    savedata['xero_list'] = drop_down_data.xero_list;
                } else {
                    let xero_get = await XeroCode.findAll({ attributes: ["__xero_code_id_pk", "name", "xero_id", "code"] });
                    xero_get = commonchange.transformnames('LTR', xero_get, "XeroCode");
                    drop_down_data.xero_list = savedata['xero_list'] = xero_get;
                    is_chache_updated = true;
                }

            }
            if (isDefault || (requiredParam !== undefined && requiredParam.includes('staff_list'))) {
                if (drop_down_data.staff_list) {
                    savedata['staff_list'] = drop_down_data.staff_list;
                } else {
                    let staff_list = await Auth.findAll({ attributes: ["__staff_id_pk", "display_staff_name"], where: { _company_id_fk: user.company_id, is_deleted: 0 } });
                    staff_list = commonchange.transformnames('LTR', staff_list, "Auth");
                    drop_down_data.staff_list = savedata['staff_list'] = staff_list;
                    is_chache_updated = true;
                }
            }
            if (isDefault || (requiredParam !== undefined && requiredParam.includes('unit_type_list'))) {
                if (drop_down_data.unit_type_list) {
                    savedata['unit_type_list'] = drop_down_data.unit_type_list;
                } else {
                    let unit_type_list = await ConfigUnitType.findAll({ attributes: ["__config_unit_type_id_pk", "unit_type"], where: { _company_id_fk: user.company_id } });
                    drop_down_data.unit_type_list = savedata['unit_type_list'] = commonchange.transformnames('LTR', unit_type_list, "ConfigUnitType");
                    is_chache_updated = true;
                }
            }
            if (isDefault || (requiredParam !== undefined && requiredParam.includes('calendar_status_list'))) {
                if (drop_down_data.calendar_status_list) {
                    savedata['calendar_status_list'] = drop_down_data.calendar_status_list;
                } else {
                    let calendar_status_list = await ConfigCalendarStatus.findAll({ attributes: ["__config_calendar_status_id_pk", "name", "color_rgb_value"], where: { _company_id_fk: user.company_id } });
                    drop_down_data.calendar_status_list = savedata['calendar_status_list'] = commonchange.transformnames('LTR', calendar_status_list, "ConfigCalendarStatus");
                    is_chache_updated = true;
                }
            }
            res.status(200).send({ status: true, data: savedata })
            if (is_chache_updated) {
                fastify.appCache.set("company_" + user.company_id + "_drop_down_data", drop_down_data)
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: translate('Validation.Exception', (user.lang === undefined) ? 'en' : user.lang) });
        }
    })
}
module.exports = dropdownRouter;