const { Inventory, Upload } = require("../models/Model")(["Inventory", "Upload"]);
const fs = require("fs");

module.exports = {
  /**
   * @author Kirankumar
   * @summary This function is used for place content in doc
   * @param {pdf doc} doc 
   * @param {inventory data} data 
   * @param {Logged in user data} user 
   * @returns doc
   */
  create: async function (doc, data, user) {

    //var for dynamic footer
    const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = data?.business_get || {};
    const company_city = data?.business_get?.city || "";
    const company_state = data?.business_get?.state || "";
    const company_zip = data?.business_get?.zip || "";

    let { item, description } = data.inventory;
    let advert_data;
    if (data?.inventory?.container_advert) {
      advert_data = JSON.parse(data?.inventory?.container_advert) || {};
    }
    //Register font
    doc.registerFont("Roboto", "assets/fonts/Roboto/Roboto-Regular.ttf");
    doc.registerFont("Roboto-bold", "assets/fonts/Roboto/Roboto-Bold.ttf");

    //Stretch cloudRent logo
    doc.image('assets/crlogo.png', 398, 11, { width: 170, height: 113 });

    //get advert and main image from database
    const main_file_data = await Upload.findAll({ raw: true, where: { _inventory_id_fk: data?.inventory_id, is_deleted: 0 }, attributes: [['__upload_id_pk', 'file_id'], 'file_name', 'name_ref', 'file_name_fm', 'is_main_file', 'is_revenue', 'file_path'] });
    for (let file of main_file_data) {
      if (file?.is_main_file == "1") {
        if (fs.existsSync(file?.file_path)) {
          doc.image(file?.file_path, 60, 10, { width: 235, height: 235 });
        }
      }
    }

    const advert_img_data = advert_data ? await Upload.findOne({ raw: true, where: { name_ref: advert_data?.ref_id, is_deleted: 0 }, attributes: [['__upload_id_pk', 'file_id'], 'file_path'] }) : "";
    if (advert_img_data) {
      if (fs.existsSync(advert_img_data?.file_path)) {
        doc.image(advert_img_data?.file_path, 418, 124, { width: 139, height: 139 });
      }
    }
    // Item name and description
    doc.moveDown(2);
    doc.font('Roboto-bold').fontSize(14).opacity(0.6).text((item || ""), 27, 276, { width: 500 }).stroke();

    doc.font("Roboto").fontSize(12).text((description || ""), 27, doc.y + 2, { width: 500 }).stroke();

    //this is footer for this page
    const range = doc.bufferedPageRange();
    for (let i = range.start; i <= (doc._pageBufferStart +
      doc._pageBuffer.length - 1); i++) {
      doc.switchToPage(i);

      let bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      if (data?.business_get) {
        doc.font('Roboto').opacity(1).fontSize(8).text(`${label || ""} ${company_no || ""} ${office_phone ? ` PHONE: ${office_phone}` : ""} ${office_email ? ` EMAIL: ${office_email}` : ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 28,
          {
            width: 450,
            align: 'center',
            lineBreak: false,
          });
        doc.font('Roboto').fontSize(8).text(`${(address || company_city || company_state || company_zip) ? "MAIL:" : ""} ${address || ""} ${company_city || ""} ${company_state || ""} ${company_zip || ""} ${(warehouse_address || warehouse_city || warehouse_state || warehouse_zip) ? `WAREHOUSE:` : ""} ${warehouse_address || ""} ${warehouse_city || ""} ${warehouse_state || ""} ${warehouse_zip || ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 18,
          {
            width: 450,
            lineBreak: false, align: "center",
          });
      }
      // Reset text writer position
      doc.text('', 50, 50)
      doc.page.margins.bottom = bottom;
    }
    return doc;
  },
  /**
   * @author Kirankumar
   * @summary This function is used for create the file name for doc
   * @param {input data} data 
   * @returns filename and inventory data
   */
  file_name: async function (data) {
    const inventory = await Inventory.findOne({ attributes: ["item", "description", "container_advert"], where: { __inventory_id_pk: data.inventory_id, is_deleted: 0 } });
    if (inventory) {
      let name = (inventory.item || "inventory") + ".pdf";
      return { file_name: name, inventory };
    } else {
      return false;
    }
  }
}








//previoues code get images from payload
// const { Inventory, Upload } = require("../models/Model")(["Inventory", "Upload"]);

// module.exports = {
//   /**
//    * @author Kirankumar
//    * @summary This function is used for place content in doc
//    * @param {pdf doc} doc 
//    * @param {inventory data} data 
//    * @param {Logged in user data} user 
//    * @returns doc
//    */
//   create: async function (doc, data, user) {

//     //var for dynamic footer
//     const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = data?.business_get || {};
//     const company_city = data?.business_get?.city || "";
//     const company_state = data?.business_get?.state || "";
//     const company_zip = data?.business_get?.zip || "";

//     let { item, description } = data.inventory;
//     const files = [];
//     if (data.main_file) {
//       files.push(data.main_file);
//     }
//     if (data.advert) {
//       files.push(data.advert);
//     }
//     //Register font
//     doc.registerFont("Roboto", "assets/fonts/Roboto/Roboto-Regular.ttf");
//     doc.registerFont("Roboto-bold", "assets/fonts/Roboto/Roboto-Bold.ttf");

//     //Stretch cloudRent logo
//     doc.image('assets/crlogo.png', 398, 11, { width: 170, height: 113 });

//     // Stretch the image
//     const main_file_data = await Upload.findAll({ where: { name_ref: files, is_deleted: 0 } })
//     for (let file of main_file_data) {
//       if (file.name_ref == data.main_file) {
//         doc.image(file.file_path, 60, 10, { width: 235, height: 235 });
//       }
//       if (file.name_ref == data.advert) {
//         doc.image(file.file_path, 418, 124, { width: 139, height: 139 });
//       }
//     }
//     // Item name and description
//     doc.moveDown(2);
//     doc.font('Roboto-bold').fontSize(14).opacity(0.6).text((item || ""), 27, 276, { width: 500 }).stroke();

//     doc.font("Roboto").fontSize(12).text((description || ""), 27, doc.y + 2, { width: 500 }).stroke();

//     //this is footer for this page
//     const range = doc.bufferedPageRange();
//     for (let i = range.start; i <= (doc._pageBufferStart +
//       doc._pageBuffer.length - 1); i++) {
//       doc.switchToPage(i);

//       let bottom = doc.page.margins.bottom;
//       doc.page.margins.bottom = 0;
//       if (data?.business_get) {
//         doc.font('Roboto').opacity(1).fontSize(8).text(`${label || ""} ${company_no || ""} ${office_phone ? ` PHONE: ${office_phone}` : ""} ${office_email ? ` EMAIL: ${office_email}` : ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 28,
//           {
//             width: 450,
//             align: 'center',
//             lineBreak: false,
//           });
//         doc.font('Roboto').fontSize(8).text(`${(address || company_city || company_state || company_zip) ? "MAIL:" : ""} ${address || ""} ${company_city || ""} ${company_state || ""} ${company_zip || ""} ${(warehouse_address || warehouse_city || warehouse_state || warehouse_zip) ? `WAREHOUSE:` : ""} ${warehouse_address || ""} ${warehouse_city || ""} ${warehouse_state || ""} ${warehouse_zip || ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 18,
//           {
//             width: 450,
//             lineBreak: false, align: "center",
//           });
//       }
//       // Reset text writer position
//       doc.text('', 50, 50)
//       doc.page.margins.bottom = bottom;
//     }
//     return doc;
//   },
//   /**
//    * @author Kirankumar
//    * @summary This function is used for create the file name for doc
//    * @param {input data} data 
//    * @returns filename and inventory data
//    */
//   file_name: async function (data) {
//     const inventory = await Inventory.findOne({ attributes: ["item", "description"], where: { __inventory_id_pk: data.inventory_id, is_deleted: 0 } });
//     if (inventory) {
//       let name = (inventory.item || "inventory") + ".pdf";
//       return { file_name: name, inventory };
//     } else {
//       return false;
//     }
//   }
// }