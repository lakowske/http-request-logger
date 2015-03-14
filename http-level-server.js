/*
 * (C) 2015 Seth Lakowske
 */

var logger  = require('./');
var level   = require('level');
var router  = require('routes')();
var methods = require('http-methods');
var http    = require('http');

var port   = parseInt(process.argv[3], 10);
var db     = level(process.argv[2]);

var httpDb = logger(db);

router.addRoute('/level', methods({GET:httpDb.requests(), POST:httpDb.classified()}));

http.createServer(function(req, res) {
    var m = router.match(req.url);
    if (m) m.fn(req, res, m.params, function() {console.log("all done")});
    else res.end('request url invalid\n');
}).listen(port);
