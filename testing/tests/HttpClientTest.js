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
 * Date: 8/8/11
 */

"use strict";

var TestBench = require('../TestBench');

var Request = require('capsela').Request;

var HttpClient = require('capsela').HttpClient;
var Response = require('capsela').Response;

var http = require('http');
var https = require('https');

var Pipe = require('capsela-util').Pipe;
var Q = require('qq');

var orig = {
    httpRequest: http.request,
    httpsRequest: https.request,
    create: HttpClient.createFromUrl,
    get: HttpClient.get
};

module.exports["basics"] = {

    tearDown: function(cb) {
        http.request = orig.httpRequest;
        https.request = orig.httpsRequest;
        HttpClient.createFromUrl = orig.create;
        HttpClient.get = orig.get;
        cb();
    },

    "test dispatch error": function(test) {
        test.expect(3);

        var c = HttpClient.createFromUrl('http://www.example.com');

        var request = new Request();
        var errorCb;
        var error = new Error('generic request error');

        var mockRequest = {
            on: function(event, cb) {
                errorCb = cb;
                test.equal(event, 'error');
            }

//            setTimeout: function(timeout, cb) {
//                test.equal(timeout, 5000);
//            }
        };

        var mockResponse = {
            statusCode: 411
        };

        http.request = function(options, cb) {

            test.deepEqual(options, {
                host: 'www.example.com',
                path: '/',
                method: 'get',
                headers: {}
            });

            process.nextTick(function() {
                errorCb(error);
            });

            return mockRequest;
        };

        c.dispatch(request).then(
            null,
            function(err) {
                test.equal(err, error);
                test.done();
            });
    },

//    "test dispatch timeout": function(test) {
//
//        test.expect(6);
//
//        var c = HttpClient.createFromUrl('http://www.example.com');
//
//        var request = new Request();
//        var timeoutCb;
//
//        var mockRequest = {
//            on: function(event, cb) {
//                test.equal(event, 'error');
//            },
//
//            setTimeout: function(timeout, cb) {
//                timeoutCb = cb;
//                test.equal(timeout, 5000);
//            },
//
//            socket: {
//                destroy: function() {
//                    test.ok(true);
//                }
//            }
//        };
//
//        var mockResponse = {
//            statusCode: 411
//        };
//
//        http.request = function(options, cb) {
//
//            test.deepEqual(options, {
//                host: 'www.example.com',
//                path: '/',
//                method: 'get',
//                headers: {}
//            });
//
//            process.nextTick(function() {
//                timeoutCb();
//            });
//
//            return mockRequest;
//        };
//
//        c.dispatch(request, function(err) {
//            test.equal(err.message, 'connection timed out');
//            test.done();
//        });
//    },
    
    "test GET no slash": function(test) {

        test.expect(4);

        var c = HttpClient.createFromUrl('http://www.example.com');

        var request = new Request();

        var mockRequest = {
            on: function(event, cb) {
                test.equal(event, 'error');
            },

            setTimeout: function(timeout, cb) {
//                test.equal(timeout, 5000);
            }
        };

        var mockResponse = {
            statusCode: 411,

            pause: function() {
                test.ok(true);
            }
        };

        http.request = function(options, cb) {

            test.deepEqual(options, {
                host: 'www.example.com',
                path: '/',
                method: 'get',
                headers: {}
            });

            process.nextTick(function() {
                cb(mockResponse);
            });

            return mockRequest;
        };

        https.request = function(options, cb) {
            test.ok(false);
            cb();
        };

        c.dispatch(request).then(
            function(response) {
    //            test.equal(request.getHeader('Host'), 'www.example.com');
                test.equal(response.statusCode, 411);
                test.done();
            });
    },

    "test GET non-secure": function(test) {

        test.expect(4);

        var c = HttpClient.createFromUrl('http://www.example.com:8000/identity?format=json');

        var request = new Request('GET', '/identity');

        var mockRequest = {
            on: function(event, cb) {
                test.equal(event, 'error');
            },

            setTimeout: function(timeout, cb) {
                test.equal(timeout, 5000);
            }
        };

        var mockResponse = {
            statusCode: 411,

            pause: function() {
                test.ok(true);
            }
        };

        http.request = function(options, cb) {
            
            test.deepEqual(options, {
                host: 'www.example.com',
                port: 8000,
                path: '/identity',
                method: 'get',
                headers: {}
            });

            process.nextTick(function() {
                cb(mockResponse);
            });

            return mockRequest;
        };

        https.request = function(options, cb) {
            test.ok(false);
            cb();
        };
        
        c.dispatch(request).then(
            function(response) {
    //            test.equal(request.getHeader('Host'), 'www.example.com');
                test.equal(response.statusCode, 411);
                test.done();
            });
    },

    "test GET secure": function(test) {

        var c = HttpClient.createFromUrl('https://www.example.com:8000/identity?format=json');

        var request = new Request('GET', '/identity', null, null, null, 'pre-shared-key-id', 'pre-shared-key');

        var mockRequest = {
            on: function(event, cb) {
                test.equal(event, 'error');
            },

            setTimeout: function(timeout, cb) {
                test.equal(timeout, 5000);
            }
        };

        var mockResponse = {
            statusCode: 411,

            pause: function() {
                test.ok(true);
            }
        };

        https.request = function(options, cb) {

            test.deepEqual(options, {
                host: 'www.example.com',
                port: 8000,
                path: '/identity',
                method: 'get',
                headers: {},
                pskIdentity: 'pre-shared-key-id',
                pskKey: 'pre-shared-key'
            });

            process.nextTick(function() {
                cb(mockResponse);
            });

            return mockRequest;
        };

        http.request = function(options, cb) {
            test.ok(false);
            cb();
        };

        c.dispatch(request).then(
            function(response) {
    //            test.equal(request.getHeader('Host'), 'www.example.com');
                test.equal(response.statusCode, 411);
                test.done();
            });
    },

    "test get error": function(test) {

        HttpClient.createFromUrl = function(url) {
            return {
                dispatch: function(request) {
                    request.bodyStream = {
                        end: function() {}
                    };
                    return Q.reject(new Error("error downloading resource"));
                }
            }
        };

        HttpClient.get('http://www.example.com/identity?format=json')
            .then(null, function(err) {
                test.equal(err.message, "error downloading resource");
                test.done();
            });
    },

    "test get success": function(test) {

        var mockResponse = {};

        HttpClient.createFromUrl = function(url) {
            return {
                dispatch: function(request, cb) {
                    request.bodyStream = {
                        end: function() {}
                    };
                    return Q.ref(mockResponse);
                }
            }
        };

        HttpClient.get('https://www.example.com:8000/identity?format=json')
            .then(function(response) {
                test.equal(response, mockResponse);
                test.done();
            });
    }
};