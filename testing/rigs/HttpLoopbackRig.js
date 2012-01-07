/**
 * Copyright (c) 2011 Sitelier Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Author: Seth Purcell
 * Date: August 17, 2011
 */

"use strict";

var http = require('http');
var https = require('https');
var os = require('os');

var fifoDir = '/tmp/';

// work around imagick bug
if (os.type().indexOf('NT') < 0) {
    fifoDir = '\\\\.\\pipe\\';
}

var orig = {
    httpRequest: http.request,
    httpsRequest: https.request,
    httpCreateServer: http.createServer,
    httpsCreateServer: https.createServer
};

var host;

console.log()

exports.setUp = function(hostname) {
    
    host = hostname;

    // take over the http server functions

    http.createServer = function(requestListener) {

        var server = orig.httpCreateServer(requestListener);

        server.origListen = server.listen;

        server.listen = function(port, hostname, cb) {

            var fifoPath = fifoDir + host + '_' + port;

            return server.origListen(fifoPath, cb);
        };

        return server;
    };

    https.createServer = function(options, requestListener) {

        var server = orig.httpsCreateServer(options, requestListener);

        server.origListen = server.listen;

        server.listen = function(port, hostname, cb) {

            var fifoPath = fifoDir + host + '_' + port;

            return server.origListen(fifoPath, cb);
        };

        return server;
    };

    // take over the http client functions

    http.request = function(options, cb) {

        var hostname = options.hostname || options.host;
        var port = options.port || 80;
        
        options.socketPath = fifoDir + hostname + '_' + port;

        return orig.httpRequest(options, cb);
    };

    https.request = function(options, cb) {

        var hostname = options.hostname || options.host;
        var port = options.port || 443;

        options.socketPath = fifoDir + hostname + '_' + port;

        return orig.httpsRequest(options, cb);
    }
};

exports.tearDown = function() {
    http.request = orig.httpRequest;
    https.request = orig.httpsRequest;
    http.createServer = orig.httpCreateServer;
    https.createServer = orig.httpsCreateServer;
};