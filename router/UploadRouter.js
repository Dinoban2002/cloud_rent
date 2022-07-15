const { Upload, CompanySubscription } = require("../models/Model")(
    ["Upload", "CompanySubscription"]
);
const fs = require('fs')
const path = require('path')
var handy = require("../config/common");
var lang = require('../language/translate').validationMsg;
const { parsed: envs } = require('dotenv').config();
const { v4 } = require("uuid");

async function UploadRouter(fastify, opts) {
    /**
     * @author Kirankumar
     * @summary This rout is used for upload file
     * @returns status and message
     */
    fastify.post('/upload', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            // const files1 = await req.saveRequestFiles()
            const files = req.body["files[]"];
            const input_file_name = req.body["file_name"];
            const types = JSON.parse(envs.fille_types);
            let is_set_main = false;
            let is_set_revenue = false;
            let file_max_size = 1;
            let result_company = await CompanySubscription.findOne({ where: { _company_id_fk: user.company_id } });
            if (Object.keys(result_company).length) {
                file_max_size = result_company.file_max_size;
            }
            let files_valid = true;
            const pattern = new RegExp("((\\.exe|\\.dll|\\.ocx|\\.com|\\.bat)(\\.zip|\\.tar|\\.tgz|\\.taz|\\.z|\\.gz|\\.rar)?)$", "i");
            if (!files) {
                res.status(500).send({ status: false, message: lang("Validation.file_upload_empty", user.lang) });
            }
            for (file of files) {
                const { filepath, fieldname, filename, encoding, mimetype, fields } = file;
                if (filename.match(pattern) || ((file_max_size * 1024) <= file.data.length)) {
                    files_valid = false;
                    break;
                }

            }
            let out_data = [];
            let create_data = [];
            if (files_valid && files.length) {
                for (file of files) {
                    let { filepath, fieldname, filename, encoding, mimetype, fields } = file;
                    if (types.indexOf(req.body.type) >= 0) {
                        let upload_path = envs.documents_path + '/' + req.body.type;
                        if (!fs.existsSync(envs.documents_path)) {
                            fs.mkdirSync(envs.documents_path);
                        }
                        if (!fs.existsSync(upload_path)) {
                            fs.mkdirSync(upload_path);
                        }
                        const uid = v4();
                        const ext = path.extname(filename).toLowerCase();
                        const new_filename = uid + ext;
                        if (input_file_name)
                            filename = input_file_name;
                        fs.writeFileSync(upload_path + '/' + new_filename, file.data);
                        out_data.push({
                            file_name: new_filename,
                            file_type: mimetype,
                            ref_id: uid,
                            name: filename,
                        });
                        let create_file_data = {
                            file_name: filename,
                            file_path: upload_path + '/' + new_filename,
                            name_ref: uid,
                            file_name_fm: mimetype,
                            created_by: user.user_id,
                            created_at: new Date()
                        }
                        if (input_file_name) {
                            create_file_data.file_name = input_file_name;
                        }
                        if (req.body.inventory_id) {
                            create_file_data._inventory_id_fk = req.body.inventory_id
                            if (!is_set_main && req.body.is_main_file) {
                                is_set_main = true;
                                create_file_data.is_main_file = 1;
                                await Upload.update({ is_main_file: 0 }, { where: { _inventory_id_fk: req.body.inventory_id } });
                            } else if (!is_set_revenue && req.body.is_revenue) {
                                is_set_revenue = true;
                                create_file_data.is_revenue = 1;
                                await Upload.update({ is_revenue: 0 }, { where: { _inventory_id_fk: req.body.inventory_id } });
                            }
                        } else if (req.body && req.body.rental_id) {
                            create_file_data._rental_id_fk = req.body.rental_id;
                            create_file_data.is_signature = req.body.is_signature;
                        }
                        create_data.push(create_file_data);
                    }
                }
                const data = await Upload.bulkCreate(create_data);
                res.status(200).send({ status: true, data: out_data });
            } else {
                res.status(501).send({ status: false, message: lang("Validation.file_upload_fail", user.lang) });
                return;
            }
        } catch (e) {
            res.status(501).send(e);
        }
    })

    /**
     * @author Kirankumar
     * @summary This rout is used for delete file by file id
     * @returns status and message
     */
    fastify.delete('/delete/:file_id', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const file_data = await Upload.findOne({ where: { name_ref: req.params.file_id, is_deleted: 0 } });
            if (file_data && fs.existsSync(file_data.file_path)) {
                fs.unlinkSync(file_data.file_path)
                Upload.update({ is_deleted: 1, updated_by: user.user_id }, { where: { name_ref: req.params.file_id } });
                res.status(200).send({ status: true, message: lang('Validation.file_del', user.lang) })
            } else {
                res.status(500).send({ status: false, message: lang('Validation.file_not_found', user.lang) })
            }
        } catch (e) {
            res.status(501).send(e);
        }

    })

    /**
     * @author Kirankumar
     * @summary This rout is used for delete multiple files
     * @returns status and message
     */
    fastify.post('/delete/files', async (req, res) => {
        try {
            var user = await handy.verfiytoken(req, res);
            if (!user) return;
            const body = req.body;
            let invalid_files = 0;
            if (body && body.files && body.files.length) {
                for (file_id of body.files) {
                    const file_data = await Upload.findOne({ where: { name_ref: file_id, is_deleted: 0 } });
                    if (file_data && fs.existsSync(file_data.file_path)) {
                        fs.unlinkSync(file_data.file_path)
                        Upload.update({ is_deleted: 1, updated_by: user.user_id }, { where: { name_ref: file_id } });
                    } else {
                        invalid_files++;
                    }
                }
                if (!invalid_files) {
                    res.status(200).send({ status: true, message: lang('Validation.file_del', user.lang) })
                } else {
                    res.status(500).send({ status: false, message: lang('Validation.file_not_found', user.lang) })
                }
            } else {
                res.status(500).send({ status: false, message: "Invalid data" });
            }
        } catch (e) {
            res.status(501).send(e);
        }

    })

    /**
     * @author Kirankumar
     * @summary This rout is used for get file file id
     * @returns file
     */
    fastify.get('/file/:file_id', async (req, res) => {
        try {
            const file_data = await Upload.findOne({ where: { name_ref: req.params.file_id, is_deleted: 0 } });
            if (file_data && fs.existsSync(file_data.file_path)) {
                fs.readFile(file_data.file_path, (err, fileBuffer) => {
                    if (file_data.file_name && file_data.ext) {
                        res.header('Content-disposition', 'attachment; filename=' + file_data.file_name + file_data.ext);
                    }
                    res.type(file_data.file_name_fm).send(err || fileBuffer)
                })
            } else {
                res.status(404).send("")
            }
        } catch (e) {
            res.status(501).send(e);
        }

    })
}

module.exports = UploadRouter;