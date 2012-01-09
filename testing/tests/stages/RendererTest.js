/**
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
 * Date: Feb 28, 2011
 */

"use strict";

var testbench = require('../../TestBench');
var testCase = require('nodeunit').testCase;

var fs = require('fs');

var capsela = require('capsela');
var Response = capsela.Response;
var Request = capsela.Request;
var Stage = capsela.Stage;
var Renderer = capsela.stages.Renderer;
var View = capsela.View;
var ViewResponse = capsela.ViewResponse;
var Q = require('qq');
var JsonTemplate = capsela.templates.JsonTemplate;

module.exports["resolving"] = testCase({

    "test resolve": function(test) {

        var r = new Renderer();

        r.setResolverPool({
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
});

module.exports["basics"] = testCase({

    "test passthrough": function(test) {

        var request = new Request();
        var handler = new Renderer();
        var response = new Response();

        handler.setNext(new Stage(
            function(request) {
                return response;
            }));

        Q.when(handler.service(request),
            function(res) {
                test.equal(res, response);
                test.done();
            });
    },

    "test intercept view w/o template": function(test) {

        var request = new Request();
        var r = new Renderer();

        r.setNext(new Stage(
            function() {
                return new View('my-view');
            }));

        Q.when(r.service(request),
            null,
            function(err) {
                test.equal(err.message, "no template found for view \"my-view\"");
                test.done();
            });
    },

    "test intercept view": function(test) {

        var request = new Request();
        var r = new Renderer({
            "my-view": "hello world!"
        });
        var view = new View('my-view');

        r.setNext(new Stage(
            function() {
                return view;
            }));

        Q.when(r.service(request),
            function(response) {
                test.equal(response.statusCode, 200);
                test.ok(response instanceof ViewResponse);
                test.equal(response.view, view);
                test.equal(response.renderer, r);
                test.done();
            }).end();
    },

    "test intercept viewResponse": function(test) {

        var request = new Request();
        var r = new Renderer();
        var vr = new ViewResponse();

        r.setNext(new Stage(
            function() {
                return vr;
            }));

        Q.when(r.service(request),
            function(response) {
                test.equal(response.statusCode, 200);
                test.equal(response, vr);
                test.equal(response.renderer, r);
                test.done();
            }).end();
    }
});

module.exports["rendering"] = testCase({
    
//    "test render with links": function(test) {
//
//        var template = 'link1: {link1}, link2: {link2}';
//        var params = {
//            link1: new capsela.Link('signup', 'default', {}),
//            link2: new capsela.Link('message', 'view', {key: 72, who: 'you'}, true)
//        };
//
//        var dispatcher = new capsela.stages.Dispatcher('root');
//
//        dispatcher.addController({}, 'signup');
//        dispatcher.addController({}, 'message');
//
//        var view = new capsela.View(template, params, dispatcher);
//
//        test.equal(view.render(),
//            'link1: root/signup/, link2: root/message/view/key/72/who/you');
//        test.done();
//    },

//    "test render resolves references": function(test) {
//
//        var r = new capsela.Reference();
//
//        var v = new capsela.View('<img src="{imageSource}" />', {
//            x: 42,
//            imageSource: r
//        });
//
//        var resolver = new capsela.Resolver();
//
//        resolver.resolve = function(ref) {
//            test.equal(ref, r);
//            return 'background.png';
//        }
//
//        test.deepEqual(v.render(resolver), '<img src="background.png" />');
//
//        test.done();
//    },

    "test render with no params": function(test) {

        var r = new Renderer({
            myview: new JsonTemplate('howdy')
        });

        test.equal(r.render(new View('myview')), 'howdy');
        test.done();
    },

    "test render and resolve": function(test) {

        var r = new Renderer({
            myview: new JsonTemplate('ref:static_file:logo')
        });

        r.setResolverPool({
            resolve: function(nid, nss) {
                test.equal(nid, 'static_file');
                test.equal(nss, 'logo');
                return 'http://www.example.com/logo.png';
            }
        });

        test.equal(r.render(new View('myview')), 'http://www.example.com/logo.png');
        test.done();
    },

    "test render nested views": function(test) {

        var r = new Renderer({
            base: new JsonTemplate('{y} {q}'),
            sub1: new JsonTemplate('{z} {b}'),
            sub2: new JsonTemplate('{a}'),
            sub3: new JsonTemplate('{r}')
        });
        
        var v = new View('base', {
            x: 42,
            y: new View('sub1', {
                z: new View('sub2', {
                    a: 34
                }),
                b: 'hi'
            }),
            q: new View('sub3', {
                r: 'there'
            })
        });

        test.equal(r.render(v), '34 hi there');
        test.done();
    },

    "test render with layout no params": function(test) {

        var r = new Renderer({
            myview: new JsonTemplate('howdy')
        }, new JsonTemplate('<doctype html>{view}'));

        test.equal(r.render(new View('myview')), '<doctype html>howdy');
        test.done();
    },

    "test render nested views with layout": function(test) {

        var r = new Renderer({
            base: new JsonTemplate('{y} {q}'),
            sub1: new JsonTemplate('{z} {b}'),
            sub2: new JsonTemplate('{a}'),
            sub3: new JsonTemplate('{r}')
        }, new JsonTemplate('<doctype html>{view}'));

        var v = new View('base', {
            x: 42,
            y: new View('sub1', {
                z: new View('sub2', {
                    a: 34
                }),
                b: 'hi'
            }),
            q: new View('sub3', {
                r: 'there'
            })
        });

        test.equal(r.render(v), '<doctype html>34 hi there');
        test.done();
    },

    "test render missing view falls back to error": function(test) {

        var r = new Renderer({
            error: new JsonTemplate('oops! {error.message}')
        }, new JsonTemplate('<doctype html>{view}'));

        var v = new View('base');

        test.equal(r.render(v), '<doctype html>oops! no template found for view "base"');
        test.done();
    },

//    "test render missing view without error view": function(test) {
//
//        var r = new Renderer({
//        }, '<doctype html>{view}');
//
//        var v = new View('base');
//
//        test.deepEqual(r.render(v), '<doctype html>oops! no template found for view "base"');
//        test.done();
//    }
});