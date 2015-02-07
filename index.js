/*
 * (C) 2015 Seth Lakowske
 */

var level          = require('level-party');
var through        = require('through');

var stringify = through(function(data) {
    var str = JSON.stringify(data) + '\n';
    this.queue(str);
});

function RequestLogger(levelPath) {
    //open the request logs db
    this.db = level(levelPath, { encoding: 'json' });
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
        var dbStream = self.db.createReadStream();
        res.statusCode = 200;
        dbStream.pipe(stringify).pipe(res);
    }

}

module.exports = function(levelPath) {return new RequestLogger(levelPath);}
