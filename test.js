/*
 * (C) 2015 Seth Lakowske
 */

var test      = require('tape');
var http      = require('http');
var level     = require('level');
var through   = require('through');
var fs        = require('fs');
var rimraf    = require('rimraf');
var path      = require('path');

test('can pipe to capture', function(t) {

    //open the request logs db
    var db = level('test.db', { encoding: 'json' });

    db.put('apple', 'pie', function(err) {
        var requestLogger = require('./')(db);
        var requests      = requestLogger.requests();
        var result = '';

        var capture = through(function(data) {
            result += data;
            this.queue(data);
            t.equal(result, '{"key":"apple","value":"pie"}\n', 'should be a single entry');

            db.close()
            rimraf(path.join(__dirname, 'test.db'), function(er) {
                if (er) throw er;
            })

            t.end();
        })

        capture.on('end', function() {
            console.log(result);
            console.dir(db);
        });

        requests(null, capture);
    });

})

test('can keep http pipe open', function(t) {
    var db = level('test2.db', { encoding: 'json' });
    var requestLogger = require('./')(db);
    var requests      = requestLogger.requests();

    var server = http.createServer(function(req, res) {

        res.statusCode = 200;
        var count = 4;
        var n     = 0;
        var rate  = 50; // rate / 1000 = times per second
        var timerId = setInterval(function() {
            res.write('Hello Friend\n');
            n += 1;
            if (n >= count) {
                res.write('Goodbye Friend\n');
                res.end();
                clearInterval(timerId);
            }
        }, rate);

    }).listen(3322);

    var options = {
        host : 'localhost',
        port : 3322,
        path : '/test',
        keepAlive : true
    }

    var output = [
        'Hello Friend',
        'Hello Friend',
        'Hello Friend',
        'Hello Friend',
        'Goodbye Friend'
    ].join('\n') + '\n';

    var result = '';
    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            result += chunk;
        });
        res.on('end', function() {
            console.log(result);
            t.equal(result, output, '4 hello and 1 goodbye');
            server.close();
            db.close();

            rimraf(path.join(__dirname, 'test2.db'), function(er) {
                if (er) throw er;
            })

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
            var count = 5;
            var n     = 0;
            var rate  = 50; // rate / 1000 = times per second
            var timerId = setInterval(function() {
                if (n >= count) {
                    res.end();
                    clearInterval(timerId);
                } else {
                    db.put(n, 'kalinx');
                }

                n += 1;
            }, rate);

            var dbstream = require('level-live-stream')(db);

            dbstream.on('data', function(data) {
                res.write(JSON.stringify(data) + '\n');
            });

            dbstream.on('end', function() {
                res.end();
            })

        }).listen(3322);

        var options = {
            host : 'localhost',
            port : 3322,
            path : '/test',
            keepAlive : true
        }

        var result = ''
        var req = http.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                result += chunk;
            });
            res.on('end', function() {
                console.log(result);
                server.close();

                var output = [
                    '{"type":"put","key":0,"value":"kalinx"}',
                    '{"type":"put","key":1,"value":"kalinx"}',
                    '{"type":"put","key":2,"value":"kalinx"}',
                    '{"type":"put","key":3,"value":"kalinx"}',
                    '{"type":"put","key":4,"value":"kalinx"}'
                ].join('\n') + '\n';

                t.equal(result, output, 'should have 5 entries');

                db.close();
                rimraf(path.join(__dirname, 'test3.db'), function(er) {
                    if (er) throw er;
                })

                t.end();
            })
        });

        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });

        req.end();

    });

})
