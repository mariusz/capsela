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
var Pipe = require('capsela-util').Pipe;

var StreamResponse = require('capsela').StreamResponse;

module.exports["basics"] = testCase({

    "test init": function(test) {

        var source = new Pipe();
        var bodyBuffer = new Pipe();

        var response = new StreamResponse(source, 'image/jpeg', 4732);

        // write stuff to the source that will be missed if it's not paused
        source.write(new Buffer('hello dolly! '));

        test.equal(response.getContentType(), 'image/jpeg');
        test.equal(response.getHeader('content-length'), 4732);

        bodyBuffer.getData().then(
            function(data) {
                test.equal(data.toString(), 'hello dolly! goodbye dolly.');
                test.done();
            }
        );

        response.writeBody(bodyBuffer);
        source.end(new Buffer('goodbye dolly.'));
    },
    
    "test zero size": function(test) {

        var source = new Pipe();
        var response = new StreamResponse(source, 'text/plain', 0);

        test.equal(response.getContentType(), 'text/plain');
        test.equal(response.getHeader('content-length'), 0);
        test.done();
    }
});