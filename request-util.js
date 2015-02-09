/*
 * (C) 2015 Seth Lakowske
 */

var test = require('tape');
var http = require('http');
var JSONStream = require('JSONStream');
var through    = require('through');
var fs         = require('fs');

function requestToBayes(request) {
    var bayes = {};

    return bayes;
}

function getRequests(url) {
    var toString  = through(function(data) {this.queue(data.toString())});

    var parseify = JSONStream.parse();

    var options = {
        host : 'localhost',
        port : 5555,
        path : '/requests'
    }
    var output = fs.createWriteStream('output.json')
    var req = http.request(options, function(res) {
        res.pipe(parseify);
        res.pipe(output);
         parseify.on('data', function(dbrequest) {
            var request = JSON.parse(dbrequest.value);
            console.log(request['user-agent']);
        })
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.end();
}

getRequests('http://sethlakowske/requests');
