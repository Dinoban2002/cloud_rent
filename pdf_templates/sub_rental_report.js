const { Client, Auth } = require("../models/Model")(["Client", "Auth"]);
const { setFormatedDate } = require("../config/common");

module.exports = {
  /**
   * @author Kirankumar
   * @summary this function is used for place pdf content in side pdf doc
   * @param {pdf doc} doc
   * @param {Input data} data
   * @param {Logged in user data} user
   * @returns doc
   */
  create: async function (doc, data, user) {
    //Register font
    doc.registerFont("Roboto", "assets/fonts/Roboto/Roboto-Regular.ttf");
    doc.registerFont("Roboto-bold", "assets/fonts/Roboto/Roboto-Bold.ttf");
    doc.registerFont("Roboto-italic", "assets/fonts/Roboto/Roboto-Italic.ttf");
    doc.registerFont("Roboto-black", "assets/fonts/Roboto/Roboto-Black.ttf");
    doc.registerFont('Roboto-bolditalic', "assets/fonts/Roboto/Roboto-BoldItalic.ttf");

    //var
    const { period_no, config_rate, sub_rental_comments, date, collection_date } = data?.rental_details;
    const { pdf_date_format } = data.admin.dataValues;
    const title_name = "Sub Rental Report";
    const job_number = data?.rental_id || "";
    const clientName = data?.client["staff.display_staff_name"] || "";

    const date_use = setFormatedDate(date, pdf_date_format);
    const return_date = setFormatedDate(collection_date, pdf_date_format);
    const period = period_no;
    const period_type = config_rate?.label_name;
    //var for footer
    const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = data?.business_get || {};
    const company_city = data?.business_get?.city || "";
    const company_state = data?.business_get?.state || "";
    const company_zip = data?.business_get?.zip || "";

    doc.underline(0, -.5, 600, 1, { color: '#bdbdbd' });

    // image 
    doc.image("assets/crlogo.png", 10, 15, { width: 130, height: 90 });

    // title name
    doc.font("Roboto-black").fontSize(21).text(title_name ? title_name : ``, 0, 10, { width: doc.width, align: "right" });

    // job number
    doc.font("Roboto").fontSize(12).text(`JOB NO: ${job_number}`, 0, doc.y, { width: doc.width, align: "right" });

    // client name
    doc.font("Roboto").text(clientName ? clientName : ``, 0, doc.y, { width: doc.width, align: "right" });

    // use date
    doc.font("Roboto").fontSize(12).text(`USE DATE: ${date_use}`, 0, doc.y, { width: doc.width, align: "right" });

    // return date
    doc.font("Roboto").fontSize(12).text(`RETURN DATE: ${return_date}`, 0, doc.y, { width: doc.width, align: "right" });

    // period 
    doc.font("Roboto").fontSize(12).text(`PERIOD:- ${period || 0} ${period_type || ""}`, 0, doc.y, { width: doc.width, align: "right" });


    doc.moveDown(1);
    doc.text("", 0, 118);
    doc.strokeColor("#f2f2f2");
    doc.underline(0, doc.y - 3 + 18, 600, 1, { color: '#bdbdbd' });

    const table = {
      headers: [
        { label: "SKU", property: 'sku', align: 'left', width: 135, headerColor: "#ffffff", headerOpacity: 0, color: "#000000", padding: 4, renderer: null },
        { label: "Item", property: 'item', align: 'left', width: 200, headerColor: "#ffffff", headerOpacity: 0, color: "#000000", padding: 2, renderer: null },
        { label: "Use", property: 'use', align: 'center', width: 100, headerColor: "#ffffff", headerOpacity: 0, color: "#000000", padding: 2, renderer: null },
        { label: "Qty", property: 'qty', align: 'center', width: 65, headerColor: "#ffffff", headerOpacity: 0, color: "#000000", padding: 2, renderer: null },
        { label: "Rec", property: 'rec', align: 'center', width: 62, headerColor: "#ffffff", headerOpacity: 0, color: "#000000", padding: 2, renderer: null },
      ],
    };

    table.datas = [];
    let body_data = data?.sub_rental_data || [];
    for (let key in body_data) {
      const item = {
        sku: body_data[key].sku || "",
        item: body_data[key].item || "",
        use: body_data[key].use_date || "",
        qty: body_data[key].qty || 0,
        rec: body_data[key].qty_received || 0,
      }
      if ((key % 2)) {
        item.options = {
          columnColor: "#f0f0f0",
          columnOpacity: 1,
        }
      }
      table.datas.push(item);

    }
    const options = {
      x: 0, // {Number} default: undefined | doc.x
      y: 0, // {Number} default: undefined | doc.y
      width: doc.width,
      prepareRow: () => {
        doc.font("Roboto").fontSize(11);
      },
      prepareHeader: () => doc.font("Roboto").fontSize(12),
    };
    await doc.table(table, options);

    doc.font('Roboto').text(("NOTES"), 20, doc.y, { align: 'left', lineBreak: true });
    doc.font('Roboto').text((sub_rental_comments || ""), 20, doc.y, { align: 'left', lineBreak: true });

    //this is footer for first page
    const range = doc.bufferedPageRange();
    for (let i = range.start; i <= (doc._pageBufferStart +
      doc._pageBuffer.length - 1); i++) {
      doc.switchToPage(i);

      let bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      if (data?.business_get) {
        doc.font('Roboto').fontSize(8).text(`${label || ""} ${company_no || ""} ${office_phone ? ` PHONE: ${office_phone}` : ""} ${office_email ? ` EMAIL: ${office_email}` : ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 31,
          {
            width: 450,
            align: 'center',
            lineBreak: false,
          });
        doc.font('Roboto').fontSize(8).text(`${(address || company_city || company_state || company_zip) ? "MAIL:" : ""} ${address || ""} ${company_city || ""} ${company_state || ""} ${company_zip || ""} ${(warehouse_address || warehouse_city || warehouse_state || warehouse_zip) ? `WAREHOUSE:` : ""} ${warehouse_address || ""} ${warehouse_city || ""} ${warehouse_state || ""} ${warehouse_zip || ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 21,
          {
            width: 450,
            lineBreak: false, align: "center",
          });
        doc.font('Roboto-bolditalic').fontSize(8).text(website ? `Powered by ${website}` : "", 0.5 * (doc.page.width - 350), doc.page.height - 11,
          {
            width: 350,
            lineBreak: false, align: "center",
          });
      }
      // Reset text writer position
      doc.text('', 50, 50)
      doc.page.margins.bottom = bottom;
    }
    doc.underline(0, 841, 600, 1, { color: '#bdbdbd' });
    return doc;
  },

  file_name: async function (data) {
    Client.belongsTo(Auth, {
      targetKey: "__staff_id_pk",
      foreignKey: "created_by",
    });
    const client = await Client.findOne({
      raw: true,
      attributes: ["company", "address_billing", "telephone"],
      where: { __client_id_pk: data?.rental_details?.client_id, is_deleted: 0 },
      include: {
        model: Auth,
        attributes: ["display_staff_name"],
      },
    });
    let name = "Rental Report - {{company}}.pdf";
    if (client) {
      name = name.replace("{{company}}", client.company);
    } else {
      name = name.replace("{{company}}", "");
    }
    return { file_name: name, client };
  },
};
