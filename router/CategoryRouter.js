var commonchange = require("../config/common");
const { CategoryModel } = require("../models/Model")(["CategoryModel"]);
const { AdministrationCategory } = require("../models/Model")(["AdministrationCategory"]);
//const Sequelize = require('sequelize');
var commonchange = require("../config/common");
var translate = require('../language/translate').validationMsg;

async function CategoryRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary This route is usefull to create the category
     * @returns Status and created data
     */
    fastify.post('/category/create', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            if (req.body.item_type_id && req.body.category_name) {
                var createcategory = await CategoryModel.create({ _item_type_id_fk: req.body.item_type_id, _company_id_fk: user.company_id, is_active: 1, category_name: req.body.category_name, created_at: new Date(), created_by: user.company_id })
                createcategory = commonchange.transformnames('LTR', createcategory, "CategoryModel")
                if (createcategory) {
                    delete createcategory.created_at;
                    delete createcategory.created_by;
                    res.status(200).send({ status: true, data: createcategory });
                    commonchange.cacheDel(fastify.appCache, "category_list", user, "company_" + user.company_id + "_drop_down_data");
                }
            }
            else {
                res.status(400).send({ status: false, message: translate('Validation.invalid_data', (user.lang === undefined) ? 'en' : user.lang) });
            }
        } catch (e) {
            res.status(404).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This route is usefull to update the category
     * @returns Status and category data
     */
    fastify.put('/category/update/:category_id', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            if (req.params.category_id) {
                var updaterecord = { _item_type_id_fk: req.body.item_type_id, _company_id_fk: user.company_id, category_name: req.body.category_name, updated_at: new Date(), updated_by: user.company_id }
                var updateCategory = await CategoryModel.update(updaterecord, { where: { __category_id_pk: req.params.category_id, _company_id_fk: user.company_id } })
                updateCategory = commonchange.transformnames('LTR', { __category_id_pk: req.params.category_id, category_name: req.body.category_name }, "CategoryModel")
                res.status(200).send({ status: true, data: [updateCategory] });
                commonchange.cacheDel(fastify.appCache, "category_list", user, "company_" + user.company_id + "_drop_down_data");
            }
            else {
                res.status(400).send({ status: false, message: translate('Validation.record_not_updated', (user.lang === undefined) ? 'en' : user.lang) })
            }
        } catch (e) {
            res.status(404).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This rout is usefull to delete the category
     * @returns Status and message
     */
    fastify.delete('/category/delete/:category_id', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            if (req.params.category_id) {
                var deleteRecord = await CategoryModel.update({ is_active: 0 }, { where: { __category_id_pk: req.params.category_id, _company_id_fk: user.company_id } })
                if (deleteRecord) {
                    res.status(200).send({ status: false, message: translate('Validation.record_deleted', user.lang) })
                    commonchange.cacheDel(fastify.appCache, "category_list", user, "company_" + user.company_id + "_drop_down_data");
                }
                else {
                    res.status(400).send({ status: false, message: translate('Validation.record_not_deleted', user.lang) })
                }
            }
        } catch (e) {
            res.status(404).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This rout is used for get category data by category id
     * @returns Status and category
     */
    fastify.get('/category/get/:category_id', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            if (req.params.category_id) {
                if (req.params.category_id == 'all') {
                    var getCategory = await CategoryModel.findAll({ order: [['category_name', 'ASC']], attributes: ['__category_id_pk', 'category_name'], where: { is_active: 1 } })
                } else {
                    var getCategory = await CategoryModel.findAll({ attributes: ['__category_id_pk', 'category_name'], where: { _item_type_id_fk: req.params.category_id, is_active: 1 } })
                }
                updateCategory = commonchange.transformnames('LTR', getCategory, "CategoryModel")
                res.status(200).send({ status: true, data: getCategory })
            }
            else {
                res.status(404).send({ status: false, message: translate('Validation.invalid_data', (user.lang === undefined) ? 'en' : user.lang) });
            }
        } catch (e) {
            res.status(404).send({ status: false, message: e.message });
        }
    })
    /**
     * @author JoysanJawahar
     * @summary This route is usefull to create the category in admin
     * @returns Status and message
     */
    fastify.post('/admin/category/update', async (req, res) => {
        try {
            let user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            const data = await commonchange.create_update_table(req.body, user, AdministrationCategory, "AdministrationCategory", "__category_admin_id_pk");
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
     * @author JoysanJawahar
     * @summary This route is usefull to delete the category in admin
     * @returns Status and created data
     */
    fastify.post('/admin/category/delete/:category_id', async (req, res) => {
        try {
            let user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            if (req.params.category_id) {
                const count = await AdministrationCategory.destroy({ where: { __category_admin_id_pk: req.params.category_id } });
                if (count) {
                    res.status(200).send({ status: true, message: translate('Validation.record_deleted', user.lang) });
                } else {
                    res.status(404).send({ status: false, message: translate('Validation.record_not_found', user.lang) });
                }
            } else {
                res.status(501).send({ status: false, message: translate('Validation.invalid_data', user.lang) });
            }
        } catch (e) {
            res.status(501).send(e);
        }
    });
    /**
     * @author Kirankumar
     * @summary This rout is used for get category data by category id
     * @returns Status and category
     */
    fastify.get('/admin/category/get/:category_id', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            if (req.params.category_id) {
                if (req.params.category_id == 'all') {
                    var getCategory = await AdministrationCategory.findAll({ order: [['category_name', 'ASC']], attributes: ['__category_admin_id_pk', 'category_name'] })
                } else {
                    var getCategory = await AdministrationCategory.findAll({ attributes: ['__category_admin_id_pk', 'category_name'], where: { __category_admin_id_pk: req.params.category_id } })
                }
                updateCategory = commonchange.transformnames('LTR', getCategory, "AdministrationCategory")
                res.status(200).send({ status: true, data: getCategory })
            }
            else {
                res.status(404).send({ status: false, message: translate('Validation.invalid_data', (user.lang === undefined) ? 'en' : user.lang) });
            }
        } catch (e) {
            res.status(404).send({ status: false, message: e.message });
        }
    })
}
module.exports = CategoryRouter;