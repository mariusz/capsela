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
var jsontemplate = require('../../deps/json-template');
var StreamUtil = require('capsela-util').StreamUtil;
var Pipe = require('capsela-util').Pipe;
var capsela = require('capsela');
var View = capsela.View;
var mp = new MonkeyPatcher();

var capsela = require('capsela');

var template =
'<!--JSON\n\
 { "title": "Goodbye, cruel world!", "complete": true }\n\
 -->\n\
xyz';

module.exports["basics"] = testCase({

    tearDown: function(cb) {
        mp.tearDown();
        cb();
    },

    "test init w/o name throws": function(test) {

        test.throws(function() {
            var view = new View();
        })
        
        test.done();
    },

    "test init": function(test) {

        var params = {};
        var view = new View('my-view', params);

        test.equal(view.name, 'my-view');
        test.deepEqual(view.params, params);
        test.done();
    }
});