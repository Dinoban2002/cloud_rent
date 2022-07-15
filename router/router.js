var handy = require("../config/common");
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;
const { ConfigBusiness, TaxRate, CreditCardRate, Administration, Inventory, OffHire, Rental, Client, Address, ConfigRentalStatus, ClientNotes, Auth, RentalItems, SubRent, Payment, Invoice, Rate, InventoryLoss, Return, AssetManagement, Task, InventoryRate } = require("../models/Model")(
    ["ConfigBusiness", "TaxRate", "CreditCardRate", "Administration", "Inventory", "OffHire", "Rental", "Client", "Address", "ConfigRentalStatus", "ClientNotes", "Auth", "RentalItems", "SubRent", "Payment", "Invoice", "Rate", "Task", "InventoryLoss", "InventoryRate", "Return", "AssetManagement"]
);
async function Router(fastify) {
    // fastify.post('/address', async (req, res) => {
    //     let where = req.body && req.body.search_text ? {
    //         [Op.or]: [{ address1: { [Op.substring]: req.body.search_text } },
    //         { city: { [Op.substring]: req.body.search_text } },
    //         { state: { [Op.substring]: req.body.search_text } },
    //         { country: { [Op.substring]: req.body.search_text } },
    //         { zip: { [Op.substring]: req.body.search_text } }]
    //     } : {};
    //     //const filter = await handy.constructDateSearch(query.field, query.filter_text);
    //     const data = await Address.findAll({ where })
    //     res.send({ status: true, data })
    // })

    fastify.get('/test/:id', { websocket: true },
        function wsHandler(connection, req) {
            let test = 1;
            connection.socket.on('open', function open() {
                console.log('Connection opened!');
            })
            connection.socket.on('message', message => {
                try {
                    // message.toString() === 'hi from client'
                    connection.socket.send(test)
                    test++;
                    fastify.websocketServer.clients.forEach(client => {

                        if (client.readyState === 1) {
                            client.send(req);
                        }

                    });
                    // if(fastify.rooms.length)
                    // fastify.rooms[0].socket.send("i got here");
                } catch (e) {
                    connection.socket.send(e.toString())
                }
            })
            connection.socket.on('close', message => {
                test = new Date();
                connection.socket.send("close")
            })
            // connection.socket.on('error', message => {
            //     test = new Date();
            //     connection.socket.send("error")
            // })
            //res.status(200).send({key:"suceess"});
        })
}

module.exports = Router;