/*
 * (C) 2015 Seth Lakowske
 */

var test      = require('tape');
var http      = require('http');
var level     = require('level');
var through   = require('through');

test('can pipe to capture', function(t) {

    //open the request logs db
    var db = level('test.db', { encoding: 'json' });
    db.put('apple2', 'pie', function(err) {
        var requestLogger = require('./')(db);
        var requests      = requestLogger.requests();
        var result = '';
        var capture = through(function(data) {
            result += data.toString();
            this.queue(data);
        })
        capture.on('end', function() {
            console.log(result);
            console.dir(db);
            db.close()
            t.end();
        });

        requests(null, capture);
    });

})

test('can pipe through http', function(t) {
    var db = level('test2.db', { encoding: 'json' });
    var requestLogger = require('./')(db);
    var requests      = requestLogger.requests();

    var server = http.createServer(function(req, res) {
        res.statusCode = 200;
        var count = 10;
        var n     = 0;
        var rate  = 20; // rate / 1000 = times per second
        var timerId = setInterval(function() {
            res.write('Hello Friend');
            n += 1;
            if (n >= count) {
                res.write('Goodbye Friend');
                res.end();
                clearInterval(timerId);
            }
        }, rate);


        //requests(req, res);
    }).listen(3322);

    var options = {
        host : 'localhost',
        port : 3322,
        path : '/test',
        keepAlive : true
    }

    var req = http.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
        });
        res.on('end', function() {
            console.log('ending test');
            server.close();
            t.end();
        })
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.end();
})

test('can live stream db via http', function(t) {
    var db = level('test3.db', { encoding: 'json' }, function(err, db) {

        var server = http.createServer(function(req, res) {
            res.statusCode = 200;
            var count = 100;
            var n     = 0;
            var rate  = 2000; // rate / 1000 = times per second
            var timerId = setInterval(function() {
                db.put(n, 'kalinx');
                n += 1;
                if (n >= count) {
                    res.end();
                    clearInterval(timerId);
                }
            }, rate);

            var dbstream = require('level-live-stream')(db);

            dbstream.on('data', function(data) {
                res.write(JSON.stringify(data) + '\n');
            });

            dbstream.on('end', function() {
                res.end();
            })

            //requests(req, res);
        }).listen(3322);

        var options = {
            host : 'localhost',
            port : 3322,
            path : '/test',
            keepAlive : true
        }

        var req = http.request(options, function(res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('BODY: ' + chunk);
            });
            res.on('end', function() {
                console.log('ending test');
                server.close();
                t.end();
            })
        });

        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });

        req.end();

    });

})
