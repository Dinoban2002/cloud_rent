const { ConfigUnitType } = require("../models/Model")(
    ["ConfigUnitType"]
);
var handy = require("../config/common");
var lang = require('../language/translate').validationMsg;

async function UnitTypeRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary This rout is used for create or update the unit type
     * @returns status and updated data
     */
    fastify.post('/unittype/update', async (req, res) => {
        try {
            let user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await handy.create_update_table(req.body, user, ConfigUnitType, "ConfigUnitType", "__config_unit_type_id_pk");
            if (data.status) {
                res.status(200).send(data);
                handy.cacheDel(fastify.appCache, "unit_type_list", user, "company_" + user.company_id + "_drop_down_data");
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /** 
     * @author Kirankumar
     * @summary  This rout is used for delete unit type
     * @package {unit type id} type_id
     * @returns Status and message
     */

    fastify.delete('/unittype/delete/:type_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            if (req.params && req.params.type_id) {
                let data = await ConfigUnitType.destroy({ where: { __config_unit_type_id_pk: req.params.type_id } })
                if (data) {
                    res.status(200).send({ status: true, message: lang('Validation.record_deleted', user.lang) })
                    handy.cacheDel(fastify.appCache, "unit_type_list", user, "company_" + user.company_id + "_drop_down_data");
                } else {
                    res.status(404).send({ status: false, message: lang('Validation.record_not_exist', user.lang) });
                }
            } else {
                res.status(500).send({ status: false, message: lang('Validation.invalid_data', user.lang) })
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message })
        }
    })
}

module.exports = UnitTypeRouter;