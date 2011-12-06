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
var jsontemplate = require('json-template');
var BufferUtils = require('capsela-util').BufferUtils;
var Pipe = require('capsela-util').Pipe;
var mp = new MonkeyPatcher();

var View = require('capsela').View;

module.exports["basics"] = testCase({

    tearDown: function(cb) {
        mp.tearDown();
        cb();
    },

    "test init": function(test) {

        test.expect(4);

        var template = 'xyz';
        var params = {};
        var view = new View(template, params);

        mp.patch(jsontemplate, 'expand',
            function(t, p, options) {
                test.equal(t, template);
                test.equal(p, params);
                test.deepEqual(options, {undefined_str: ''});
                return 'result';
            });

        test.equal(view.getHtml(), 'result');
        test.done();
    },

    "test init w/o params": function(test) {

        test.expect(4);

        var template = 'xyz';
        var view = new View(template);

        mp.patch(jsontemplate, 'expand',
            function(t, p, options) {
                test.equal(t, template);
                test.deepEqual(p, {});
                test.deepEqual(options, {undefined_str: ''});
                return 'result';
            });

        test.equal(view.getHtml(), 'result');
        test.done();
    }
});