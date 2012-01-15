/*!
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

var path = require('path');
var fs = require('fs');

var http = require('http');
var https = require('https');
var Pipe = require('capsela-util').Pipe;
var Class = require('capsela-util').Class;
var Server = require('capsela').Server;

var orig = {
    httpRequest: http.request,
    httpsRequest: https.request
};

var httpHosts = {};
var httpsHosts = {};

var MockHost = Class.extend({

    ////////////////////////////////////////////////////////////////////////////

    request: function(options, cb, secure) {

        var host;
        var mockRequest = new Pipe();
        var mockResponse = new Pipe();
        var requestComplete = false;
        var responseReady = false;
        var intervalId;
        
        var resetTimeout = function() {};
        var cancelTimeout = function() {};

        mockRequest.method = options.method;
        mockRequest.url = options.path;
        mockRequest.headers = options.headers || {};
        mockRequest.headers.host = options.host;
        mockRequest.httpVersion = '1.1';
        mockRequest.httpVersionMajor = 1; // node docs not clear if this should be string or int
        mockRequest.httpVersionMinor = 1;
        mockRequest.connection = {
            pskIdentity: options.pskIdentity
        };

        // find the specified host

        if (secure) {
            host = httpsHosts[options.host];
        }
        else {
            host = httpHosts[options.host];
        }

        if (!host) {
            process.nextTick(function() {
                mockRequest.emit('error', new Error("ENOTFOUND, Domain name not found"));
                console.log(options);
            });
            return mockRequest;
        }

        if (options.port && options.port != host.port) {
            process.nextTick(function() {
                mockRequest.emit('error', new Error("specified port not served"));
            });
            return mockRequest;
        }

        // pretend to have a socket

        intervalId = setInterval(function() {
            console.log('waiting for ' + options.method + ' ' + options.host + options.path);
        }, 1000);

        mockRequest.socket = {
            destroy: function() {
                console.log('destroying socket');
                clearInterval(intervalId);
            }
        };

        mockRequest.setTimeout = function(timeout, timeoutCb) {

            var timeoutId;

            cancelTimeout = function() {

                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };

            resetTimeout = function() {
                cancelTimeout();
                timeoutId = setTimeout(timeoutCb, timeout);
            };

            resetTimeout();
        };

        var checkComplete = function() {
            if (requestComplete && responseReady) {
                clearInterval(intervalId);
                cb(mockResponse);
            }
        };

        mockRequest.on('end', function() {
            requestComplete = true;
            checkComplete();
        });

        mockResponse.writeHead = function(statusCode, headers) {

            if (mockResponse.headersWritten) {
                throw new Error("can't write head; head already written");
            }

            resetTimeout();
            
            mockResponse.statusCode = statusCode;
            mockResponse.headers = {};
            mockResponse.headersWritten = true;

            // lowercase the header names as node does
            for (var name in headers) {

                var lcName = name.toLowerCase();

                if (lcName == 'set-cookie') {
                    mockResponse.headers[lcName] = [headers[name]];
                }
                else {
                    mockResponse.headers[lcName] = headers[name];
                }
            }

            responseReady = true;
            checkComplete();
        };

        mockResponse.on('data', function() {
            resetTimeout();
        });
        
        mockResponse.on('end', function() {
            cancelTimeout();
        });
        
        host.server.handleRequest(mockRequest, mockResponse);

        return mockRequest;
    }
},
{
    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param protocol
     * @param host
     * @param port
     * @param server
     */
    init: function(protocol, host, port, server) {
        
        this.protocol = protocol;
        this.host = host;
        this.port = port;
        this.server = server;

        if (protocol == 'http') {
            httpHosts[host] = this;
        }
        else if (protocol == 'https') {
            httpsHosts[host] = this;
        }
        else {
            throw new Error("unrecognized protocol: " + protocol);
        }
    }
});

exports.MockHost = MockHost;

// take over the http client functions

exports.setUp = function(protocol, host, port, server) {

    http.request = function(options, cb) {
        return MockHost.request(options, cb);
    };

    https.request = function(options, cb) {
        return MockHost.request(options, cb, true);
    }
};

exports.tearDown = function() {
    http.request = orig.httpRequest;
    https.request = orig.httpsRequest;
    httpHosts = {};
    httpsHosts = {};
};

var addServer = function(protocol, host, port, server) {
    return new MockHost(protocol, host, port, server);
};

exports.addServer = addServer;

exports.addStage = function(protocol, host, port, stage) {

    var server = new Server(port || 80);

    server.setNext(stage);

    return addServer(protocol, host, port, server);
};