const fastify = require('fastify')({
    logger: true
});
fastify.register(require("../router/router"));
fastify.register(require("../router/LocationRouter"));
fastify.register(require("../router/ClientRouter"));
fastify.register(require("../router/AuthRouter"));
fastify.register(require("../router/InvoiceRouter"));
fastify.register(require("../router/RentalRouter"));
fastify.register(require("../router/CalendarFilter"));
fastify.register(require("../router/InventoryRouter"));
fastify.register(require("../router/ItemComponentRouter"));
fastify.register(require("../router/AdminRouter"));
fastify.register(require("../router/AccountTypeRouter"));
fastify.register(require("../router/CategoryRouter"));
fastify.register(require("../router/CompanySubscriptionRouter"));
fastify.register(require("../router/GetAllDropdowns.js"));
fastify.register(require("../router/UploadRouter"));
fastify.register(require("../router/LogisticsRouter.js"));
fastify.register(require("../router/MessageRouter"));
fastify.register(require("../router/ServiceRouter"));
fastify.register(require("../router/POSRouter"));

module.exports = fastify;