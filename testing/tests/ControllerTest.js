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
 * Date: 4/6/11
 */

"use strict";

var testbench = require(__dirname + '/../TestBench');
var testCase = require('nodeunit').testCase;

var Request = require('capsela').Request;
var Controller = require('capsela').Controller;

module.exports["basics"] = testCase({

    "test doOptions": function(test) {

        var c = new Controller();

        var response = c.doOptions(new Request('OPTIONS'));

        test.equal(response.statusCode, 405);
        test.equal(response.error.message, 'method not allowed');

        test.done();
    },

    "test doGet": function(test) {

        var c = new Controller();

        var response = c.doOptions(new Request());

        test.equal(response.statusCode, 405);
        test.equal(response.error.message, 'method not allowed');

        test.done();
    },

    "test doHead": function(test) {

        var c = new Controller();

        var response = c.doOptions(new Request('HEAD'));

        test.equal(response.statusCode, 405);
        test.equal(response.error.message, 'method not allowed');

        test.done();
    },

    "test doPost": function(test) {

        var c = new Controller();

        var response = c.doOptions(new Request('POST'));

        test.equal(response.statusCode, 405);
        test.equal(response.error.message, 'method not allowed');

        test.done();
    },

    "test doPut": function(test) {

        var c = new Controller();

        var response = c.doOptions(new Request('PUT'));

        test.equal(response.statusCode, 405);
        test.equal(response.error.message, 'method not allowed');

        test.done();
    },

    "test doDelete": function(test) {

        var c = new Controller();

        var response = c.doOptions(new Request('DELETE'));

        test.equal(response.statusCode, 405);
        test.equal(response.error.message, 'method not allowed');

        test.done();
    }
});