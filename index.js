/*
 * (C) 2015 Seth Lakowske
 */

var through        = require('through');
var livestream     = require('level-live-stream');
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
    var parseify = new JSONStream.parse();

    return function(req, res, params) {

        if (req.method === 'GET') {
            //allow the requestor to set options
            var options = req.headers;
            if (options.tail === 'false') {options.tail = false}

            var dbStream = livestream(self.db, options);
            res.statusCode = 200;

            dbStream.on('data', function(data) {
                res.write(JSON.stringify(data) + '\n');
            });

            dbStream.on('end', function() { console.log('donsoo') });
        } else if (req.method === 'POST') {
            console.log('Adding request via POST');
            req.pipe(parseify);

            parseify.on('data', function(dbrequest) {
                var millis = new Date().getTime();
                console.log(typeof dbrequest, typeof dbrequest.value, dbrequest.value);
                self.db.put(millis, dbrequest.value);
                res.write('request received');
                res.end();
            });
        }
    }

}

RequestLogger.prototype.classified = function() {

    var self = this;
    var parseify = new JSONStream.parse();

    return function(req, res, params) {
        req.pipe(process.stdout);
        req.pipe(parseify);

        parseify.on('data', function(dbrequest) {
            var millis = new Date().getTime();
            self.db.put(millis, dbrequest);
        });

    }
}

module.exports = function(db) {return new RequestLogger(db);}
