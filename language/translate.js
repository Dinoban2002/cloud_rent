module.exports = {
    validationMsg: function (fileName,type = "en",itemNameAppend){
        var ln_file = require('./'+ type + '/' + fileName.split('.')[0]);
        var findreq = ln_file[fileName.split('.')[1]];
        if(findreq === undefined){
            findreq = '';
        }else if(itemNameAppend && itemNameAppend.length > 0){
            itemNameAppend.forEach((element,index) => {
                findreq = findreq.replace('${{'+index+'}}',element)
            });
            findreq = findreq;
        }
        return findreq
    }
}