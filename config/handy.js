var handy = {
     date(format){
        var date = format;
        let date_ob = new Date();
        date = date.replace(/dd/i,("0" + date_ob.getDate()).slice(-2));
        date = date.replace(/mm/i,("0" + (date_ob.getMonth() + 1)).slice(-2));
        date = date.replace(/yyyy/i,date_ob.getFullYear());
        date = date.replace(/hh/i,date_ob.getHours());
        date = date.replace(/mm/i,date_ob.getMinutes());
        date = date.replace(/ss/i,date_ob.getSeconds());
        return date;
    }
}

module.exports = handy;