/*
 * (C) 2015 Seth Lakowske
 */

var level          = require('level-party');
var through        = require('through');
var livestream     = require('level-live-stream');

/*
 * Can store requests to a level db and serve requests.
 */
function RequestLogger(db) {
    this.db = db;
}

RequestLogger.prototype.request = function() {

    var self = this;
    return function(req, res) {

        var millis = new Date().getTime();
        var reqDescription = req.headers;
        reqDescription.url = req.url;
        reqDescription.time = millis;
        self.db.put(millis, JSON.stringify(reqDescription));

    };

}

RequestLogger.prototype.requests = function() {

    var self = this;
    return function(req, res, params) {

        var dbStream = livestream(self.db);
        res.statusCode = 200;

        dbStream.on('data', function(data) {
            res.write(JSON.stringify(data) + '\n');
        });

        dbStream.on('end', function() { console.log('donsoo') });

    }

}

module.exports = function(levelPath) {return new RequestLogger(levelPath);}
