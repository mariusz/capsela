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
 * Date: Feb 28, 2011
 */

"use strict";

var testbench = require('../../TestBench');

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

var TestView = capsela.View.extend({
},
{
    render: function() {
        return 'hi there!';
    }
});

module.exports["basics"] = {

    "test init/isReady": function(test) {

        var r = new ViewRenderer();

        r.isReady().then(
            function() {
                test.done();
            }
        );
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
        
        var view = new TestView('my-view');

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
};

module.exports["rendering"] = {
    
    "test render and resolve": function(test) {

        var r = new ViewRenderer();
        var params = {val: 'ref:req_info:client_ip'};

        var view = new JsonTemplate('Client IP = {val}');
        
        r.addView('myview', view);
        view.setParent(new JsonTemplate('<doctype html>{content}'));

        r.setResolver({
            resolveReferences: function(str) {
                test.equal(str, 'done render');
                return 'all resolved';
            }
        });

        r.vr.render = function(view, model, layout) {
            test.equal(view, 'myview');
            test.equal(model, params);
            test.equal(layout, 'layout');
            return 'done render';
        };

        test.equal(r.render('myview', params), 'all resolved');
        test.done();
    },

    "test render missing view falls back to error": function(test) {

        var r = new ViewRenderer();

        var view = new JsonTemplate('ERROR {error.code}: {error.message}');
        
        view.setParent(new JsonTemplate('<doctype html>{content}'));

        r.addView('error', view);

        test.equal(r.render('base'), '<doctype html>ERROR 500: error rendering view: view "base" not found');
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
};