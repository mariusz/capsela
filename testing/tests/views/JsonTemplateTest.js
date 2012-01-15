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
 * Date: 11/8/11
 */

"use strict";

var testbench = require(__dirname + '/../../TestBench');

var capsela = require('capsela');
var JsonTemplate = capsela.views.JsonTemplate;
var mp = require('capsela-util').MonkeyPatcher;

var jsontemplate = require('../../../deps/json-template');

var template =
'<!--ENV\n\
 { "title": "Goodbye, cruel world!", "complete": true }\n\
 -->\n\
xyz';

module.exports["basics"] = {

    setUp: mp.setUp,
    tearDown: mp.tearDown,

    "test init": function(test) {

        var t = new JsonTemplate(template);

        test.deepEqual(t.getEnv(), {title: "Goodbye, cruel world!", complete: true});
        test.deepEqual(t.template, 'xyz');
        test.done();
    },

    "test isComplete": function(test) {

        var t = new JsonTemplate('xyz');
        test.equal(t.isComplete(), false);

        var t = new JsonTemplate('hithere! <!DOCTYPE html>');
        test.equal(t.isComplete(), false);

        var t = new JsonTemplate('hithere! <!doctype html>');
        test.equal(t.isComplete(), false);

        t = new JsonTemplate('<html></html>');
        test.equal(t.isComplete(), true);
        
        t = new JsonTemplate('<!DOCTYPE html>');
        test.equal(t.isComplete(), true);

        test.done();
    },
    
    "test set/get parent": function(test) {

        var view = new JsonTemplate(template);

        test.equal(view.getParent(), undefined);
        test.equal(view.setParent('sal'), view); // test fluency
        test.equal(view.getParent(), 'sal');

        test.done();
    },

    "test init w/o env": function(test) {

        var t = new JsonTemplate('xyz');

        test.equal(t.template, 'xyz');
        test.deepEqual(t.getEnv(), {});
        test.done();
    },

    "test init w/bad env": function(test) {

        var template =
        '<!--ENV\n\
         title: "Well, hello!"\n\
         -->\n\
        xyz';

        test.throws(function() {
            var t = JsonTemplate(template);
        });

        test.done();
    },

    "test render": function(test) {

        test.expect(3);

        var t = new JsonTemplate('hi there');

        mp.patch(jsontemplate, 'expand', function(source, params, options) {
            test.equal(source, 'hi there');
            test.deepEqual(params, {name: 'Wallace, David Foster'});
            test.deepEqual(options, {undefined_str: ''});
        });

        t.render({name: 'Wallace, David Foster'});

        test.done();
    },

    "test render w/o params": function(test) {

        test.expect(3);

        var t = new JsonTemplate('hi there');

        mp.patch(jsontemplate, 'expand', function(source, params, options) {
            test.equal(source, 'hi there');
            test.deepEqual(params, {});
            test.deepEqual(options, {undefined_str: ''});
        });

        t.render();

        test.done();
    },

    "test render w/env vars": function(test) {

        test.expect(3);

        var t = new JsonTemplate(template);
        var p = {
            title: 'A Close Shave',
            name: 'Wallace',
            dog: 'Gromit',
            sheep: 'Shaun'
        };

        mp.patch(jsontemplate, 'expand', function(source, params, options) {
            test.equal(source, 'xyz');
            test.deepEqual(params, {
                title: "A Close Shave",
                name: 'Wallace',
                dog: 'Gromit',
                sheep: 'Shaun',
                complete: true
            });
            test.deepEqual(options, {undefined_str: ''});
        });

        t.render(p);

        test.done();
    }
};