const { Client, Auth } = require("../models/Model")(["Client", "Auth"]);
const { numberWithCommas, setFormatedDate, floatnumberWithCommas } = require("../config/common");

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
        const { pdf_date_format } = data.admin.dataValues;
        const startDate = setFormatedDate(new Date(), pdf_date_format);
        const vehicleName = "IZUSU";
        const driverName = "ANDREW WYND";
        const { logistics } = data || [];
        
        //var for dynamic footer
        const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = data?.business_get || {};
        const company_city = data?.business_get?.city || "";
        const company_state = data?.business_get?.state || "";
        const company_zip = data?.business_get?.zip || "";

        //Register font
        doc.registerFont('Roboto', 'assets/fonts/Roboto/Roboto-Regular.ttf');
        doc.registerFont('Roboto-bold', 'assets/fonts/Roboto/Roboto-Bold.ttf');
        doc.registerFont('Roboto-italic', 'assets/fonts/Roboto/Roboto-Italic.ttf');
        doc.registerFont("Roboto-black", "assets/fonts/Roboto/Roboto-Black.ttf");

        // Table 
        doc.moveDown(5);
        doc.text("", 0, 70);
        doc.strokeColor("#f2f2f2")

        const body_data = [
            { jobNo: " 1785", logisticDate: "Wed 4 May 2022", time: "10:05:00",description:"1 x AAA Batteries 5 Pack 1 x Canon EOS19 Camera 1 x Zoom H6 recorder 1 x Bag of Ice 1 x onsite service", type: "DELIVERY", client: "Ron Neville", },
            { jobNo: " 1785", logisticDate: "Wed 5 May 2022", time: "09:00:00",description: "SERVICE CALL", type: "SERVICE CALL", client: "Ron Neville", },
            { jobNo: " 1787", logisticDate: "Wed 6 May 2022", time: "",description: "SERVICE CALL", type: "DELIVERY", client: "Ron Neville", },
            { jobNo: " 1785", logisticDate: "Wed 7 May 2022", time: "09:00:00",description: "SERVICE CALL", type: "SERVICE CALL", client: "stigma pharma", },
            { jobNo: " 1785", logisticDate: "", time: "", description: "DELIVERY",type: "SERVICE CALL", client: "Ron Neville", },
            { jobNo: " 8785", logisticDate: "", time: "09:00:00",description: "S", type: "SERVICE CALL", client: "Ron Neville", },
            { jobNo: " 1785", logisticDate: "Wed 9 May 2022", time: "",description: "SERVICE CALL", type: "DELIVERY", client: "Ron Neville", },
            { jobNo: " 1785", logisticDate: "Wed 11 May 2022", time: "09:00:00",description: "", type: "SERVICE CALL", client: "Ron Neville", },
            { jobNo: " 1785", logisticDate: "Wed 15 May 2022", time: "09:00:00",description: "SERVICE CALL", type: "SERVICE CALL", client: "Ron Neville", },
         
        ];
        const table = {
            headers: [
                { label: "", property: 'jobNo', align: 'left', width: 150, headerColor: "#ffffff", headerOpacity: 0, color: "#000000", padding: 8, renderer: null },
                { label: "", property: 'logisticDate', align: 'center', width: 200, headerColor: "#ffffff", headerOpacity: 0, color: "#000000", padding: 0, renderer: null },
                { label: "", property: 'time', align: 'right', width: 95, headerColor: "#ffffff", headerOpacity: 0, color: "#000000", padding: 0, renderer: null },
                { label: "", property: 'type', align: 'right', width: 135, headerColor: "#ffffff", headerOpacity: 0, color: "#000000", padding: 17, renderer: null },

            ],
        };

        table.datas = [];
        //   let body_data = data?.sub_rental_data || [];
        for (let key in body_data) {
            let item;
            item = {
                jobNo: {
                    label: `Job Nos# ${body_data[key]?.jobNo}` || "", options: { fontFamily: 'Roboto-bold' }
                },
                logisticDate: {
                    label: body_data[key]?.logisticDate || "", options: { fontFamily: 'Roboto-bold' }
                },
                time: {
                    label: body_data[key]?.time || "", options: { fontFamily: 'Roboto-bold' }
                },
            }
            if (key % 2) {
                item.options = {
                    columnColor: "#f2f2f2",
                    columnOpacity: 1,
                }
            }
            table.datas.push(item);

            item = {
                jobNo: {
                    label: "CloudRent", options: { fontFamily: 'Roboto-bold', color: "black", fontSize: 12 },
                },
                type: {
                    label: body_data[key]?.type || "", options: {fontFamily: 'Roboto-bold', color: body_data[key]?.type === "DELIVERY" ? "green" : "blue", fontSize: 12 },
                },
            }

            if (key % 2) {
                item.options = {
                    columnColor: "#f2f2f2",
                    columnOpacity: 1
                }
            }
            table.datas.push(item);

            item = {
                type: {
                    label: body_data[key]?.client || "", options: { color: "black" },
                },
            }
            if (key % 2) {
                item.options = {
                    columnColor: "#f2f2f2",
                    columnOpacity: 1
                }
            }
            table.datas.push(item);

            item = {
                type: "965865855"
            }
            if (key % 2) {
                item.options = {
                    columnColor: "#f2f2f2",
                    columnOpacity: 1
                }
            }
            table.datas.push(item);
            const category = { label: body_data[key].description||"", rowHieght: "summary", options:{fontSize:12} };
            item = {
                jobNo: category,
                customization: {
                    customClass: "tableRowSubHeader",
                    customAlign: "left",
                }
            }
            if (key % 2) {
                item.options = {
                    columnColor: "#f2f2f2",
                    columnOpacity: 1,
                }
            }
            table.datas.push(item);
        }
        const options = {
            x: 0,
            y: 0,
            divider: {
                header: { disabled: true, width: 2, opacity: 0 },
                horizontal: { disabled: true, width: 0.5, },
                vertical: { disabled: false, width: 0.5, }

            },
            prepareRow: () => {
                doc.font("Roboto").fontSize(14);
            },
            prepareHeader: () => doc.font("Roboto").fontSize(12),
        }
        await doc.table(table, options,"",true);


        // Footer section 
        const range = doc.bufferedPageRange();
        for (let i = range.start; i <= (doc._pageBufferStart +
            doc._pageBuffer.length - 1); i++) {
            doc.switchToPage(i);

            let bottom = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;
            doc.fillColor('black').opacity(1);
            doc.image('./assets/industry.png', 14, doc.page.height - (doc.page.height - 5), { width: 60, height: 60 });
            doc.font('Roboto').fontSize(12).text(`Delivery Report: ${startDate || ` `}`, 310, doc.page.height - (doc.page.height - 10), { width: 250, align: 'right' });
            doc.font('Roboto-bold').fontSize(12).text(vehicleName || "NOT ASSIGNED", 310, doc.page.height - (doc.page.height - 25), { width: 250, align: 'right' });
            doc.font('Roboto-italic').fontSize(12).text(driverName || ` `, 310, doc.page.height - (doc.page.height - 40), { width: 250, align: 'right' });

            doc.underline(0, doc.page.height - (doc.page.height - 67), 580, 2, { color: '#bdbdbd' });

            if (data?.business_get) {
                doc.font('Roboto').fontSize(9).text(`${label || ""} ${company_no || ""} ${office_phone ? ` PHONE: ${office_phone}` : ""} ${office_email ? ` EMAIL: ${office_email}` : ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 28,
                    {
                        width: 450,
                        align: 'center',
                        lineBreak: false,
                    });
                doc.font('Roboto').fontSize(9).text(`${(address || company_city || company_state || company_zip) ? "MAIL:" : ""} ${address || ""} ${company_city || ""} ${company_state || ""} ${company_zip || ""} ${(warehouse_address || warehouse_city || warehouse_state || warehouse_zip) ? `WAREHOUSE:` : ""} ${warehouse_address || ""} ${warehouse_city || ""} ${warehouse_state || ""} ${warehouse_zip || ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 18,
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
    file_name: async function (data) {
        Client.belongsTo(Auth, { targetKey: '__staff_id_pk', foreignKey: 'created_by' })
        const client = await Client.findOne({
            raw: true,
            attributes: ["company", "address_billing", "telephone", "account_name", "name_full", "email"], where: { __client_id_pk: 1800, is_deleted: 0 },
            include: {
                model: Auth,
                attributes: ["display_staff_name"]
            }
        });
        let name = "Rental Report - {{company}}.pdf";
        if (client) {
            name = name.replace("{{company}}", client.company);
        } else {
            name = name.replace("{{company}}", "");
        }
        return { file_name: name, client };
    }
}
