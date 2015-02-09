/*
 * (C) 2015 Seth Lakowske
 */

var test = require('tape');
var http = require('http');
var JSONStream = require('JSONStream');
var through    = require('through');

function requestToBayes(request) {
    var bayes = {};

    return bayes;
}

function getRequests(url) {
    var toString  = through(function(data) {this.queue(data.toString())});

    var stringify = JSONStream.stringify(false);
    var options = {
        host : 'sethlakowske.com',
        port : 80,
        path : '/requests'
    }

    var req = http.request(options, function(res) {
        res.pipe(toString).pipe(stringify)
        var count = 0;
        stringify.on('data', function(requestData) {
            var request = JSON.parse(requestData);
            var r       = JSON.parse(request);
            //console.log(request);
            console.log(typeof r);
        })

        stringify.on('end', function() {
            console.log('all done');
        })

    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.end();
}

getRequests('http://sethlakowske/requests');
