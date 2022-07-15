module.exports = function (models = []){
    var out_models = {};
    for(key in models){
        out_models[models[key]] = require("./"+models[key]);
    }
    return out_models;
}