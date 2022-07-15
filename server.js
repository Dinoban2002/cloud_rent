// Require the framework and instantiate it
var result = require('dotenv').config();
const nodemailer = require("nodemailer");
const fs = require('fs');
const { Log } = require("./models/Model")(["Log"]);
const { parsed: envs } = result;
const NodeCache = require('node-cache');
let moment = require('moment');
const fastify = require('fastify')({
  logger: true
});
fastify.setErrorHandler(function (error, request, reply) {
  let upload_path = envs.documents_path + '/logs';
  if (!fs.existsSync(envs.documents_path)) {
    fs.mkdirSync(envs.documents_path);
  }
  if (!fs.existsSync(upload_path)) {
    fs.mkdirSync(upload_path);
  }
  this.log.error(error)
  const file_name = moment().format("DD_MM_yyyy") + ".log";
  let content =
    `-----------------------------------------------------------
  Time    : ${moment().format("HH:mm:ss")}
  URL     : ${request.url}
  Body    : ${request.body ? JSON.stringify(request.body) : "{}"}
  Params  : ${request.params ? JSON.stringify(request.params) : "{}"}
  Error   : ${error.message}
  Stack   : ${error.stack}
  `;
  try {
    //config
    let transporter = nodemailer.createTransport({
      host: envs.config_smtp_host,
      port: envs.config_smtp_port,
      secure: envs.config_smtp_secure == 465 ? true : false, // true for 465, false for other ports
      auth: {
        user: envs.config_smtp_username, // generated ethereal user
        pass: envs.config_smtp_password, // generated ethereal password
      },
    });
    let message = {
      from: envs.from,
      to: envs.to_mail_adds_for_send,
      text: content,
      subject: "Server crashed please check....",
    };
    if (envs.cc) {
      message.cc = envs.cc.replace(";", ", ");
    }
    let info = transporter.sendMail(message);
  } catch (e) {
    console.log(err);
  }
  fs.writeFile(upload_path + '/' + file_name, content, { flag: 'a' }, err => {
    console.log(err);
  })
  reply.status(409).send({ status: false, message: "Something went wrong. Please try after some time. " + error })
})
// stdTTL is the default time-to-live for each cache entry
fastify.appCache = new NodeCache()
fastify.register(require('fastify-websocket'), { options: { clientTracking: true } });
fastify.register(require("fastify-cors"), {
  origin: ["https://app.onlinerentalstore.com/", , "http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ['Content-Type', 'Authorization']
});
fastify.register(require('fastify-formbody'))
fastify.register(require('fastify-multipart'), {
  addToBody: true
})
fastify.register(require("./router/router"));
fastify.register(require("./router/LocationRouter"));
fastify.register(require("./router/ClientRouter"));
fastify.register(require("./router/AuthRouter"));
fastify.register(require("./router/InvoiceRouter"));
fastify.register(require("./router/RentalRouter"));
fastify.register(require("./router/CalendarFilter"));
fastify.register(require("./router/InventoryRouter"));
fastify.register(require("./router/ItemComponentRouter"));
fastify.register(require("./router/AdminRouter"));
fastify.register(require("./router/AccountTypeRouter"));
fastify.register(require("./router/CategoryRouter"));
fastify.register(require("./router/CompanySubscriptionRouter"));
fastify.register(require("./router/GetAllDropdowns.js"));
fastify.register(require("./router/UploadRouter"));
fastify.register(require("./router/LogisticsRouter.js"));
fastify.register(require("./router/MessageRouter"));
fastify.register(require("./router/ServiceRouter"));
fastify.register(require("./router/POSRouter"));
fastify.register(require("./router/FinancialsRoutes"));
fastify.register(require("./router/UnitTypeRouter"));
fastify.register(require("./router/PaymentRouter"));
fastify.register(require("./router/DocumentRouter"));
fastify.register(require("./router/TaskServiceRouter"));
fastify.register(require('fastify-jwt'), {
  secret: envs.thekey
})

const port = 3000;
fastify.rooms = {};
fastify.subscribe = (req, connection, name) => {
  const { table, id } = req.headers;
  const socket_key = req.headers["sec-websocket-key"]
  if (socket_key && table && id) {
    room = table + "_" + id;
    if (!fastify.rooms[room])
      fastify.rooms[room] = {};
    fastify.rooms[room][socket_key] = { connection, name };
    return room;
  } else {
    return false;
  }
}

fastify.unSubscribe = (req) => {
  const { table, id } = req.headers;
  const socket_key = req.headers["sec-websocket-key"]
  if (socket_key && table && id) {
    room = table + "_" + id;
    if (fastify.rooms[room] && fastify.rooms[room][socket_key]) {
      if (fastify.rooms[room].lock_by && fastify.rooms[room].lock_by == socket_key) {
        fastify.rooms[room].lock_by = false;
      }
      delete fastify.rooms[room][socket_key];
    }

    if (fastify.rooms[room] && !Object.keys(fastify.rooms[room]).length == 1) {
      delete fastify.rooms[room];
    }
    return true;
  } else {
    return true;
  }
}

fastify.setLock = (room, socket_key) => {
  if (fastify.rooms[room] && !fastify.rooms[room].lock_by) {
    fastify.rooms[room].lock_by = socket_key;
    return socket_key;
  } else {
    return false;
  }
}
fastify.unLock = (room, socket_key) => {
  if (fastify.rooms[room] && fastify.rooms[room].lock_by == socket_key) {
    fastify.rooms[room].lock_by = false;
    fastify.sendInRoom(room, JSON.stringify({ status: true, message: "Record un locked" }));
    return true;
  } else {
    return false;
  }
}
fastify.lockBy = (room) => {
  if (fastify.rooms[room] && fastify.rooms[room].lock_by && fastify.rooms[room][fastify.rooms[room].lock_by]) {
    return fastify.rooms[room][fastify.rooms[room].lock_by].name;
  } else {
    return "";
  }
}

fastify.getRoom = (room) => {
  if (fastify.rooms[room] && fastify.rooms[room]) {
    return fastify.rooms[room];
  } else {
    return "";
  }
}

fastify.sendInRoom = (room, data) => {
  if (fastify.rooms[room] && fastify.rooms[room]) {
    const socket_room = fastify.rooms[room];
    Object.keys(socket_room).forEach(key => {
      if (key != "lock_by" && socket_room[key] && socket_room[key].connection.socket._readyState == 1) {
        socket_room[key].connection.socket.send(data);
      }
    })
  }

}

fastify.addHook('onResponse', async (request, reply) => {
  try {
    let { url, body, method, ip } = request;
    if (method != "OPTIONS") {
      body = JSON.stringify(body);
      Log.create({ uri: url, params: body, method, ip_address: ip, response_code: reply.statusCode, api_key: request.headers.authorization, authorized: reply.athenticated ? 1 : 0 });
    }
  } catch (e) {
    console.log(e);
  }
})

// Run the server!
fastify.listen(port, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`server listening on ${address}`)
  fastify.log.info(`server listening on ${address}`)
})