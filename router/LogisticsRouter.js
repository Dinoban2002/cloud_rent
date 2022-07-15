var handy = require("../config/common");
const lgc = require("../controllers/LogisticsController.js");
async function LogisticsRouter(fastify, opts) {
    /**
     * @author Bharath
     * @summary This rout is usefull to get the logistics for rental
     * @requires {rental id}  rental_id
     * @returns Status and Logistics items
     */
    fastify.get('/logistics/rentalitem/get/:rental_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await lgc.get_rental_logistics(req.params, user);
            if (data.status) {
                res.status(200).send(data)
            } else {
                res.status(500).send(data)
            }
        }
        catch (e) {
            res.status(501).send({ status: false, message: e.message })
        }
    })

    /**
     * @author Bharath
     * @summary This rout is usefull to update delivery status
     * @requires {rental id}  rental_id
     * @returns Status and updated data
     */
    fastify.post('/logistics/delivery/settime', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await lgc.logistics_delivery_set_times(req.body, user);
            if (data.status) {
                res.status(200).send(data)
            } else {
                res.status(500).send(data)
            }
        } catch (e) {
            res.status(501).send({ status: false, message: e.message })
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is usefull to update delivery time and collection time
     * @requires {rental id}  rental_id
     * @returns Status and updated data
     */
    fastify.post('/logistics/delivery/set/:rental_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const data = await lgc.logistics_delivery_set(req.params, req.body, user);
            if (data.status) {
                res.status(200).send(data)
            } else {
                res.status(500).send(data)
            }
        } catch (e) {
            res.status(501).send({ status: false, message: e.message })
        }
    })

    /**
     * @ignore 1.0.0
     * @author Bharath
     * @summary This rout is usefull to update site details status
     * @requires {rental id}  rental_id
     * @returns Status and message
     */
    // fastify.post('/logistics/sitedetails/set/:rental_id', async (req, res) => {
    //     try {
    //         var user = await handy.verfiytoken(req, res);
    //         if (!user) return;
    //         var check_validate = await Rental.count({ where: { __rental_id_pk: req.params.rental_id, _company_id_fk: user.company_id } });
    //         if (!check_validate) {
    //             res.status(404).send({ status: false, message: translate('Validation.record_not_exist', user.lang) })
    //         }
    //         var data = req.body;
    //         data.updated_by = user.company_id;
    //         var update_rental = await Rental.update(data, { where: { __rental_id_pk: req.params.rental_id } });
    //         if (update_rental) {
    //             res.status(200).send({ status: true, message: translate('Validation.record_updated', user.lang) })
    //         }
    //         else {
    //             res.status(404).send({ status: false, message: translate('Validation.record_not_exist', user.lang) })
    //         }
    //     } catch (e) {
    //         res.status(500).send({ status: false, message: e.message })
    //     }
    // })
}
module.exports = LogisticsRouter;