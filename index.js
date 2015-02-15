/*
 * (C) 2015 Seth Lakowske
 */

var through        = require('through');
var livestream     = require('level-live-stream');

/*
 * store and pipe requests to a level db.
 * serve requests from a level db.
 */
function RequestLogger(db) {
    this.db = db;
}

/*
 * push a level encoded request to the database
 */
RequestLogger.prototype.push    = function() {

    var self = this;

    return through(function(levelRequest) {
        self.db.put(levelRequest.key, levelRequest.value);
        this.queue(levelRequest);
    })

}

/*
 * log a request to the level db.
 */
RequestLogger.prototype.request = function() {

    var self = this;
    return function(req, res) {

        var millis                   = new Date().getTime();
        var reqDescription           = req.headers;
        reqDescription.url           = req.url;
        reqDescription.time          = millis;
        reqDescription.remoteAddress = req.connection.remoteAddress;

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

module.exports = function(db) {return new RequestLogger(db);}
