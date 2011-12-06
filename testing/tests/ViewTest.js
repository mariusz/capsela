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

var template =
'<!--JSON\n\
 { "title": "Well, hello!" }\n\
 -->\n\
xyz';

module.exports["basics"] = testCase({

    tearDown: function(cb) {
        mp.tearDown();
        cb();
    },

    "test init": function(test) {

        test.expect(5);

        var params = {};
        var view = new View(template, params);

        mp.patch(jsontemplate, 'expand',
            function(t, p, options) {
                test.equal(t, 'xyz');
                test.equal(p, params);
                test.deepEqual(options, {undefined_str: ''});
                return 'result';
            });

        test.equal(view.getHtml(), 'result');
        test.equal(view.getTitle(), 'Well, hello!');
        test.done();
    },

    "test init w/o params": function(test) {

        var view = new View(template);

        // shouldn't render
        mp.patch(jsontemplate, 'expand',
            function(t, p, options) {
                test.ok(false);
            });

        test.equal(view.getHtml(), 'xyz');
        test.equal(view.getTitle(), 'Well, hello!');
        test.done();
    },

    "test init w/o title": function(test) {

        var template = 'xyz';
        var view = new View(template);

        test.equal(view.getHtml(), 'xyz');
        test.equal(view.getTitle(), null);
        test.done();
    },

    "test init w/bad title": function(test) {

        var template =
        '<!--JSON\n\
         title: "Well, hello!"\n\
         -->\n\
        xyz';

        test.throws(function() {
            var view = new View(template);
        });
        
        test.done();
    }
});