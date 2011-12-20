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
 * Date: Mar 2, 2011
 */

"use strict";

var testbench = require('../TestBench');
var testCase = require('nodeunit').testCase;
var StreamUtil = require('capsela-util').StreamUtil;

var fs = require('fs');

var Response = require('capsela').Response;
var Pipe = require('capsela-util').Pipe;

module.exports["headers"] = testCase({

    "test init with body": function(test) {

        var r = new Response(200, null, new Buffer('वाराणसी', 'ascii'));

        test.equal(r.getHeader('content-type'), null);
        test.equal(r.getHeader('content-length'), 7);

        var pipe = new Pipe();

        pipe.getData().then(
            function(data) {
                test.equal(typeof data, 'object');
                test.ok(data.toString() != 'वाराणसी');
                test.done();
            }
        );

        r.sendBody(pipe);
    },

    "test init with string body": function(test) {

        var r = new Response(200, null, 'वाराणसी');

        test.equal(r.getHeader('content-type'), 'text/plain; charset=utf-8');
        test.equal(r.getHeader('content-length'), 7);

        var pipe = new Pipe();

        pipe.getData().then(
            function(data) {
                test.equal(typeof data, 'object');
                test.equal(data.toString(), 'वाराणसी');
                test.done();
            }
        );

        r.sendBody(pipe);
    },

    "test init with body and type": function(test) {

        var r = new Response(200, null, 'hello there', 'text/html');

        test.equal(r.getHeader('content-type'), 'text/html; charset=utf-8');
        test.equal(r.getHeader('content-length'), 11);

        var pipe = new Pipe();

        pipe.getData().then(
            function(data) {

                test.equal(data, 'hello there');
                test.done();
            }
        );

        r.sendBody(pipe);
    },

    "test init with body, type and encoding": function(test) {

        var r = new Response(200, null, 'hello there', 'text/html', 'ascii');

        test.equal(r.getHeader('content-type'), 'text/html; charset=us-ascii');
        test.equal(r.getHeader('content-length'), 11);

        var pipe = new Pipe();

        pipe.getData().then(
            function(data) {

                test.equal(data, 'hello there');
                test.done();
            }
        );

        r.sendBody(pipe);
    },

    "test init with headers": function(test) {

        var r = new Response(200, {
            "Content-Type": 'text/plain',
            "Content-Length": 42
        });

        test.equal(r.getHeader('content-type'), 'text/plain');
        test.equal(r.getHeader('content-length'), 42);

        test.done();
    },

    "test force download": function(test) {

        var r = new Response();

        test.equal(r.getHeader('content-disposition'), undefined);

        r.forceDownload('i wanna be like you.mp3');
        test.equal(r.getHeader('content-disposition'), 'attachment; filename="i wanna be like you.mp3"');

        test.done();
    },

    "test set/get content type": function(test) {

        var r = new Response();

        test.equal(r.getContentType(), null);

        r.setContentType('text/javascript');
        test.equal(r.getHeader('content-type'), 'text/javascript');
        test.equal(r.getContentType(), 'text/javascript');

        // should kill the content type
        r.setContentType();
        test.equal(r.getHeader('content-type'), null);
        test.equal(r.getContentType(), null);

        test.done();
    },

    "test set content type w/param": function(test) {

        var r = new Response();

        r.setContentType('text/plain', 'ascii');
        test.equal(r.getHeader('content-type'), 'text/plain; charset=us-ascii');

        test.done();
    },

    "test set/get/remove header": function(test) {

        var r = new Response();

        test.throws(function() {
            r.setHeader();
        });

        test.throws(function() {
            r.setHeader('Location');
        });

        test.equal(r.getHeader('location'), null);
        test.deepEqual(r.getHeaders(), {});

        // remove nonexistent header
        r.removeHeader('location');

        r.setHeader('Location', 'http://www.sitelier.com');
        test.equal(r.getHeader('location'), 'http://www.sitelier.com');
        test.equal(r.getHeader('Location'), 'http://www.sitelier.com');
        test.equal(r.getHeader('LOCAtion'), 'http://www.sitelier.com');
        test.deepEqual(r.getHeaders(), {'Location': 'http://www.sitelier.com'});

        r.removeHeader('location');

        test.equal(r.getHeader('location'), null);
        test.equal(r.getHeader('Location'), null);
        test.equal(r.getHeader('LOCAtion'), null);
        test.deepEqual(r.getHeaders(), {});

        r.setHeader('location', 'http://www.sitelier.com');
        test.deepEqual(r.getHeaders(), {'location': 'http://www.sitelier.com'});
        r.removeHeader('LOCATION');

        test.equal(r.getHeader('location'), null);
        test.equal(r.getHeader('Location'), null);
        test.equal(r.getHeader('LOCAtion'), null);
        test.deepEqual(r.getHeaders(), {});

        // make sure setHeader doesn't mistake a false-coercible value for
        // the absence of a value
        r.setHeader('Content-Length', 0);
        test.equal(r.getHeader('content-length'), 0);
        test.deepEqual(r.getHeaders(), {'Content-Length': 0});
        r.setHeader('Location', 'http://www.sitelier.com');
        test.deepEqual(r.getHeaders(), {
            'Content-Length': 0,
            'Location': 'http://www.sitelier.com'
        });

        test.done();
    }
});

module.exports["caching"] = testCase({

    "test enableCaching w/o expires": function(test) {

        var r = new Response();

        test.equal(r.getHeader('last-modified'), null);
        test.equal(r.getHeader('expires'), null);

        var mtime = new Date(75000);
        var expires = new Date(Date.now() + 365 * 86400 * 1000);

        r.enableCaching(mtime);

        test.equal(r.getLastModified(), mtime);
        test.equal(r.getHeader('last-modified'), mtime.toUTCString());
        test.equal(r.getHeader('expires'), expires.toUTCString());
        
        test.done();
    },

    "test enableCaching w/expires": function(test) {

        var r = new Response();

        test.equal(r.getHeader('last-modified'), null);
        test.equal(r.getHeader('expires'), null);

        var mtime = new Date(75000);
        var expires = new Date(Date.now() + 365 * 86400 * 1000);

        r.enableCaching(mtime, expires);

        test.equal(r.getHeader('last-modified'), mtime.toUTCString());
        test.equal(r.getHeader('expires'), expires.toUTCString());

        test.done();
    }
});