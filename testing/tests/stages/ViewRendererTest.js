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
var ViewRenderer = capsela.stages.ViewRenderer;
var View = capsela.View;
var ViewResponse = capsela.ViewResponse;
var JsonTemplate = capsela.views.JsonTemplate;
var Q = require('qq');

module.exports["basics"] = testCase({

    "test init/isReady": function(test) {

        var r = new ViewRenderer();

        r.isReady().then(
            function() {
                test.done();
            }
        );
    },

    "test setResolverPool": function(test) {

        test.expect(2);
        
        var r = new ViewRenderer();

        var resolver = {};
        r.vr = {
            setResolver: function(rx) {
                test.equal(rx, resolver);
            }
        }
        r.setResolverPool(resolver);

        test.equal(r.resolverPool, resolver);
        
        test.done();
    },

    "test passthrough": function(test) {

        var request = new Request();
        var handler = new ViewRenderer();
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

//    "test intercept view w/o template": function(test) {
//
//        var request = new Request();
//        var r = new Renderer();
//
//        r.setNext(new Stage(
//            function() {
//                return new View('my-view');
//            }));
//
//        Q.when(r.service(request),
//            null,
//            function(err) {
//                test.equal(err.message, "no template found for view \"my-view\"");
//                test.done();
//            });
//    },

    "test passes viewResponse w/view": function(test) {

        var request = new Request();
        var r = new ViewRenderer();
        
        var view = new View('my-view');

        r.setNext(new Stage(
            function() {
                return new ViewResponse(view);
            }));

        Q.when(r.service(request),
            function(response) {
                test.equal(response.statusCode, 200);
                test.ok(response instanceof ViewResponse);
                test.equal(response.view, view);
                test.done();
            }).end();
    },

    "test intercept viewResponse w/o view": function(test) {

        var request = new Request();
        var r = new ViewRenderer();
        var res = new ViewResponse('my-view');
        var mockView = {};

        r.addView('my-view', mockView);

        r.setNext(new Stage(
            function() {
                return res;
            }));

        Q.when(r.service(request),
            function(response) {
                test.equal(response.statusCode, 200);
                test.equal(response, res);
                test.equal(response.renderer, r);
                test.done();
            }).end();
    }
});

module.exports["rendering"] = testCase({
    
    "test render and resolve": function(test) {

        var r = new ViewRenderer()
        var params = {val: 'ref:req_info:client_ip'};
        
        r.addView('myview', new JsonTemplate('Client IP = {val}'));
        r.addView('layout', new JsonTemplate('<doctype html>{content}'));

        r.setResolverPool({
            resolve: function(type, ref) {
                test.equal(type, 'req_info');
                test.equal(ref, 'client_ip');
                return '0.0.0.1';
            }
        })

        test.equal(r.render('myview', params), '<doctype html>Client IP = 0.0.0.1');
        test.done();
    },

//    "test render nested views with layout": function(test) {
//
//        var r = new Renderer();
//
//        r.vr.addViews({
//            base: new JsonTemplate('{y} {q}'),
//            sub1: new JsonTemplate('{z} {b}'),
//            sub2: new JsonTemplate('{a}'),
//            sub3: new JsonTemplate('{r}'),
//            layout: new JsonTemplate('<doctype html>{content}')
//        });
//
//        var v = new View('base', {
//            x: 42,
//            y: new View('sub1', {
//                z: new View('sub2', {
//                    a: 34
//                }),
//                b: 'hi'
//            }),
//            q: new View('sub3', {
//                r: 'there'
//            })
//        });
//
//        test.equal(r.render(v), '<doctype html>34 hi there');
//        test.done();
//    },

    "test render missing view falls back to error": function(test) {

        var r = new ViewRenderer();

        r.addView('error', new JsonTemplate('ERROR {error.code}: {error.message}'));
        r.addView('layout', new JsonTemplate('<doctype html>{content}'));

        test.equal(r.render('base'), '<doctype html>ERROR 500: view "base" not found');
        test.done();
    },

    "test render missing view without error view": function(test) {

        var r = new ViewRenderer();

        r.addView('layout', new JsonTemplate('<doctype html>{content}'));

        try {
            r.render('base');
        }
        catch (err) {
            test.equal(err.message, 'view "base" not found');
            test.done();
        }
    }
});