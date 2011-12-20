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
var Compositor = capsela.stages.Compositor;
var View = capsela.View;
var ViewResponse = capsela.ViewResponse;
var Q = require('qq');

module.exports = testCase({

    "test passthrough": function(test) {

        var request = new Request();
        var handler = new Compositor('the-template');
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

    "test intercept": function(test) {

        var request = new Request();
        var handler = new Compositor('the-template');
        var view = new View(
            '<!--JSON {"title": "Title!"} --> 2X2L calling CQ! 2X2L calling CQ!');

        handler.setNext(new Stage(
            function() {
                return view;
            }));

        Q.when(handler.service(request),
            function(response) {
                test.equal(response.statusCode, 200);
                test.ok(response instanceof ViewResponse);
                test.equal(response.view.template, 'the-template');
                test.deepEqual(response.view.params, {
                    view: view.render(),
                    title: 'Title!'
                });
                test.done();
            }).end();
    },

    "test intercept complete": function(test) {

        var request = new Request();
        var handler = new Compositor('the-template');
        var view = new View(
            '<!--JSON {"complete": true} --> 2X2L calling CQ! 2X2L calling CQ!', {
                title: "Title!"
            }
        );

        handler.setNext(new Stage(
            function() {
                return view;
            }));

        Q.when(handler.service(request),
            function(response) {
                test.equal(response.statusCode, 200);
                test.equal(response.view, view);
                test.done();
            });
    }
});