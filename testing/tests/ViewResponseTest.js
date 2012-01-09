/**
 * Copyright (C) 2011 Sitelier Inc.
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
 * Date: 11/8/11
 */

"use strict";

var testbench = require(__dirname + '/../TestBench');
var testCase = require('nodeunit').testCase;
var MonkeyPatcher = require('capsela-util').MonkeyPatcher;
var StreamUtil = require('capsela-util').StreamUtil;
var Pipe = require('capsela-util').Pipe;
var mp = new MonkeyPatcher();

var View = require('capsela').View;
var ViewResponse = require('capsela').ViewResponse;

module.exports["basics"] = testCase({

    tearDown: function(cb) {
        mp.tearDown();
        cb();
    },

    "test init/sendBody": function(test) {
        
        var view = new View('xyz');
        var response = new ViewResponse(view, 701);
        var pipe = new Pipe();

        test.equal(response.view, view);
        test.equal(response.getContentType(), 'text/html; charset=utf-8');
        test.equal(response.statusCode, 701);

        // test fluent interface
        test.equal(response.setRenderer({
            render: function(v) {
                test.equal(v, view);
                return 'result';
            }
        }), response);

        pipe.getData('utf8').then(
            function(data) {
                test.equal(data, 'result');
                test.done();
            }
        );

        response.sendBody(pipe);
    }
});