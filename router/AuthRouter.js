const sequelize = require("../config/database");
const { Auth, CompanySubscription, UserSession, Administration } = require("../models/Model")(
  ["UserSession", "CompanySubscription", "Auth", "Administration"]);
var md5 = require('md5');
var translate = require('../language/translate').validationMsg;
var commonchange = require("../config/common");
var user_access_config = ["", "Administrator", "Sales", "Driver", "Accounts", "Warehouse"];

async function AuthRouter(fastify) {
  /**
   * @author Kirankumar
   * @summary This rout is usefull to login user to application
   * @returns Status and logged in User data
   */
  fastify.post('/auth/login', async (req, res) => {
    try {
      var statusCode = 200;
      var resData;
      const { useremail, password } = req.body;
      if (!useremail || !password) {
        res.status(401).send({ status: false, message: translate('Validation.login_invalid_username', 'en') });
        return;
      }
      await sequelize.authenticate();
      const data = await Auth.findOne({
        attributes: ['__staff_id_pk', '_company_id_fk', 'country', 'email', "password", "first", "last", "access_rights", "display_staff_name"], where: {
          email: useremail, is_deleted: 0
        }
      });
      if (data) {
        if (data.get("password") === md5(password)) {
          const company_id = data.get("_company_id_fk");
          const admin = await Administration.findOne({ attributes: ["currency"], where: { _company_id_fk: company_id } })
          const company_subscriptionCheck = await CompanySubscription.count({ where: { '_company_id_fk': company_id } });
          if (company_subscriptionCheck) {
            const comSub = await CompanySubscription.findOne({
              attributes: ['no_of_users', 'file_max_size', 'config_date_format', 'config_db_invoice_summary_date_format', 'config_db_date_format', 'decimal_digits'], where: {
                _company_id_fk: company_id
              }
            });
            const result_user_sessions = await UserSession.count({ where: { '_company_id_fk': company_id, active: 1 } })
            if ((comSub.get("no_of_users") > result_user_sessions) || (comSub.get("no_of_users") === 0)) {
              const session_temp = {
                _Auth_id_fk: data.get("__staff_id_pk"),
                _company_id_fk: data.get("_company_id_fk"),
                active: 1,
                login_time: new Date(),
                created_at: new Date()
              }
              const UserSessionModel = await UserSession.create(session_temp);
              const expirysetTime = `${process.env.expiry_token}`;
              const token = fastify.jwt.sign({
                user_id: data.get("__staff_id_pk"),
                lang: 'en',
                company_id,
                id: UserSessionModel.__user_session_id,
                username: data.get("display_staff_name"),
                date_format: comSub.get("config_db_date_format"),
                decimal: comSub.get("decimal_digits") || 2,
                inv_date_format: comSub.get("config_db_invoice_summary_date_format"),
                loginUserName: data.get("first") + " " + data.get("last")
              },
                { expiresIn: expirysetTime });
              resData = {
                "status": true,
                message: translate('Validation.login_user_log_in_successfully', 'en'),
                country: data.get("country"),
                currency: admin ? admin.currency : "",
                first: data.get("first"),
                last: data.get("last"),
                file_upload_max_size: comSub.get("file_max_size"),
                config_date_format: comSub.get("config_date_format"),
                access_rights: data.get("access_rights"),
                user_type: user_access_config[data.get("access_rights")] || "",
                token
              };
            }
            else {
              res.status(404).send({ status: false, message: translate('Validation.login_maximum_limit_reached', 'en') });
            }
          }
          else {
            res.status(404).send({ status: false, message: translate('Validation.login_company_subscription_is_not_active', 'en') });
          }
        } else {
          statusCode = 401;
          resData = { status: false, message: translate('Validation.login_invalid_password', 'en') };
        }
      } else {
        statusCode = 401;
        resData = { status: false, message: translate('Validation.login_invalid_username', 'en') };
      }
      res.status(statusCode).send(resData);
    } catch (error) {
      res.status(400).send({ status: false, message: error.message });
    }
  })
  /**
   * @author Kirankumar
   * @summary This rout is usefull for log out the user
   * @retuns Status and message
   */
  fastify.post('/auth/logout', async (req, res) => {
    try {
      var user = await commonchange.verfiytoken(req, res);
      if (!user) return;

      if (user.id) {
        const session_temp = {
          logout_time: new Date(),
          active: 0
        }
        const SessionModel_update = await UserSession.update(session_temp, { where: { '__user_session_id': user.id } });
        res.status(200).send({ status: true, message: translate('Validation.login_user_log_out_successfully', 'en') });
      }
      else {
        res.status(400).send({ status: false, message: translate('Validation.login_user_log_out_error', 'en') });
      }
    } catch (e) {
      res.status(400).send({ status: false, message: translate('Validation.login_user_log_out_error', 'en') });
    }
  })
  /**
   * @author Kirankumar
   * @summary This rout is usfull to refresh the auth token
   * @returns Status and refresh token data
   */
  fastify.post('/auth/refresh', async (req, res) => {
    try {
      var parsed_request = JSON.parse(req.body.data);
      if (parsed_request.username && parsed_request.password) {
        try {
          if (!req.headers.authorization.match("Bearer ")) {
            req.headers.authorization = "Bearer " + req.headers.authorization;
          }
          const login_data = await req.jwtVerify();
          await UserSession.update({ active: 1 }, { where: { '__user_session_id': login_data.id } });
          res.status(200).send({ status: true, token: req.headers.authorization.replace('Bearer ', '') })
        } catch (e) {
          if (e.message.match('Authorization token expired')) {
            var decoded = fastify.jwt.decode(req.headers.authorization.replace('Bearer ', ''));
            const data = await Auth.findOne({
              attributes: ['__staff_id_pk', '_company_id_fk', 'country', 'email', "password", "first", "last", "access_rights"], where: {
                email: parsed_request.username,
                is_deleted: 0
              }
            });
            const admin = await Administration.findOne({ attributes: ["currency"], where: { _company_id_fk: decoded.company_id } })
            if (data) {
              if (data.get("password") === md5(atob(parsed_request.password))) {
                const getUser_session_id = await UserSession.findOne({ raw: true, where: { '__user_session_id': decoded.id } });
                if (getUser_session_id) {
                  const expirysetTime = `${process.env.expiry_token}`;
                  const token = fastify.jwt.sign({ user_id: decoded.user_id, lang: 'en', company_id: decoded.company_id, id: decoded.id, username: decoded.username, date_format: decoded.date_format, inv_date_format: decoded.inv_date_format }, { expiresIn: expirysetTime });
                  const user_type = user_access_config[data.access_rights] || "";
                  res.status(200).send({ status: true, token: token, user_type, access_rights: data.access_rights, currency: admin ? admin.currency : "", message: translate('Validation.token_refresh_success', 'en') })
                }
                else {
                  res.status(401).send({ status: false, message: translate('Validation.login', 'en') });
                }
              }
              else {
                res.status(404).send({ status: false, message: translate('Validation.login_invalid_password', 'en') });
              }
            }
            else {
              res.status(404).send({ status: false, message: translate('Validation.login_invalid_username', 'en') });
            }
          }
          else {
            res.status(500).send({ status: false, message: translate('Validation.invalid_data', 'en') });
          }
        }
      }
      else {
        res.status(500).send({ status: false, message: translate('Validation.invalid_data', 'en') });
      }
    } catch (e) {
      res.status(404).send({ status: false, message: e.message });
    }
  })
}

module.exports = AuthRouter;
