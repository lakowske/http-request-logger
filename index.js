/*
 * (C) 2015 Seth Lakowske
 */

var level          = require('level-party');

//open the request logs db
var db = level('./request.db', { encoding: 'json' });

function requestLogger(levelPath) {

    return function(req, res) {
        var millis = new Date().getTime();
        var reqDescription = req.headers;
        reqDescription.url = req.url;
        reqDescription.time = millis;
        db.put(millis, JSON.stringify(reqDescription));
    };

}

function requests() {

    var dbStream = db.createReadStream();

    return function(req, res, params) {
        res.statusCode = 200;
        dbStream.pipe(res);
    }

}

module.exports.requestLogger = requestLogger;
module.exports.requests      = requests;
