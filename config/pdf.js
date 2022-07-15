const { Upload } = require("../models/Model")(
    ["Upload"]
);
const fs = require('fs')
const JSZip = require('jszip');
const path = require('path')
var fonts = require('../pdf_templates/fonts');
const { parsed: envs } = require('dotenv').config();
const { v4 } = require('uuid');
let lang = require('../language/translate').validationMsg;


module.exports = {
    /**
     * @author Kirankumar
     * @summary This function is used for create pdf object and will send to related template.
     * @param {PDF save file path} filePath 
     * @param {data for pdf} data 
     * @returns true or false
     */
    create_pdf: async function (filePath, data, user) {
        try {
            const PDFDocument = require('./pdf_table');
            let doc;
            if (data.action == "print_statement") {
                doc = new PDFDocument({ margin: 10, size: 'A4', layout: "landscape" });
            } else if (data.action == "print_rental_item") {
                doc = new PDFDocument({
                    margins: {
                        top: 10,
                        bottom: 40,
                        left: 10,
                        right: 10
                    }, size: 'A4', layout: "portrait", bufferPages: true
                });
            } else if (data.action == "print_payment") {
                doc = new PDFDocument({
                    margins: {
                        top: 17,
                        bottom: 40,
                        left: 17,
                        right: 17
                    }, size: 'A4', layout: "portrait", bufferPages: true
                });
            } else if (data.action == "print_booking_docket") {
                doc = new PDFDocument({
                    margins: {
                        top: 30,
                        bottom: 50,
                        left: 19,
                        right: 30
                    }, size: 'A4', layout: "portrait", bufferPages: true
                });
            } else if (data.action == "print_service_invoice") {
                doc = new PDFDocument({
                    margins: {
                        top: 10,
                        bottom: 40,
                        left: 10,
                        right: 13
                    }, size: 'A4', layout: "portrait", bufferPages: true
                });
            } else if (data.action == "sub_rental_report") {
                doc = new PDFDocument({
                    margins: {
                        top: 17,
                        bottom: 40,
                        left: 17,
                        right: 17
                    }, size: 'A4', layout: "portrait", bufferPages: true
                });
            } else if (data.action == "print_inventory_item") {
                doc = new PDFDocument({
                    margins: {
                        top: 17,
                        bottom: 40,
                        left: 17,
                        right: 17
                    }, size: 'A4', layout: "portrait", bufferPages: true
                });
                doc.on('pageAdded', () => doc.opacity(0.6));
            } else if (data.action == "filter_task_invoice") {
                doc = new PDFDocument({
                    margins: {
                        top: 17,
                        bottom: 40,
                        left: 17,
                        right: 17
                    }, size: 'A4', layout: "portrait", bufferPages: true
                });
            } else if (data.action == "checklist") {
                doc = new PDFDocument({
                    margins: {
                        top: 30,
                        bottom: 50,
                        left: 19,
                        right: 30
                    }, size: 'A4', layout: "portrait", bufferPages: true
                });
            } else if (data.action == "print_pos_invoice") {
                doc = new PDFDocument({
                    margins: {
                        top: 30,
                        bottom: 50,
                        left: 19,
                        right: 30
                    }, size: 'A4', layout: "portrait", bufferPages: true
                });
            } else if (data.action == "print_logistic_report") {
                doc = new PDFDocument({
                    margins: {
                        top: 70,
                        bottom:0,
                        left: 0,
                        right: 30
                    }, size: 'A4', layout: "portrait", bufferPages: true
                });
            }
            const tempale = require('../pdf_templates/' + data.action);
            doc = await tempale.create(doc, data, user)
            doc.pipe(fs.createWriteStream(filePath));
            doc.end();
            return true;
        } catch (e) {
            return false;
        }
    },
    /**
     * @author Kirankumar
     * @summary this function is used for rout to related pdf template
     * @param {input data} data 
     * @param {Logged in user data} user 
     * @returns status and pdf ref id
     */
    print_statement: async function (data, user) {
        const tempale = require('../pdf_templates/' + data.action);
        let upload_path = '';
        if (data.action == "print_statement") {
            upload_path = envs.documents_path + '/email';
        } else if (data.action == "print_rental_item") {
            upload_path = envs.documents_path + '/rental';
        } else if (data.action == "print_payment") {
            upload_path = envs.documents_path + '/payment';
        } else if (data.action == "print_booking_docket") {
            upload_path = envs.documents_path + '/booking';
        } else if (data.action == "print_service_invoice") {
            upload_path = envs.documents_path + '/service';
        } else if (data.action == "sub_rental_report") {
            upload_path = envs.documents_path + '/report';
        } else if (data.action == "print_inventory_item") {
            upload_path = envs.documents_path + '/inventory';
        } else if (data.action == "filter_task_invoice") {
            upload_path = envs.documents_path + '/task';
        } else if (data.action == "checklist") {
            upload_path = envs.documents_path + '/bulk Pdfs';
        } else if (data.action == "print_pos_invoice") {
            upload_path = envs.documents_path + '/pos';
        } else if (data.action == "print_logistic_report") {
            upload_path = envs.documents_path + '/delivery';
        }

        if (!fs.existsSync(envs.documents_path)) {
            fs.mkdirSync(envs.documents_path);
        }
        if (!fs.existsSync(upload_path)) {
            fs.mkdirSync(upload_path);
        }
        const temp_data = await tempale.file_name(data);
        if (!temp_data) {
            return { status: false, message: lang('Validation.report_failed', user.lang) };
        }
        //code for add name with ref_Id
        let category = sub_item = terms = images = type = uniqueId = condition = "";

        if (data.action == "print_rental_item") {
            uniqueId = data?.invoice_data?.invoice_id ? "_" + `${data?.invoice_data?.invoice_id}`.padStart(6, '0') : "";
        }
        // else if (data.action == "print_payment") {
        //     uniqueId = data?.rental_payment_data[0]?.rental_id ? "_" + `${data.rental_payment_data[0]?.rental_id}`.padStart(6, 0) : "";
        // }
        else if (data.action == "print_statement") {
            uniqueId = data?.client_id ? "_" + `${data?.client_id}`.padStart(6, '0') : "";
        } else if (data.action == "print_inventory_item") {
            uniqueId = "_" + data.inventory_id || "";
        } else if (data.action == "print_booking_docket") {
            const { show_on_docket, sort_category, attach_images, attach_terms, print_type, rental_id } = data.rental_data;
            if (sort_category == "1") {
                category = "_category"
            }
            if (show_on_docket == "1") {
                sub_item = "_subItem"
            }
            if (attach_images == "1") {
                images = "_images"
            }
            if (attach_terms == "1") {
                terms = "_t&c"
            }
            type = print_type.toLowerCase().replace(/\s+/g, '_') + "_" || "";
            uniqueId = "_" + rental_id || "";
            condition = category + sub_item + images + terms;
        } else if (data.action == "print_service_invoice") {
            uniqueId = "_" + data?.task_id || "";
        } else if (data.action == "sub_rental_report") {
            uniqueId = "_" + data.rental_id || "";
        } else if (data.action == "filter_task_invoice") {
            uniqueId = "_" + Date.now() || "";
        } else if (data.action == "checklist") {
            //uniqueId = "_" + Date.now() || "";
            uniqueId = "_" + data?.rental_data?.rental_calculated_data?.rental_id || "";
        } else if (data.action == "print_pos_invoice") {
            uniqueId = "_" + Date.now() || "";
        } else if (data.action == "print_logistic_report") {
            uniqueId = "_" + Date.now() || "";
        }
        // this is file name
        const name_file = type + data.action + condition + uniqueId;
        const uid = v4(); // "bc609d1c-07e9-4c1e-bb5f-3836a469bdd8";
        const ext = path.extname(temp_data.file_name).toLowerCase();
        let new_filename = name_file + ext; // const new_filename = uid + ext;
        if (data.action == "print_payment") {
            new_filename = uid + ext;
        }
        if (temp_data.client) {
            data.client = temp_data.client;
        } else if (temp_data.inventory) {
            data.inventory = temp_data.inventory;
        }

        const status = await this.create_pdf(upload_path + '/' + new_filename, data, user);
        let create_file_data = {
            file_name: temp_data.file_name,
            file_path: upload_path + '/' + new_filename,
            name_ref: uid,
            file_name_fm: "application/pdf",
            created_by: user.user_id,
            created_at: new Date()
        }
        const file_create_data = await Upload.create(create_file_data);
        if (status) {
            return { status: true, data: { ref_id: uid, file_name: new_filename } }
        } else {
            return { status: false, message: lang('Validation.report_failed', user.lang) }
        }
    },
    /**
     * @author Anik
     * @summary this function is used to create zip file for checklist
     * @input {HTTP request}
     * @return Status and zip {ref_id,file_name}
     */
    create_zip_file: async function (unresolvedPromises, user) {
        const zip = new JSZip();
        try {
            const file_ref = unresolvedPromises.map(ids => ids?.data?.ref_id);
            if (file_ref.length > 0) {
                for (let i = 0; i < file_ref.length; i++) {
                    const file_path = await Upload.findOne({ raw: true, where: { name_ref: file_ref[i], is_deleted: 0 }, attributes: ['file_path'] });
                    await new Promise((resolve, reject) => {
                        fs.readFile(file_path.file_path, function (err, data) {
                            if (err) return reject(err);
                            zip.file(Date.now() + ".pdf", data);
                            resolve();
                        });
                    })
                }
                const uid = v4();
                let upload_path = envs.documents_path + '/bulk Pdfs';
                const zip_filename = uid + ".zip";

                zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                    .pipe(fs.createWriteStream(upload_path + '/' + zip_filename))
                    .on('finish', function () {
                        // console.log("sample.zip written.");
                    });

                const status = (upload_path + '/' + zip_filename);
                let create_file_data = {
                    file_name: "Zip file",
                    file_path: status,
                    name_ref: uid,
                    file_name_fm: "application/zip",
                    created_by: user.user_id,
                    created_at: new Date()
                }
                let file_create_data = await Upload.create(create_file_data);
                if (status) {
                    return { status: true, data: { ref_id: uid, file_name: zip_filename } }
                } else {
                    return { status: false, message: lang('Validation.report_failed', user.lang) }
                }
            } else {
                return { status: false, message: lang('Validation.record_not_exist', user.lang) };
            }
        } catch (err) {
            console.error(err)
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
    create_pdf_file: async function (data = [], settingss = {}, user, file_name = "", type, reqData, adminData) {
        const uid = v4();
        let upload_path = "";
        if (type == "sub_rental") {
            upload_path = envs.documents_path + '/sub Rentals';
        } else {
            upload_path = envs.documents_path + '/temp';
        }
        const new_filename = uid + ".pdf";
        if (!fs.existsSync(envs.documents_path)) {
            fs.mkdirSync(envs.documents_path);
        }
        if (!fs.existsSync(upload_path)) {
            fs.mkdirSync(upload_path);
        }

        const status = await this.createCommonPdf(upload_path + '/' + new_filename, data, user, type, reqData, adminData);

        let create_file_data = {
            file_name: file_name,
            file_path: upload_path + '/' + new_filename,
            name_ref: uid,
            file_name_fm: "application/pdf",
            days_limit: 1,
            created_by: user.user_id,
            created_at: new Date()
        }
        const file_create_data = await Upload.create(create_file_data);
        if (status) {
            return create_file_data;
        } else {
            return { status: false, message: lang('Validation.report_failed', user.lang) }
        }
    },

    /**
     * @author Kirankumar
     * @summary This function is used for create pdf object and will send to related template.
     * @param {PDF save file path} filePath
     * @param {data for pdf} data 
     * @returns true or false
     */
    createCommonPdf: async function (filePath, data, user, type, reqData, adminData) {
        try {
            const PDFDocument = require('./pdf_table');
            let doc;
            if (type == "sub_rental") {
                doc = new PDFDocument({
                    margins: {
                        top: 17,
                        bottom: 40,
                        left: 65,
                        right: 65
                    }, size: 'A4', layout: "landscape", bufferPages: true
                });
            } else {
                doc = new PDFDocument({
                    margins: {
                        top: 10,
                        bottom: 30,
                        left: 10,
                        right: 10
                    }, size: 'A4', layout: "landscape", bufferPages: true
                });
            }
            let tempale = "";
            if (type == "sub_rental") {
                tempale = require('../pdf_templates/subRental_report_pdf');
            } else {
                tempale = require('../pdf_templates/rental_filtered_pdf');
            }
            doc = await tempale.create(doc, data, user, type, reqData, adminData)
            doc.pipe(fs.createWriteStream(filePath));
            doc.end();
            return true;
        } catch (e) {
            console.log("Error=====", JSON.stringify(e));
            return false;
        }
    },

}
