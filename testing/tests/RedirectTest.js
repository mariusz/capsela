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

var Redirect = require('capsela').Redirect;

module.exports["basics"] = testCase({

    "test init 301": function(test) {

        test.throws(function() {
            new Redirect();
        });

        var r = new Redirect('http://www.sitelier.com');

        test.equal(r.getHeader('Location'), 'http://www.sitelier.com');
        test.equal(r.statusCode, 301);
        test.done();
    },

    "test init 302": function(test) {

        var r = new Redirect('https://www.sitelier.net', 302);

        test.equal(r.getHeader('Location'), 'https://www.sitelier.net');
        test.equal(r.statusCode, 302);
        test.done();
    },

    "test init invalid URL": function(test) {

        var err;
        
        try {
            new Redirect('/somewhere', 302);
        } catch (e) {
            err = e;
        }
        test.equal(err.message, 'the redirect location must be an absolute URL, including scheme');

        test.done();
    }
});