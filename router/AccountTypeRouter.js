var commonchange = require("../config/common");
// const AccountypeModel = require("../models/AccountType");
const { AccountypeModel } = require("../models/Model")(["AccountypeModel"]);
var commonchange = require("../config/common");
var translate = require('../language/translate').validationMsg;

async function AccountTypeRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary This rout is usefull to delete the acount type by id
     * @return Status and message
     */
    fastify.delete('/accounttype/delete/:account_type_id', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            if (req.params.account_type_id) {
                var deleteRecord = await AccountypeModel.destroy({ where: { __account_type_id_pk: req.params.account_type_id, _company_id_fk: user.company_id } })
                if (deleteRecord) {
                    res.status(200).send({ status: false, message: translate('Validation.record_deleted', (user.lang === undefined) ? 'en' : user.lang) })
                    commonchange.cacheDel(fastify.appCache, "account_type_list", user, "company_" + user.company_id + "_drop_down_data");
                }
                else {
                    res.status(400).send({ status: false, message: translate('Validation.record_not_deleted', (user.lang === undefined) ? 'en' : user.lang) })
                }
            }
        } catch (e) {
            res.status(404).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This rout is usefull to get the acount type by id
     * @return Status and account type data
     */
    fastify.get('/accounttype/get/:account_type_id', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            if (req.params.account_type_id) {
                var accountIdquery = await getAccount(user, req.params.account_type_id)
                res.status(200).send(accountIdquery)
            }
        } catch (e) {
            res.status(404).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This rout is usefull to get the acount type data for conpany
     * @return Status and  list of account type data
     */
    fastify.get('/accounttype/get', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            var accountIdquery = await getAccount(user)
            res.status(200).send(accountIdquery)
        } catch (e) {
            res.status(404).send({ status: false, message: e.message });
        }
    })
    /**
     * @author Kirankumar
     * @summary This rout is used for update or create the account type
     * @returns Status and updated data
     */
    fastify.post('/accounttype/update', async (req, res) => {
        try {
            var user = await commonchange.verfiytoken(req, res);
            if (!user) return;
            const data = await handy.create_update_table(item_data, user, AccountypeModel, "AccountypeModel", "__account_type_id_pk");
            if (data.status) {
                res.status(200).send(data);
                commonchange.cacheDel(fastify.appCache, "account_type_list", user, "company_" + user.company_id + "_drop_down_data");
            } else {
                res.status(500).send(data);
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    // fastify.post('/accounttype/create', async (req, res) => {
    //     try {
    //         var user = await commonchange.verfiytoken(req, res);
    //         if (!user) return;
    //         if (req.body.name && req.body.is_active) {
    //             var createAccount = await AccountypeModel.create({ _company_id_fk: user.company_id, is_active: req.body.is_active, name: req.body.name, created_at: new Date() })
    //             createAccount = commonchange.transformnames('LTR', createAccount, "AccountTypeModel")
    //             if (createAccount) {
    //                 delete createAccount.created_at;
    //                 res.status(200).send({ status: true, data: createAccount });
    //             }
    //         }
    //         else {
    //             res.status(400).send({ status: false, message: translate('Validation.invalid_data', (user.lang === undefined) ? 'en' : user.lang) });
    //         }
    //     } catch (e) {
    //         res.status(404).send({ status: false, message: e.message });
    //     }
    // })

    // fastify.put('/accounttype/update/:account_type_id', async (req, res) => {
    //     try {
    //         var user = await commonchange.verfiytoken(req, res);
    //         if (!user) return;
    //         if (req.params.account_type_id) {
    //             var updaterecord = { __account_type_id_pk: req.params.account_type_id, _company_id_fk: user.company_id, is_active: req.body.is_active, name: req.body.name }
    //             var createAccount = await AccountypeModel.update(updaterecord, { where: { __account_type_id_pk: req.params.account_type_id, _company_id_fk: user.company_id } })
    //             createAccount = commonchange.transformnames('LTR', updaterecord, "AccountTypeModel")
    //             res.status(200).send({ status: true, data: createAccount });
    //         }
    //         else {
    //             res.status(400).send({ status: false, message: translate('Validation.record_not_updated', (user.lang === undefined) ? 'en' : user.lang) })
    //         }
    //     } catch (e) {
    //         res.status(404).send({ status: false, message: e.message });
    //     }
    // })

    /**
     * @author Kirankumar
     * @summary This rout is used for get the account type data
     * @param {logged in user details} user 
     * @param {account type id} account_id 
     * @returns Status and accpunt type data
     */
    async function getAccount(user, account_id = 0) {
        var where_con = {};
        if (account_id && user.company_id) {
            where_con = { _company_id_fk: user.company_id, __account_type_id_pk: account_id, is_active: 1 };
        }
        else {
            where_con = { _company_id_fk: user.company_id, is_active: 1 };
        }
        var accountIdquery = await AccountypeModel.findAll({ raw: true, order: [['name', 'ASC']], attributes: ['__account_type_id_pk', 'is_active', 'name', '_company_id_fk'], where: where_con });
        if (accountIdquery.length > 0) {
            accountIdquery = commonchange.transformnames('LTR', accountIdquery, "AccountTypeModel")
            return { status: true, data: accountIdquery };
        }
        else {
            return { status: false, message: translate('Validation.record_not_found', (user.lang === undefined) ? 'en' : user.lang) };
        }
    }
}
module.exports = AccountTypeRouter;