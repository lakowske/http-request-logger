/*
 * (C) 2015 Seth Lakowske
 */

var levelHttp      = require('level-over-http');
var timestampFn    = require('lexicographic-timestamp').lexicographicTimestamp;
var JSONStream     = require('JSONStream');

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

    return levelHttp.push(this.db);

}

/*
 * log a request to the level db.
 */
RequestLogger.prototype.request = function() {

    var dbify       = levelHttp.push(this.db);
    var timestamper = levelHttp.timestampStream();
    var stringify   = JSONStream.stringify(false);

    timestamper.pipe(dbify).pipe(stringify).pipe(process.stdout);

    return function(req, res) {
        var millis                   = Date.now();
        var reqDescription           = req.headers;
        reqDescription.url           = req.url;
        reqDescription.time          = millis;
        reqDescription.remoteAddress = req.connection.remoteAddress;
        reqDescription.method        = req.method;

        timestamper.write({value:JSON.stringify(reqDescription)});
    };

}

RequestLogger.prototype.requests = function() {

    return levelHttp.live(this.db);

}

RequestLogger.prototype.classified = function() {

    return levelHttp.store(this.db);

}

module.exports = function(db) {return new RequestLogger(db);}
