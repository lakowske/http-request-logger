/*
 * (C) 2015 Seth Lakowske
 */

var test      = require('tape');
var http      = require('http');
var level     = require('level');
var through   = require('through');

test('can pipe through http', function(t) {

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
            t.end();
        });

        requests(null, capture);
    });

})

/*
    var server = http.createServer(function(req, res) {
        requests(req, res);
    }).listen(3322);

    var req        = http.request('http://localhost:3322');
    req.end();

    req.on('connect', function(res, socket, head) {
        console.log('got connected');
        socket.write('GET / HTTP/1.1\r\n' +
                     'Host: localhost:3322\r\n' +
                     'Connection: close\r\n' +
                     '\r\n');
        socket.on('data', function(chunk) {
            console.log('hi');
            console.log(chunk.toString())
        })
        socket.on('end', function() {
            console.log('req socket closed');
        })
    })
*/

