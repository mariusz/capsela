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
 * Date: 1/9/12
 */

"use strict";

var capsela = require('capsela');
var ViewRenderer = capsela.ViewRenderer;
var JsonTemplate = capsela.views.JsonTemplate;

var testbench = require('../TestBench');

module.exports["basics"] = {

    "test addViews": function(test) {
        
        var vr = new ViewRenderer();

        var views = [{}, {}, {}, {}];

        vr.addView('view1', views[0]);

        test.deepEqual(vr.views, {view1: views[0]});

        vr.addViews({
            'view2': views[3],
            'view3': views[2],
            'view4': views[1]
        });
        
        test.deepEqual(vr.views, {
            view1: views[0],
            view2: views[3],
            view3: views[2],
            view4: views[1]
        });

        test.done();
    },

    "load templates": function(test) {

        var vr = new ViewRenderer();

        vr.loadViews(testbench.fixturesDir + '/views', JsonTemplate).then(
            function() {

                test.ok(vr.getView('default') instanceof JsonTemplate);
                test.ok(vr.getView('user') instanceof JsonTemplate);
                test.done();
            }
        ).end();
    }
};

module.exports["rendering"] = {

    "test render w/view object": function(test) {

        test.expect(1);
        
        var vr = new ViewRenderer();

        var params = {};

        vr.render({
            render: function(model) {
                test.equal(model, params);
            }
        }, params);

        test.done();
    },

    "test render missing view throws": function(test) {

        var vr = new ViewRenderer();

        try {
            vr.render('my-view');
        }
        catch (err) {
            test.equal(err.message, 'view "my-view" not found');
            test.done();
        }
    },

    "test render with no params": function(test) {

        var r = new ViewRenderer();
        r.addView('myview', {
            render: function() {return 'howdy'}});

        test.equal(r.render('myview'), 'howdy');
        test.done();
    },

    "test render": function(test) {

        var vr = new ViewRenderer();
        var r = {};

        var mock = {
            render: function(model) {
                test.deepEqual(model, {name: 'Nina'});
                return 'hi';
            }
        };

        test.equal(vr.getView('my-view'), undefined);
        vr.addView('my-view', mock);
        test.equal(vr.getView('my-view'), mock);
        vr.setResolver({}); // otherwise it won't attempt to resolve
        vr.resolveReferences = function(str) {
                test.equal(str, 'hi');
                return 'xx';
            };

        test.equal(vr.render('my-view', {name: 'Nina'}), 'xx');

        test.done();
    },

//    "test render nested views": function(test) {
//
//        var r = new ViewRenderer({
//            base: new JsonTemplate('{y} {q}'),
//            sub1: new JsonTemplate('{z} {b}'),
//            sub2: new JsonTemplate('{a}'),
//            sub3: new JsonTemplate('{r}')
//        });
//
//        var v = new capsela.View('base', {
//            x: 42,
//            y: new capsela.View('sub1', {
//                z: new capsela.View('sub2', {
//                    a: 34
//                }),
//                b: 'hi'
//            }),
//            q: new capsela.View('sub3', {
//                r: 'there'
//            })
//        });
//
//        test.equal(r.render(v), '34 hi there');
//        test.done();
//    },

    "test render and resolve": function(test) {

        var r = new ViewRenderer();
        r.addView('myview', new JsonTemplate('ref:static_file:logo'));

        r.setResolver({
            resolve: function(nid, nss) {
                test.equal(nid, 'static_file');
                test.equal(nss, 'logo');
                return 'http://www.example.com/logo.png';
            }
        });

        test.equal(r.render('myview'), 'http://www.example.com/logo.png');
        test.done();
    }
};

module.exports["resolving"] = {

    "test resolve": function(test) {

        var r = new ViewRenderer();

        r.setResolver({
            resolve: function(nid, nss) {
                return 'hello, ' + nss;
            }
        });

        test.equal(r.resolveReferences(""), "");
        test.equal(r.resolveReferences("<span>ref:cap:27</span>"), "<span>hello, 27</span>");
        test.equal(r.resolveReferences("<span>ref:cap:27&ref:cap:52\\</span>"),
            "<span>hello, 27&hello, 52\\</span>");
        test.equal(r.resolveReferences("<span>ref:cap:model/28\"xref:cap:29\\</span>"),
            "<span>hello, model/28\"xhello, 29\\</span>");
        test.equal(r.resolveReferences("<span>ref:cap:href:47<ref:cap:29></span>"),
            "<span>hello, href:47<hello, 29></span>");
        test.equal(r.resolveReferences("<span>ref:cap:href:47[ref:cap:29]<ref:cap:29></span>"),
            "<span>hello, href:47[hello, 29]<hello, 29></span>");
        test.equal(r.resolveReferences("<span>ref:cap:href:47.ref:cap:29^</span>"),
            "<span>hello, href:47.ref:cap:29^</span>");
        test.equal(r.resolveReferences("<span>ref:cap:href:47`ref:cap:29~</span>"),
            "<span>hello, href:47`hello, 29~</span>");

        test.done();
    }
};