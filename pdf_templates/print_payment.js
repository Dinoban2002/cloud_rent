const { Client, Auth } = require("../models/Model")(["Client", "Auth"]);
const { numberWithCommas, setFormatedDate } = require("../config/common");

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

    //var for dynamic footer
    const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = data?.business_get || {};
    const company_city = data?.business_get?.city || "";
    const company_state = data?.business_get?.state || "";
    const company_zip = data?.business_get?.zip || "";
    //var
    const { pdf_date_format, currency } = data.admin.dataValues;
    const currency_type = currency || "R";
    const {telephone, account_name, name_full} = data?.client||{};
    const print_date = setFormatedDate(new Date(), pdf_date_format);
    const printed_by_name = data?.client["staff.display_staff_name"];
    const job_number = data?.rental_payment_data[0]?.rental_id ? `${data?.rental_payment_data[0]?.rental_id}`.padStart(6,0):"";
    //var for address
    const {address1, city, state, zip} = data?.address || {};
    const address2 = `${city||""} ${state||""} ${zip||""}`;
  
    doc.underline(0, -.5, 600, 1, { color: '#bdbdbd' });
    doc.image("assets/crlogo.png", 35, 15, { width: 150, height: 100 });
    doc.font("Roboto-black").fontSize(15).text(`Payment Receipt`, 0, 10, { width: doc.width, align: "right" });
    doc.fontSize(11);

    // const baseY = doc.y - 2;
    const height = 13;

    doc.font("Roboto").text(`Printed by: ${printed_by_name}` + "   " + `Print date: ${print_date} `,0,27,{ width: doc.width, align: "right" });

    doc.fontSize(12).font("Roboto-bold").text(`Job No# ${job_number}`, 0, height * 3, { width: doc.width, align: "right"});

    doc.font("Roboto-bold").text(account_name? account_name :"", 0, height * 5 - 2, { width: doc.width, align: "right"});

    doc.fontSize(11).font("Roboto").text(name_full? name_full : "", 0, height * 6 - 3, { width: doc.width, align: "right"});

    doc.font("Roboto").text(address1 ||"", 0, height * 7 - 3, { width: doc.width, align: "right"});

    doc.font("Roboto").text(address2||"", 0, height * 8 - 3, { width: doc.width, align: "right"});

    doc.font("Roboto").text(telephone? telephone : "", 0, height * 9 - 3, {width: doc.width, align: "right",});

    // doc.font("Roboto").text(`9876543211`, 0, height * 10-3, {width: doc.width, align: "right" });

    doc.moveDown(5);
    doc.text("", 1, 160);
    doc.strokeColor("#f2f2f2");
    doc.underline(0, 164, 577, 1, { color: '#bdbdbd' });
    const table = {
      headers: [
        { label: "", property: 'id', align: 'center', width: 70, headerColor: "#ffffff", headerOpacity: 0, color: "#ffffff", padding: 1, renderer: null },
        { label: "", property: 'date', align: 'left', width: 100, headerColor: "#ffffff", headerOpacity: 0, color: "#ffffff", padding: 1, renderer: null },
        { label: "", property: 'bond', align: 'center', width: 100, headerColor: "#ffffff", headerOpacity: 0, color: "#ffffff", padding: 1, renderer: null },
        { label: "", property: 'price', align: 'right', width: 290, headerColor: "#ffffff", headerOpacity: 0, color: "#ffffff", padding: 1, renderer: null },
      ],
    };

    table.datas = [];
    let body_data = data?.rental_payment_data||[];
    let Total_amount = 0;
    let Total_due_amount = 0;
    for (let key in body_data) {
      const payment_date = setFormatedDate(body_data[key].payment_date, pdf_date_format);

      Total_amount += Number(body_data[key]?.payment_amount)||0;
      Total_due_amount += Number(body_data[key]?.payment_amount_due)||0;
      const item = {
        id: body_data[key].payment_id || 0,
        date: payment_date || "",
        bond: body_data[key].bond_amount ? "BOND" : `${body_data[key].payment_method.toUpperCase()}  ${body_data[key].payment_type.toUpperCase()}`,
        price: body_data[key]?.payment_amount ? numberWithCommas(body_data[key]?.payment_amount) : 0,
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
      padding: 5,
      columnSpacing: 5.5,
      prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        doc.fillColor('black').font("Roboto").fontSize(11).opacity(0.5);
      },
    };
    await doc.table(table, options);

    doc.font('Roboto-black').fontSize(14).opacity(0.7).text("TOTAL PAID", 425, 585);
    doc.font('Roboto').fontSize(8).text("BALANCE DUE", 447, 602);

    doc.font("Roboto-black").fontSize(14).opacity(1).text(Total_amount ? `${currency_type}${parseFloat(`${Total_amount}`.includes(",")? Total_amount?.replaceAll(",",""): Total_amount).toFixed(2)}` : currency_type + `0.00`, 0, 585, {
      width: doc.width,
      align: "right",
    });

    doc.font("Roboto").fontSize(8).text(Total_due_amount ? `${currency_type}${parseFloat(`${Total_due_amount}`.includes(",")? Total_due_amount?.replaceAll(",",""):Total_due_amount).toFixed(2)}` : currency_type + `0.00`, 0, 602, {
      width: doc.width,
      align: "right",
    });

    //this is footer for first page
    const range = doc.bufferedPageRange();
    for (let i = range.start; i <= (doc._pageBufferStart +
      doc._pageBuffer.length - 1); i++) {
      doc.switchToPage(i);

      let bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      if (data?.business_get) {
        doc.font('Roboto').fontSize(8).text(`${label || ""} ${company_no || ""} ${office_phone ? ` PHONE: ${office_phone}` : ""} ${office_email ? ` EMAIL: ${office_email}` : ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 28,
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
      attributes: ["company","telephone","account_name", "name_full"],
      where: { __client_id_pk: data.client_id, is_deleted: 0 },
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
