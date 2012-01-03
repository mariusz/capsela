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

    "test init": function(test) {

        var params = {};
        var view = new capsela.View(template, params, 'xx');

        mp.patch(jsontemplate, 'expand',
            function(t, p, options) {
                test.equal(t, 'xyz');
                test.deepEqual(p, params);
                test.deepEqual(options, {undefined_str: ''});
                return 'result';
            });

        test.equal(view.render(), 'result');
        test.equal(view.urlFactory, 'xx');
        test.equal(view.getTemplate(), 'xyz');
        test.deepEqual(view.getParams(), params);
        test.equal(view.getEnv().title, 'Goodbye, cruel world!');
        test.equal(view.getEnv().complete, true);
        test.done();
    },

    "test init w/o params": function(test) {

        var view = new capsela.View(template);

        // shouldn't render
        mp.patch(jsontemplate, 'expand',
            function(t, p, options) {
                test.ok(false);
            });

        test.equal(view.render(), 'xyz');
        test.equal(view.getEnv().title, 'Goodbye, cruel world!');
        test.equal(view.getEnv().complete, true);
        test.done();
    },

    "test init w/o title": function(test) {

        var template = 'xyz';
        var view = new capsela.View(template);

        test.equal(view.render(), 'xyz');
        test.equal(view.getTemplate(), 'xyz');
        test.deepEqual(view.getEnv(), {});
        test.done();
    },

    "test init w/bad title": function(test) {

        var template =
        '<!--JSON\n\
         title: "Well, hello!"\n\
         -->\n\
        xyz';

        test.throws(function() {
            var view = new capsela.View(template);
        });
        
        test.done();
    },

    "test render with links": function(test) {

        var template = 'link1: {link1}, link2: {link2}';
        var params = {
            link1: new capsela.Link('signup', 'default', {}),
            link2: new capsela.Link('message', 'view', {key: 72, who: 'you'}, true)
        };

        var dispatcher = new capsela.stages.Dispatcher('root');

        dispatcher.addController({}, 'signup');
        dispatcher.addController({}, 'message');

        var view = new capsela.View(template, params, dispatcher);

        test.equal(view.render(),
            'link1: root/signup/, link2: root/message/view/key/72/who/you');
        test.done();
    },

    "test render resolves references": function(test) {

        var r = new capsela.Reference();

        var v = new capsela.View('<img src="{imageSource}" />', {
            x: 42,
            imageSource: r
        });

        var resolver = new capsela.Resolver();

        resolver.resolve = function(ref) {
            test.equal(ref, r);
            return 'background.png';
        }

        test.deepEqual(v.render(resolver), '<img src="background.png" />');

        test.done();
    },

    "test render nested views": function(test) {

        var v = new capsela.View('{y} {q}', {
            x: 42,
            y: new capsela.View('{z} {b}', {
                z: new capsela.View('{a}', {
                    a: 34
                }),
                b: 'hi'
            }),
            q: new capsela.View('{r}', {
                r: 'there'
            })
        });

        test.deepEqual(v.render(), '34 hi there');

        test.done();
    }
});