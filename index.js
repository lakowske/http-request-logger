/*
 * (C) 2015 Seth Lakowske
 */

var level          = require('level-party');

function RequestLogger(levelPath) {
    //open the request logs db
    var db = level(levelPath, { encoding: 'json' });
}

RequestLogger.prototype.request = function() {

    return function(req, res) {
        var millis = new Date().getTime();
        var reqDescription = req.headers;
        reqDescription.url = req.url;
        reqDescription.time = millis;
        db.put(millis, JSON.stringify(reqDescription));
    };

}

RequestLogger.prototype.requests = function() {

    return function(req, res, params) {
        var dbStream = db.createReadStream();
        res.statusCode = 200;
        dbStream.pipe(res);
    }

}

module.exports = function() {return new RequestLogger();}
