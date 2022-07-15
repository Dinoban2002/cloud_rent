const { Client, Auth } = require("../models/Model")(["Client", "Auth"]);
const moment = require('moment');
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
        //file_ref
        const { pdf_date_format, colour_palette, currency, no_show_unit_price } = data.admin.dataValues;
        const { delivery, pickup, collection, delivery_notes, term_id, rental_id, item, attach_images, attach_terms, print_type, sort_category, show_on_docket, send_reminder, delivery_address, delivery_date, delivery_time, collection_time, collection_date, job_name, option1, option2, option3, option4, option5, option6, period_no, config_rate, site_name, account_name, delivery_charge, collection_charge, bond, credit_card_rate } = data.rental_data;
        const {card_name, card_percentage} = credit_card_rate||{};
        const { label, company_no, office_phone, office_email, address, warehouse_address, warehouse_city, warehouse_state, warehouse_zip, website } = data?.rental_data?.business_get || {};
        const company_city = data?.rental_data?.business_get?.city || "";
        const company_state = data?.rental_data?.business_get?.state || "";
        const company_zip = data?.rental_data?.business_get?.zip || "";
        const comp_name = data?.client?.account_name;
        const name = data?.client?.name_full;
        const client_address = data?.client?.address_billing;
        const phone = data?.client?.telephone;
        const alt_phone = "";
        const print_date = setFormatedDate(new Date(), pdf_date_format);
        const start_date = setFormatedDate(data.rental_data.date_start, pdf_date_format);
        const start_time = moment(data.rental_data.time_start, "HH:mm:ss").format("hh:mm A");
        const end_date = setFormatedDate(data.rental_data.date_end, pdf_date_format);
        const end_time = moment(data.rental_data.time_end, "HH:mm:ss").format("hh:mm A");
        const due_date = setFormatedDate(data.rental_data.deposit_due_date, pdf_date_format);
        const { total_rental, total_services, total_sales, sur_charge, sub_total, tax, total, total_costs, profit, discount, total_paid, paid, total_due, credit_card_charge } = data.rental_data.rental_calculated_data;
        const header_bgcolor = colour_palette || "#9dc940";  // table header background color
        const currency_type = currency || "R";
        //show status  
        let deliver_pickup = "";
        let collect_return = "";
        if (delivery == "yes" || pickup == "yes") {
            deliver_pickup = delivery == "yes" ? `DELIVERY` : `PICKUP`;
        } else {
            deliver_pickup = "";
        }
        if (collection == "yes" || data?.rental_data?.return == "yes") {
            collect_return = collection == "yes" ? `COLLECT` : `RETURN`;
        } else {
            collect_return = ""
        }
        let title = deliver_pickup && collect_return ? `${deliver_pickup} & ${collect_return}` : deliver_pickup + collect_return;

        let label_name = print_type == "QUOTE" ? "PRICE X TAX" : "PRICE";
        const date_delivery = setFormatedDate(delivery_date, pdf_date_format);
        // If print-type is checklist then show delivery time only
        const time_delivery = moment(delivery_time, "HH:mm:ss").format("hh:mm A");
        const date_collection = setFormatedDate(collection_date, pdf_date_format);
        const time_collection = moment(collection_time, "HH:mm:ss").format("hh:mm A");
        let checklist_y1 = print_type == "CHECKLIST" ? -15 : 0;
        //Register font
        doc.registerFont('Roboto', 'assets/fonts/Roboto/Roboto-Regular.ttf');
        doc.registerFont('Roboto-bold', 'assets/fonts/Roboto/Roboto-Bold.ttf');
        doc.registerFont('Roboto-italic', 'assets/fonts/Roboto/Roboto-Italic.ttf');
        doc.registerFont("Roboto-black", "assets/fonts/Roboto/Roboto-Black.ttf");
        doc.registerFont('Roboto-bolditalic', "assets/fonts/Roboto/Roboto-BoldItalic.ttf");

        //Images
        doc.image('assets/crlogo.png', 30, 25 + checklist_y1, { width: 150, height: 100, color: "orange" });//25
        print_type == "QUOTE" && doc.image('assets/deposit.png', 283, 20, { width: 117, height: 104 });
        //Title heading
        doc.font('Roboto-bold').fontSize(14).text(`${print_type == "RETURN SLIP" ? "Returns Docket" : print_type} ${rental_id}`, 0, 19 + checklist_y1, { align: 'right' });//19
        doc.fontSize(9);
        doc.font('Roboto').text(`Created by : ${data?.rental_data?.display_staff_name || ""}`, 0, doc.y, { align: 'right' });
        doc.font('Roboto').text(`Print date: ${print_date}`, 0, doc.y, { align: 'right' });
        doc.font('Roboto').text(job_name ? job_name.toUpperCase() : "", 0, doc.y, { align: 'right' });
        doc.font('Roboto-bold').fontSize(12).text(title, 0, doc.y + 10, { align: 'right' });
        doc.fontSize(9);
        doc.font('Roboto').text(`RENTAL PERIOD: ${period_no || 0} ${config_rate?.label_name || ""}`, 0, doc.y, { align: 'right' });
        doc.font('Roboto').text(`START: ${start_date} ${start_time ? `- ${start_time}` : ""}`, 0, doc.y, { align: 'right' });
        doc.font('Roboto').text(`END: ${end_date} ${end_time ? `- ${end_time}` : " "}`, 0, doc.y, { align: 'right' });
        //payment terms
        const page_width = doc.page.width - 30.50;
        let term_width = doc.widthOfString(term_id ? term_id.label : "");
        const width_payment_term = doc.widthOfString("Payment Terms: ");
        (term_width > 61) ? term_width = term_width + 0.50 : term_width = term_width - 0.50;
        const payment_terms = page_width - (term_width + width_payment_term);
        doc.font('Roboto').text(("Payment Terms: "), payment_terms, doc.y, { width: 400, align: 'left', continued: true }).font("Roboto-bold").text(term_id ? term_id.label : "").stroke();

        print_type == "CHECKLIST" && doc.font('Roboto-italic').text(("Client:"), 39, 123, { lineBreak: false }).text("Deliver to:", 500, doc.y);

        //top-left side block
        doc.roundedRect(29, 135, 230, 80, 4).fillAndStroke('#f2f2f2', '#f2f2f2');
        doc.fill('black').stroke();
        doc.fontSize(11);
        comp_name && doc.font('Roboto-bold').text((comp_name || ""), 39, 138, { width: 125, lineBreak: true }).stroke();
        doc.font("Roboto").fontSize(10);
        name && doc.font('Roboto').text((name || " "), 39, doc.y, { width: 125, lineBreak: true }).stroke();
        client_address && doc.text((client_address || ""), 39, doc.y, { width: 226, lineBreak: true });
        phone && doc.text((phone || ""), 39, doc.y, { width: 80, lineBreak: true });
        doc.text((alt_phone || ""), 39, doc.y, { width: 80, lineBreak: true });
        doc.fill('gray').stroke();

        //for contract
        if (print_type !== "QUOTE") {

            //top-right side block
            doc.roundedRect(295, 135, 270, 80, 4).fillAndStroke('#f2f2f2', '#f2f2f2');
            doc.fill('black').stroke();
            doc.fontSize(11);
            doc.font('Roboto').text((site_name ? site_name.toUpperCase() : ` `), 300, 138, { width: 255, align: 'right', lineBreak: true }).stroke();
            doc.font('Roboto-bold').text(delivery_address ? delivery_address.toUpperCase() : ` `, 300, doc.y, { width: 255, align: 'right', lineBreak: true }).stroke();
            doc.font("Roboto").fontSize(10);
            doc.font('Roboto').text(date_delivery ? `DELIVER: ${date_delivery.toUpperCase()} - ${time_delivery}` : ` `, 300, doc.y, { width: 255, align: 'right', margins: { right: "30" }, lineBreak: true });
            doc.font('Roboto').text(date_collection ? `COLLECTION: ${date_collection.toUpperCase()} ${time_collection ? `- ${time_collection}` : ""}` : ` `, 300, doc.y, { width: 255, align: 'right', margins: { right: "30" }, lineBreak: true });
            doc.fill('gray').stroke();
        }
        // table start
        doc.moveDown(1)
        doc.text("", 0, 225);
        doc.strokeColor("#f2f2f2")
        const table = {
            headers: print_type == "CHECKLIST" || print_type == "RETURN SLIP" ?
                [
                    { label: "QTY", property: 'qty', align: 'center', width: 55, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                    { label: "ITEM", property: 'item', align: 'left', width: 217, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                ]
                : [
                    { label: "QTY", property: 'qty', align: 'center', width: 55, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                    { label: "ITEM", property: 'item', align: 'left', width: 393, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null },
                    { label: "UNIT", property: 'unit', align: 'center', width: 60, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 0, renderer: null },
                    { label: "AMOUNT", property: 'amount', align: 'right', width: 50, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 8, renderer: null },
                ],
        }
        //add more fields for checklist in table
        if (print_type == "CHECKLIST") {
            table.headers.splice(2, 0, { label: "LOCATION", property: 'location', align: 'center', width: 65, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 0, renderer: null },);
            table.headers.splice(3, 0, { label: "BIN NO", property: 'bin_no', align: 'center', width: 65, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 0, renderer: null },);
            table.headers.splice(4, 0, { label: "COMMENTS", property: 'comment', align: 'left', width: 105, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 2, renderer: null },);
            table.headers.splice(5, 0, { label: "P", property: 'p', align: 'right', width: 13, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 2, renderer: null },);
            table.headers.splice(6, 0, { label: "D", property: 'd', align: 'center', width: 13, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 2, renderer: null },);
            table.headers.splice(7, 0, { label: "R", property: 'r', align: 'left', width: 17, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 2, renderer: null },);
        }
        //add more fields for return docket in table
        if (print_type == "RETURN SLIP") {
            table.headers.splice(2, 0, { label: "COMMENTS", property: 'comment', align: 'center', width: 105, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 2, renderer: null },);
            table.headers.splice(3, 0, { label: "START", property: 'start', align: 'center', width: 60, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 0, renderer: null },);
            table.headers.splice(4, 0, { label: "BALANCE", property: 'balance', align: 'center', width: 60, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 0, renderer: null },);
            table.headers.splice(5, 0, { label: "COLLECTED", property: 'collected', align: 'center', width: 55, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 0, renderer: null },);
        }
        // manage column width and position according to print_type
        if (attach_images == "1") {
            table.headers.splice(0, 0, { label: "", property: 'img', align: 'left', width: 50, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 10, renderer: null });
            table.headers[2].width = table.headers[2].width - table.headers[0].width;
        }
        if (print_type == "QUOTE" && attach_images == "1") {
            table.headers.splice(3, 0, { label: "DISC.", property: 'disc', align: 'center', width: 60, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 0, renderer: null });
            if (attach_images == "1") {
                table.headers[2].width = table.headers[2].width - table.headers[3].width;
            } else {
                table.headers[1].width = table.headers[1].width - table.headers[3].width;
            }
        } else if (print_type == "QUOTE") {
            table.headers.splice(2, 0, { label: "DISC.", property: 'disc', align: 'center', width: 60, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 0, renderer: null });
            table.headers[1].width = table.headers[1].width - table.headers[2].width;
        }
        //add more fields unit_price in table
        if (!no_show_unit_price == 1) {
            if (print_type == "QUOTE" || print_type == "CONTRACT") {
                if (attach_images == "1") {
                    if (print_type == "CONTRACT") {
                        table.headers.splice(4, 0, { label: label_name, property: 'price', headerAlign: "right", align: "right", width: 60, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 7, renderer: null },);
                        table.headers[2].width = table.headers[2].width - table.headers[4].width;
                    } else if (print_type == "QUOTE") {
                        table.headers.splice(5, 0, { label: label_name, property: 'price', headerAlign: "right", align: "right", width: 60, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 7, renderer: null },);
                        table.headers[2].width = table.headers[2].width - table.headers[5].width;
                    }
                } else {
                    if (print_type == "CONTRACT") {
                        table.headers.splice(3, 0, { label: label_name, property: 'price', headerAlign: "right", align: "right", width: 60, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 7, renderer: null },);
                        table.headers[1].width = table.headers[1].width - table.headers[3].width;
                    } else if (print_type == "QUOTE") {
                        table.headers.splice(4, 0, { label: label_name, property: 'price', headerAlign: "right", align: "right", width: 60, headerColor: header_bgcolor, headerOpacity: "1", color: "#000000", padding: 7, renderer: null },);
                        table.headers[1].width = table.headers[1].width - table.headers[4].width;
                    }
                }
            }
        }
        //table data
        table.datas = [];
        let body_data = data?.rental_data?.item || [];
        // table data sorted according to category
        if (sort_category == 1) {
            let category_arr = [];
            for (let key in item) {
                category_arr.push(item[key].category);
            }
            function onlyUnique(value, index, self) {
                return self.indexOf(value) === index;
            }
            let cat_array = category_arr.sort().filter(onlyUnique);  // store sorted and  unique value of cateogry 
            for (let i in cat_array) {
                const category = { label: cat_array[i], options: { fontFamily: 'Roboto-bolditalic' }, type: "category" };
                let item = {};
                if (attach_images == "1") {
                    item = {
                        img: category || "",
                    }
                } else {
                    item = {
                        qty: category || "",
                    }
                }
                table.datas.push(item);
                for (let key in body_data) {
                    if (body_data[key].category == cat_array[i]) {

                        let items = "";
                        if (body_data[key].rental_item_id_fk > 0 && show_on_docket == "1") {
                            items = { label: `     ` + body_data[key].item, options: { fontFamily: 'Roboto-italic' } };
                        } else {
                            items = body_data[key].item;
                        }

                        let item = {}
                        if (body_data[key].is_header) {
                            const head = { label: body_data[key].item, options: { fontFamily: 'Roboto-bolditalic' } };
                            item = {
                                qty: "",
                                item: head || "",
                                disc: "",
                                unit: "",
                                price: "",
                                amount: ""
                            }
                        } else if (print_type == "CHECKLIST") {
                            item = {
                                img: body_data[key].file_path || "",
                                qty: body_data[key].qty || 0,
                                item: items || "",
                                location: body_data[key].location || "",
                                bin_no: body_data[key].bin_no || "",
                                comment: "",
                                p: "square_box",
                                d: "square_box",
                                r: "square_box",
                            }
                        } else if (print_type == "RETURN SLIP") {
                            item = {
                                img: body_data[key].file_path || "",
                                qty: body_data[key].qty || 0,
                                item: items || "",
                                comment: "",
                                start: "1",
                                balance: body_data[key].balance ? body_data[key].balance : 0,
                                collected: "rect_box",
                            }
                        } else {
                            item = {
                                img: body_data[key].file_path || "",
                                qty: body_data[key].qty || 0,
                                item: items || "",
                                disc: body_data[key].discount_rate || 0,
                                unit: body_data[key].units || 0,
                                price: body_data[key].unit_price ? numberWithCommas(body_data[key]?.unit_price) : "0",
                                amount: body_data[key].amount ? floatnumberWithCommas(body_data[key]?.amount) : "0.00",
                            }
                        }
                        if (attach_images !== "1") {
                            if ((key % 2)) {
                                item.options = {
                                    columnColor: "#f2f2f2",
                                    columnOpacity: 1,
                                }
                            }
                        }

                        table.datas.push(item);
                    }

                }
            }
        } else {
            for (let key in body_data) {

                let items = "";
                if (body_data[key].rental_item_id_fk > 0 && show_on_docket == "1") {
                    items = { label: `     ` + body_data[key].item, options: { fontFamily: 'Roboto-italic' } };
                } else {
                    items = body_data[key].item;
                }

                let item = {}
                if (body_data[key].is_header) {
                    const head = { label: body_data[key].item, options: { fontFamily: 'Roboto-bolditalic' } };
                    item = {
                        item: head || "",
                        qty: "",
                        disc: "",
                        unit: "",
                        price: "",
                        amount: ""
                    }
                } else if (print_type == "CHECKLIST") {
                    item = {
                        img: body_data[key].file_path || "",
                        qty: body_data[key].qty || 0,
                        item: items || "",
                        location: body_data[key].location || "",
                        bin_no: body_data[key].bin_no || "",
                        comment: "",
                        p: "square_box",
                        d: "square_box",
                        r: "square_box",
                    }
                } else if (print_type == "RETURN SLIP") {
                    item = {
                        img: body_data[key].file_path || "",
                        qty: body_data[key].qty || 0,
                        item: items || "",
                        comment: "",
                        start: "1",
                        balance: body_data[key]?.balance || 0,
                        collected: "rect_box",
                    }
                }
                else {
                    item = {
                        img: body_data[key].file_path || "",
                        qty: body_data[key].qty || 0,
                        item: items || "",
                        disc: body_data[key].discount_rate || 0,
                        unit: body_data[key].units || 0,
                        price: body_data[key].unit_price ? numberWithCommas(body_data[key]?.unit_price) : "0",
                        amount: body_data[key].amount ? floatnumberWithCommas(body_data[key]?.amount) : "0.00",
                    }
                }

                if (attach_images !== "1") {
                    if ((key % 2)) {
                        item.options = {
                            columnColor: "#f2f2f2",
                            columnOpacity: 1,
                        }
                    }
                }

                table.datas.push(item);
            }
        }

        const options = {
            x: 0, // {Number} default: undefined | doc.x
            y: 0, // {Number} default: undefined | doc.y
            divider: {
                header: { disabled: false, width: 2, opacity: 1 },
                horizontal: { disabled: false, width: 0.5, opacity: 0.5 },
                vertical: { disabled: false, width: 0.5, height: 15, opacity: 0.5 }
            },
            prepareHeader: () => doc.font("Roboto").fontSize(8),
            prepareRow: () => doc.font("Roboto").fontSize(8.5),
        }
        await doc.table(table, options);
        doc.moveDown(2)
        doc.underline(0, doc.y, 577, 0.15, { color: '#bdbdbd' });
        const total_y = doc.y - 10;
        let cont_y = print_type == "CONTRACT" || print_type == "QUOTE" ? doc.y + 5 : doc.y + 72;
        // Footer's for quote and contract
        if (print_type == "QUOTE" || print_type == "CONTRACT") {
            doc.opacity(0.7);
            doc.font('Roboto').text("RENTAL", 35, cont_y);
            doc.font('Roboto').text("SERVICES", 35, doc.y - 1);
            doc.font('Roboto').text("SALES", 35, doc.y - 1).opacity(1);
            doc.font('Roboto').text(total_rental ? `${currency_type}${parseFloat(`${total_rental}`.includes(",")? total_rental?.replaceAll(",",""):total_rental).toFixed(2)}` : currency_type + "0.00", 45, cont_y, { width: 110, align: 'right' });
            doc.font('Roboto').text(total_services ? `${currency_type}${parseFloat(`${total_services}`.includes(",")? total_services?.replaceAll(",",""):total_services).toFixed(2)}` : currency_type + "0.00", 45, doc.y - 1, { width: 110, align: 'right' });
            doc.font('Roboto').text(total_sales ? `${currency_type}${parseFloat(`${total_sales}`.includes(",")? total_sales?.replaceAll(",",""):total_sales).toFixed(2)}` : currency_type + "0.00", 45, doc.y - 1, { width: 110, align: 'right' });

            doc.opacity(0.7);
            doc.font('Roboto').text("DELIVERY", 250, cont_y);
            doc.font('Roboto').text("COLLECTION", 250, doc.y - 1);
            doc.font('Roboto').text("BOND", 250, doc.y - 1);
            doc.font('Roboto').text("INSURANCE", 250, doc.y - 1);
            (print_type == "QUOTE" || print_type == "CONTRACT") && doc.font('Roboto').text("DISCOUNT", 250, doc.y - 1);

            doc.font('Roboto').opacity(1).text(delivery_charge ? `${currency_type}${parseFloat(`${delivery_charge}`.includes(",")? delivery_charge?.replaceAll(",",""):delivery_charge).toFixed(2)}` : currency_type + "0.00", 268, cont_y, { width: 110, align: 'right' });
            doc.font('Roboto').text(collection_charge ? `${currency_type}${parseFloat(`${collection_charge}`.includes(",")? collection_charge?.replaceAll(",",""):collection_charge).toFixed(2)}` : currency_type + "0.00", 268, doc.y - 1, { width: 110, align: 'right' });
            doc.font('Roboto').text(!isNaN(bond) ? `${currency_type}${parseFloat(`${bond}`.includes(",")? bond?.replaceAll(",",""): bond).toFixed(2)}` : currency_type + "0.00", 268, doc.y - 1, { width: 110, align: 'right' });
            doc.font('Roboto').text(!isNaN(sur_charge) ? `${currency_type}${parseFloat(`${sur_charge}`.includes(",")? sur_charge?.replaceAll(",",""):sur_charge).toFixed(2)}` : currency_type + "0.00", 268, doc.y - 1, { width: 110, align: 'right' });
            (print_type == "QUOTE" || print_type == "CONTRACT") && doc.font('Roboto').text(!isNaN(discount) ? `${currency_type}${parseFloat(`${discount}`.includes(",")? discount?.replaceAll(",",""):discount).toFixed(2)}` : currency_type + "0.00", 268, doc.y - 1, { width: 110, align: 'right' });

            doc.opacity(0.7);
            doc.font('Roboto').text("SUBTOTAL", 403, cont_y, { lineBreak: false }).opacity(1).text(!isNaN(sub_total) ? `${currency_type}${parseFloat(`${sub_total}`.includes(",")? sub_total?.replaceAll(",",""):sub_total).toFixed(2)}` : currency_type + "0.00", { align: 'right' });
            doc.font('Roboto').opacity(0.7).text(data.rental_data.tax_rate.tax_code || "GST", 403, doc.y - 1, { lineBreak: false }).text(data.rental_data.tax_rate.percentage ? (data.rental_data.tax_rate.percentage + '%'):"0%", 480, doc.y, { width: 120, align: 'left', lineBreak: false }).opacity(1).text(tax ? `${currency_type}${parseFloat(`${tax}`.includes(",")? tax?.replaceAll(",",""):tax).toFixed(2)}` : currency_type + "0.00", 0, doc.y - 10, { align: 'right' });
            (print_type == "QUOTE"||print_type == "CONTRACT") && doc.font('Roboto').opacity(0.7).text(card_name?card_name:"", 403, doc.y - 1, { lineBreak: false }).text(card_percentage ? (card_percentage + '%'):"0%", 480, doc.y, { width: 120, align: 'left', lineBreak: false }).opacity(1).text(credit_card_charge ? `${currency_type}${parseFloat(`${credit_card_charge}`.includes(",")? credit_card_charge?.replaceAll(",",""):credit_card_charge).toFixed(2)}` : currency_type + "0.00", 0, doc.y - 10, { align: 'right' });

            (print_type == "QUOTE"||print_type == "CONTRACT") && doc.roundedRect(392, doc.y + 6, 180, 35, 0).fillAndStroke('#f2f2f2', '#f2f2f2');
            doc.fill('black').stroke();
            doc.font('Roboto-bold').fontSize(13).opacity(0.7).text(("TOTAL"), 403, doc.y + 7, { lineBreak: false }).opacity(1).text(total ? `${currency_type}${parseFloat(`${total}`.includes(",")? total?.replaceAll(",",""):total).toFixed(2)}` : currency_type + "0.00", { align: "right" }).stroke();
            doc.font("Roboto").fontSize(8).opacity(0.7);
            doc.text(("PAID :"), 403, doc.y, { lineBreak: false }).opacity(1).text(paid ? `${currency_type}${parseFloat(`${paid}`.includes(",")? paid?.replaceAll(",",""):paid).toFixed(2)}` : currency_type + "0.00", { align: "right" }).stroke();
            (print_type == "QUOTE"||print_type == "CONTRACT") && doc.opacity(0.7).text(("BALANCE DUE"), 403, doc.y - 1, { lineBreak: false }).opacity(1).text(total_due ? `${currency_type}${parseFloat(`${total_due}`.includes(",")? total_due?.replaceAll(",",""):total_due).toFixed(2)}` : currency_type + "0.00", { align: "right" }).opacity(1);
            doc.fill('gray').stroke();

            if (print_type == "QUOTE") {
                doc.rect(422, doc.y + 8, 147, 22).lineWidth(1).fillAndStroke('white', "#6e0500");
                doc.fill("#6e0500").stroke();
                doc.font("Roboto-bold").text(("DEPOSIT"), 426, doc.y + 10, { align: "left", lineBreak: false }).text(data?.rental_data.deposit ? `${currency_type}${parseFloat( `${data?.rental_data?.deposit}`.includes(",")? data?.rental_data?.deposit?.replaceAll(",",""):data?.rental_data?.deposit).toFixed(2)}` : currency_type + "0.00", 0, doc.y, { align: "right" }).stroke();
                doc.text(("DATE DUE"), 426, doc.y - 1, { align: "left", lineBreak: false }).text(due_date ? due_date : "", 0, doc.y, { align: "right" }).stroke();
            }
            // Add Bottom left content
            const Note_y = doc.y + 4;
            doc.fill('black').stroke();
            doc.font('Roboto').text("PAYING BY CREDIT CARD", 30, doc.y + 4);//648
            doc.font('Roboto').text("NAME: _____________________________________ EXP: ____________", 30, doc.y + 8);//668
            doc.font('Roboto').text("CARD NO: ____________________________________________________", 30, doc.y + 8);//685
            doc.font('Roboto').text("CCV: __________ SIGN: _______________________________________", 30, doc.y + 8);//703
            (print_type == "QUOTE"||print_type == "CONTRACT") && doc.fontSize(8).font('Roboto').text("If you are wishing to pay via BPAY, please contact us for our BPAY details.", 30, doc.y + 8, { width: 240, align: 'left' }).opacity(0.5);

            (print_type == "QUOTE"||print_type == "CONTRACT") && doc.font("Roboto-bold").opacity(1).text(("DELIVERY NOTES:"), 287, Note_y, { width: 125, align: "left" }).stroke();
            (print_type == "QUOTE"||print_type == "CONTRACT") && doc.font("Roboto").text(delivery_notes || "", 287, doc.y, { width: 125, align: "left" }).stroke();


        } else if (print_type == "CHECKLIST") {
            // doc.underline(20, doc.y - 10, 550, 1, { color: '#bdbdbd' });
            doc.font('Roboto-bold').text(("Contact: "), 39, doc.y + 5, { align: 'left', lineBreak: false }).font("Roboto").text(option1 ? option1 : ` `).stroke();
            doc.font('Roboto-bold').text(("Site Phone: "), 39, doc.y, { align: 'left', lineBreak: false }).font("Roboto").text(option2 ? option2 : ` `).stroke();
            doc.font('Roboto-bold').text(("Surfaces: "), 39, doc.y, { align: 'left', lineBreak: false }).font("Roboto").text(option3 ? option3 : ` `).stroke();
            doc.font('Roboto-bold').text(("Power Supplied: "), 39, doc.y, { align: 'left', lineBreak: false }).font("Roboto").text(option4 ? option4 : ` `).stroke();
            doc.font('Roboto-bold').text(("Stairs: "), 39, doc.y, { align: 'left', lineBreak: false }).font("Roboto").text(option5 ? option5 : ` `).stroke();
            doc.font('Roboto-bold').text(("Other Info: "), 39, doc.y, { align: 'left', lineBreak: false }).font("Roboto").text(option6 ? option6 : ` `).stroke();


            doc.font("Roboto-bold").opacity(1).text(("DELIVERY NOTES:"), 0, doc.y - 59, { align: "right" }).stroke();
            doc.font("Roboto").text(delivery_notes || "", 0, doc.y, { align: "right" }).stroke();
        }

        //this is footer for first page
        const range = doc.bufferedPageRange();
        for (let i = range.start; i <= (doc._pageBufferStart +
            doc._pageBuffer.length - 1); i++) {
            doc.switchToPage(i);

            let bottom = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;
            doc.opacity(1);
            print_type == "CHECKLIST" && doc.font('Roboto').fontSize(9).text("Delivered by:______________________________Customer Name:__________________________Sign:_____________________Date__________________", 0.5 * (doc.page.width - 700), doc.page.height - 43,
                {
                    width: 700,
                    align: "center",
                    lineBreak: false,
                });
            (print_type == "QUOTE" || print_type == "CONTRACT") && doc.font('Roboto').fontSize(8).text("I accept the condition of Rental (Sign)__________________________________Print Name___________________________________________Date__________________", 0.5 * (doc.page.width - 700), doc.page.height - 43,
                {
                    width: 700,
                    align: "center",
                    lineBreak: false,
                });
            print_type == "RETURN SLIP" && doc.font('Roboto').fontSize(9).text("Goods have been returned (Sign) _____________________________ Print Name________________________________ Date__________________", 0.5 * (doc.page.width - 700), doc.page.height - 43,
                {
                    width: 700,
                    align: "center",
                    lineBreak: false,
                });

            if (data?.rental_data?.business_get) {
                doc.font('Roboto').fontSize(8).text(`${label || ""} ${company_no || ""} ${office_phone ? `PHONE: ${office_phone}` : ""} ${office_email ? `EMAIL: ${office_email}` : ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 31,
                    {
                        width: 450,
                        align: 'center',
                        lineBreak: false,
                    });
                doc.font('Roboto').fontSize(8).text(`${(address || company_city || company_state || company_zip) ? "MAIL:" : ""} ${address || ""} ${company_city || ""} ${company_state || ""} ${company_zip || ""} ${(warehouse_address || warehouse_city || warehouse_state || warehouse_zip) ? `WAREHOUSE:` : ""} ${warehouse_address || ""} ${warehouse_city || ""} ${warehouse_state || ""} ${warehouse_zip || ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 21.5,
                    {
                        width: 450,
                        lineBreak: false, align: "center",
                    });
                (print_type == "QUOTE"||print_type == "CONTRACT"||print_type == "CHECKLIST"||print_type == "RETURN SLIP"||print_type == "") && doc.font('Roboto').fontSize(7).text(website ? `Powered by ${website}` : "", 0.5 * (doc.page.width - 350), doc.page.height - 12,
                    {
                        width: 350,
                        lineBreak: false, align: "center",
                    });
            }
            // Reset text writer position
            doc.text('', 50, 50)
            doc.page.margins.bottom = bottom;
        }

        // footer for next page 
        doc.on('pageAdded', () => {
            let bottom = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;
            if (data?.rental_data?.business_get) {
                doc.font('Roboto').fontSize(8).text(`${label || ""} ${company_no || ""} ${office_phone ? `PHONE: ${office_phone}` : ""} ${office_email ? `EMAIL: ${office_email}` : ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 31,
                    {
                        width: 450,
                        align: 'center',
                        lineBreak: false,
                    });

                doc.font('Roboto').fontSize(8).text(`${(address || company_city || company_state || company_zip) ? "MAIL:" : ""} ${address || ""} ${company_city || ""} ${company_state || ""} ${company_zip || ""} ${(warehouse_address || warehouse_city || warehouse_state || warehouse_zip) ? `WAREHOUSE:` : ""} ${warehouse_address || ""} ${warehouse_city || ""} ${warehouse_state || ""} ${warehouse_zip || ""}`, 0.5 * (doc.page.width - 450), doc.page.height - 21.5,
                    {
                        width: 450,
                        lineBreak: false, align: "center",
                    });

                (print_type == "QUOTE"||print_type == "CONTRACT"||print_type == "RETURN SLIP"||print_type == "CHECKLIST"||print_type == "") && doc.font('Roboto').fontSize(7).text(website ? `Powered by ${website}` : "", 0.5 * (doc.page.width - 350), doc.page.height - 12,
                    {
                        width: 350,
                        lineBreak: false, align: "center",
                    });
            }
            // Reset text writer position
            doc.text('', 50, 50);
            doc.page.margins.bottom = bottom;
        })

        if (attach_terms == "1") {        //Next page start
            doc.addPage({
                margins: {
                    top: 20,
                    bottom: 10,
                    left: 30,
                    right: 22
                }, size: 'A4', layout: "portrait"
            });

            doc.font('Roboto-black').fontSize(10.5).text(`Contract No: ${data.rental_data.rental_id}`, 0, 20, { align: 'right' });
            doc.fontSize(8);
            doc.font('Roboto').text(`Staff Member: ${data.rental_data.display_staff_name}`, 0, doc.y - 1, { align: 'right' });
            doc.font('Roboto').text(`Print date:  ${moment(print_date).format("D MMM YYYY")}`, 0, doc.y - 1, { align: 'right' });

            doc.font('Roboto-black').fontSize(13).text('TERMS & CONDITIONS OF HIRE', 34, doc.y + 4, { align: 'left' });

            doc.font('Roboto-black').fontSize(10).text('Bond', 34, 77, { align: 'left' });
            const bondPera = `All bonds will be held by the Hirer until the safe return or pickup of all products in the same condition as was\nhired out to the client minus any reasonable wear and tear. All bonds will then be returned to the client minus\nany fee incurred either due to late fee/extension fee and/or breakage/damage/pick up fee. If bond was\nreceived by the Hirer via digital means then the Client must allow a 3-business day turn around taking into\nconsideration bank transfers time frames.`;
            doc.font('Roboto').fontSize(9.5).text(bondPera, 34, doc.y - 1, { align: 'left', lineGap: -2 });


            doc.font('Roboto-black').fontSize(10).text("The option of a $250 cash bond or a copy of a credit card must be taken before receiving the agreed hired\nproducts.", 34, doc.y + 8, { align: 'left', lineGap: -2 });

            doc.font('Roboto-black').fontSize(10).text('Payment', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const PaymentPera = `To secure the booking date for event styling or products to be hired, the Client agrees to place a 50% deposit\nwith the Hirer within 7 days of receiving their invoice. Balance for prop hire and for event styling is due two\nweeks prior to event this can be made via cash, direct transfer or credit card over the phone (1% surcharge\napplies). Any other form of payment must be stated by the Client and accepted by the Hirer prior to the\ndeposit being paid.`;
            doc.font('Roboto').fontSize(9).text(PaymentPera, 34, doc.y, { align: 'left', lineGap: -1 });

            doc.font('Roboto-black').fontSize(10).text('Cancellation', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const CancellationPera = `All cancellations need be given in writing. No verbal cancellations shall be accepted to minimise any\nmisunderstandings. Orders cancelled within 4 weeks prior to event will forfeit their deposit. All cancellations\noutside of this 4-week window prior to their event, will incur a $50 administration fee which will be deducted\nfrom the deposit paid. All changes or removal of items from booking can only be made 4 weeks prior to the\nevent unless approved by the hirer. Additions can be made at any time subject to availability.`;
            doc.font('Roboto').fontSize(9).text(CancellationPera, 34, doc.y, { align: 'left', lineGap: -1 });

            doc.font('Roboto-black').fontSize(10).text('Insurance', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const InsurancePera = `Once products have been received the Client assumes all responsibilities and liabilities until they have been\nreturned to the Hirer.\nThe Client is responsible in maintaining all appropriate policies of insurance, covering liability, property and\ncasualty insurance's in amounts necessary to fully protect the Hirer and their products against all claims, loss or\ndamage. The Hirer is not responsible for any injury that may occur to persons over the hire period or\nthereafter due to any products supplied by the Hirer whether through payment or otherwise.`;
            doc.font('Roboto').fontSize(9).text(InsurancePera, 34, doc.y, { align: 'left', lineGap: -1 });

            doc.font('Roboto-black').fontSize(10).text('Loss or Damages', 34, doc.y + 9, { align: 'left', lineGap: 0.5 });
            const LossPera = `All products supplied by the hirer shall always be deemed owned by the hirer.\nAll products are supplied to the client on the bases of reasonable use within the advertised context.\nShould any product/s become lost, stolen or damaged when in possession of the Client, the Client shall\nimmediately notify the Hirer. The Client agrees to pay for all products lost, destroyed, stolen, damaged or\nnot returned to the Hirer. All costs will be paid to the Hirer based on the current pricing and availability of\nthe products on the market. Should no equal product be found by the Hirer then the Client shall reimburse\nthe Hirer the cost in cash or bank transfer at the cost said by the Hirer. All reimbursements shall be paid\nwithin 48 hrs of the drop off of all products and maybe subject to late fee/extension fee if overdue.`;
            doc.font('Roboto').fontSize(9).text(LossPera, 34, doc.y, { align: 'left', lineGap: -1 });

            doc.font('Roboto-black').fontSize(10).text('Linen & Chairs', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const LinePera = `Our Linen and Chairs are kept in close to pristine condition. We ask that you take care when using red wine,\nchewing gum, or candle wax and cigarettes on our linen and chairs as stains may forfeit your bond payment.\nFurniture. We take pride in all our prop/furniture items. If there are any small imperfections we will advise the client\nprior to booking.`;
            doc.font('Roboto').fontSize(9).text(LinePera, 34, doc.y, { align: 'left', lineGap: -1 });

            doc.font('Roboto-black').fontSize(10).text('Cleaning', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const CleaningPera = `We ask you to clean the products and return them in the same condition as hired. Should any facial or\ncosmetic disfigurement occur during the time in which the product is in possession of the client, the Hirer shall\njudge and charge a damage fee to the Client. All linen returned will be washed by the Hirer and does not need\nto be washed by the client.`;
            doc.font('Roboto').fontSize(9).text(CleaningPera, 34, doc.y, { align: 'left', lineGap: -1 });

            doc.font('Roboto-black').fontSize(10).text('Hire Period', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const HirePeriodPera = `All products are hired out on a 3-day hire basis – Friday to Monday.\n`;
            doc.font('Roboto').fontSize(9).text(HirePeriodPera, 34, doc.y, { align: 'left', lineGap: -1 });

            doc.font('Roboto-black').fontSize(10).text('Client pickup', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const ClientPera = `Shall occur on Friday between 10am to 2pm at the location of the Hirers’ business premises\nUnit X, 183 Some Street Somewhere 2164.`;
            doc.font('Roboto').fontSize(9).text(ClientPera, 34, doc.y, { align: 'left', lineGap: -1 });

            doc.font('Roboto-black').fontSize(10).text('Drop off', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const DropPera = `Shall occur at the above-mentioned business location, the following Monday between 10 am and\n2 pm. Should the client fail to return the products within the allocated time frame then the client will incur a late\nfee/extension fee of $25 per day. This will be deducted from the bond or charged to the credit card details left\nas security.`;
            doc.font('Roboto').fontSize(9).text(DropPera, 34, doc.y, { align: 'left', lineGap: -1 });

            doc.font('Roboto-black').fontSize(10).text('Delivery & Pickup', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const DeliveryPera = `Delivery is a drop & go service at an easily accessible ground level or in garage premises. Beyond these\nlocations will incur an extra charge`;
            const [DeliveryPeram, ...secondPera] = DeliveryPera.split("\n");
            const nextPera = secondPera.join("\n")
            doc.font('Roboto').fontSize(9).text(DeliveryPeram, 34, doc.y, { align: 'left', lineGap: -1 });

            //Next page start
            doc.addPage({
                margins: {
                    top: 20,
                    bottom: 10,
                    left: 30,
                    right: 22
                }, size: 'A4', layout: "portrait"
            });
            //Next page header
            doc.font('Roboto-black').fontSize(10.5).text(`Contract No: ${data.rental_data.rental_id}`, 0, 20, { align: 'right' });
            doc.fontSize(8);
            doc.font('Roboto').text(`Staff Member: ${data.rental_data.display_staff_name}`, 0, doc.y - 1, { align: 'right' });
            doc.font('Roboto').text(`Print date: ${print_date}`, 0, doc.y - 1, { align: 'right' });

            if (nextPera) {
                doc.font('Roboto').fontSize(9).text(nextPera, 34, doc.y + 4, { align: 'left', lineGap: -1 });
            }
            doc.font('Roboto-black').fontSize(10).text('Bump in & Bump out', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const BumpPera = `Bump in is when the client is ready to receive the goods without delay.\nBump out is when goods are packed by the client and ready to be picked up without delay. Any delays will\nincur an additional charge.`;
            doc.font('Roboto').fontSize(9).text(BumpPera, 34, doc.y, { align: 'left', lineGap: -1 });

            doc.font('Roboto-black').fontSize(10).text('Setting Up & Packing Down', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const SettingPera = `Event XYZ's Logistics team DO NOT set-up and pack down. Set up is the responsibility of the client.\nStyling services are additional.`;
            doc.font('Roboto').fontSize(9).text(SettingPera, 34, doc.y, { align: 'left', lineGap: -1 });

            doc.font('Roboto-black').fontSize(10).text('Prop Hire Rates', 34, doc.y + 9, { align: 'left', lineGap: -1 });
            const PropPera = `All hire rates are ONLY for the hiring of products and not for any other services. Any other services agreed\nupon will be deemed separate to this agreement.`;
            doc.font('Roboto').fontSize(9).text(PropPera, 34, doc.y, { align: 'left', lineGap: -1 });
        }
        return doc;
    },
    file_name: async function (data) {
        Client.belongsTo(Auth, { targetKey: '__staff_id_pk', foreignKey: 'created_by' })
        const client = await Client.findOne({
            raw: true,
            attributes: ["company", "address_billing", "telephone","account_name", "name_full"], where: { __client_id_pk: data.rental_data.client_id, is_deleted: 0 },
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