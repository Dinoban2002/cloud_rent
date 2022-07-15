const { Document } = require("../models/Model")(["Document"]);
let handy = require("../config/common");
let { lang } = handy;
const { Sequelize, DATE } = require('sequelize');
const Op = Sequelize.Op;

async function DocumentRouter(fastify, opts) {
  /**
   * @author Kirankumar
   * @summary This rout is usefull to create or update the document record
   * @returns Document data
   */
  fastify.post('/documentstore/update', async (req, res) => {
    try {
      const user = await handy.verfiytoken(req, res);
      if (!user) return;
      const data = await create_update_document(req.body, user);
      if (data.status) {
        res.status(200).send(data);
      } else {
        res.status(500).send(data);
      }
    } catch (e) {
      res.status(501).send({ status: false, message: e.message });
    }
  })
  /**
     * @author Kirankumar
     * @summary This rout is usefull to get the documents
     * @returns Document data
     */
  fastify.get('/documentstore/get/:rental_id', async (req, res) => {
    try {
      const user = await handy.verfiytoken(req, res);
      if (!user) return;
      const data = await getDocuments(req.params.rental_id, user);
      if (data.status) {
        res.status(200).send(data);
      } else {
        res.status(500).send(data);
      }
    } catch (e) {
      res.status(501).send({ status: false, message: e.message });
    }
  })

  /**
     * @author Kirankumar
     * @summary This rout is usefull to delete the document record
     * @returns Document data
     */
  fastify.delete('/documentstore/delete/:document_id', async (req, res) => {
    try {
      const user = await handy.verfiytoken(req, res);
      if (!user) return;
      const data = await deleteDocuments(req.params.document_id, user);
      if (data.status) {
        res.status(200).send(data);
      } else {
        res.status(500).send(data);
      }
    } catch (e) {
      res.status(501).send({ status: false, message: e.message });
    }
  })

  /**
   * @author Kirankumar
   * @summary This function is used for delete the document by id.
   * @param {document id} document_id 
   * @param {Logged in user details} user 
   * @returns Status ans message.
   */
  async function deleteDocuments(document_id, user) {
    if (document_id) {
      const count = await Document.count({ where: { __document_id_pk: document_id, is_deleted: 0 } });
      if (count) {
        await Document.update({ is_deleted: 1 }, { where: { __document_id_pk: document_id } });
        return { status: true, message: lang('Validation.record_deleted', user.lang) }
      } else {
        return { status: false, message: lang('Validation.record_not_exist', user.lang) };
      }
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  }

  /**
   * @author Kirankumar
   * @summary This function is usefull to create or update the document record
   * @param {rental_id || document_id} is mandatory
   * @returns updated Document json.
   */
  async function create_update_document(body, user) {
    if (body && (body.rental_id || body.document_id)) {
      return await handy.create_update_table(body, user, Document, "Document", "__document_id_pk");
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  }

  /**
   * @author Kirankumar
   * @summary This function is used for get documents for rental
   * @param {Rental id} rental_id 
   * @param {Loged in user datails} user 
   * @returns List of document data
   */
  async function getDocuments(rental_id, user) {
    if (rental_id) {
      let cosument_list = await Document.findAll({
        where: {
          _company_id_fk: user.company_id,
          is_deleted: 0,
          [Op.or]: [
            { checkbox_use_global: 1 },
            { _rental_id_fk: rental_id }
          ]
        }
      });
      cosument_list = handy.transformnames('LTR', cosument_list, "Document");
      return { status: true, data: cosument_list }
    } else {
      return { status: false, message: lang('Validation.invalid_data', user.lang) };
    }
  }
}
module.exports = DocumentRouter;