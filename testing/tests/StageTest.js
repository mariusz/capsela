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
 * Date: 10/28/11
 */

"use strict";

var testbench = require(__dirname + '/../TestBench');

var capsela = require('capsela');
var Stage = capsela.Stage;
var Q = require('q');

module.exports["parsing"] = {

    "test init": function(test) {

        var mockRequest = {};
        
        var stage = new Stage(
            function(request) {
                test.equal(request, mockRequest);
                return this.pass(request);
            });

        stage.setNext(new Stage(
            function(request) {
                test.equal(request, mockRequest);
                return 'okie-doke';
            }
        ));

        test.equal(stage.service(mockRequest), 'okie-doke');
        test.done();
    },

    "test isReady": function(test) {

        var stage = new Stage();
        test.equal(stage.isReady(), true);
        test.done();
    },

    "test pass no next stage": function(test) {

        var stage = new Stage();

        var mockRequest = {};

        test.equal(stage.pass(mockRequest), undefined);
        test.done();
    },
    
    "test setNext/pass": function(test) {

        test.expect(5);

        var stage = new Stage();

        var mockRequest = {};
        var mockResponse = {};
        
        var subStage = new Stage(
            function(request) {
                test.equal(request, mockRequest);
                return mockResponse;
            });

        subStage.setResolver = function() {
            test.ok(true);
        };

        test.equal(stage.setNext(subStage), subStage);
        test.equal(stage.pass(mockRequest), mockResponse);

        // test adding a raw function
        stage.setNext(function(request) {
            return 'hi!';
        });

        test.equal(stage.pass({}), "hi!");

        test.done();
    },

    "test addStage": function(test) {

        var stage1 = new Stage();
        var stage2 = new Stage();
        var stage3 = new Stage();
        var stage4 = new Stage();

        test.equal(stage1.addStage(stage2), stage1);
        test.equal(stage1.next, stage2);

        test.equal(stage2.addStage(stage3), stage2);
        test.equal(stage2.next, stage3);

        test.equal(stage1.addStage(stage4), stage1);
        test.equal(stage3.next, stage4);

        // test adding a raw function

        test.equal(stage4.addStage(function(request) {
            return "hi there!";
        }), stage4);


        test.equal(stage4.pass({}), "hi there!");

        test.done();
    },

    "test addStage fluent": function(test) {

        var stage1 = new Stage();
        var stage2 = new Stage();
        var stage3 = new Stage();
        var stage4 = new Stage();

        test.equal(stage1.addStage(stage2).addStage(stage3).addStage(stage4), stage1);
        test.equal(stage1.next, stage2);
        test.equal(stage2.next, stage3);
        test.equal(stage3.next, stage4);
        
        test.done();
    },

    "test setResolverPool": function(test) {

        var stage1 = new Stage();
        var stage2 = new Stage();

        var mock = {};

        stage1.setResolver(mock);
        stage1.setNext(stage2);

        test.equal(stage2.resolver, mock);

        test.done();
    },

    "test addResolver": function(test) {

        test.expect(3);

        var stage1 = new Stage();
        var stage2 = new Stage();

        var mock = {};
        var pool = {
            register: function(type, resolver) {
                test.equal(type, 'base_url');
                test.equal(resolver, mock);
            }
        };

        stage1.setResolver(pool);
        stage1.setNext(stage2);

        // add resolver to stage2...
        test.equal(stage2.addResolver('base_url', mock), stage2);

        test.done();
    }
};