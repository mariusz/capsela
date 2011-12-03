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
var Pipe = require('capsela-util').Pipe;
var fs = require('fs');
var mp = new MonkeyPatcher();

var FileResponse = require('capsela').FileResponse;

module.exports["basics"] = testCase({

    tearDown: function(cb) {
        mp.tearDown();
        cb();
    },

    "test init": function(test) {

        var pipe = new Pipe();
        
        var stats = {
            size: 527
        };

        mp.patch(fs, 'createReadStream', function(path) {
            test.equal(path, '/images/sunrise.jpg');
            return pipe;
        });

        var response = new FileResponse('/images/sunrise.jpg', stats);
        
        test.equal(response.getContentType(), 'image/jpeg');
        test.equal(response.getHeader('content-length'), 527);
        test.equal(response.stream, pipe);
        
        test.done();
    },

    "test init zero size": function(test) {

        var pipe = new Pipe();

        var stats = {
            size: 0
        };

        mp.patch(fs, 'createReadStream', function(path) {
            test.equal(path, '/images/sunset.gif');
            return pipe;
        });

        var response = new FileResponse('/images/sunset.gif', stats);

        test.equal(response.getContentType(), 'image/gif');
        test.equal(response.getHeader('content-length'), 0);
        test.equal(response.stream, pipe);

        test.done();
    }
});