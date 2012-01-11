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
 * Date: 1/6/12
 */

"use strict";

var testbench = require(__dirname + '/../../TestBench');
var testCase = require('nodeunit').testCase;

var capsela = require('capsela');
var PreferredHost = capsela.stages.PreferredHost;
var View = capsela.View;

var Q = require('qq');

module.exports["basics"] = testCase({

    "test setResolver": function(test) {

        test.e

        var stage = new PreferredHost('www.example.com');
        var resolver = new capsela.Resolver();

        resolver.register('snookums', function() {
            return '/hello!';
        });

        stage.setResolver(resolver);
        
        test.equal(stage.resolver, resolver);

        // this should now work
        test.equal(resolver.resolve('absolute_url', '/hithere'), 'http://www.example.com/hithere');

        // should sub-resolve
        test.equal(resolver.resolve('absolute_url', 'ref:snookums:nothing'), 'http://www.example.com/hello!');

        test.done();
    },

    "test passthrough": function(test) {

        var stage = new PreferredHost('www.example.com');
        var request = new capsela.Request('GET', '/', {host: 'www.example.com'});

        stage.pass = function() {
            return "gotcha";
        };

        test.equal(stage.service(request), 'gotcha');
        test.done();
    },

    "test catch hostname": function(test) {

        var stage = new PreferredHost('www.example.com');
        var request = new capsela.Request('GET', '/', {host: 'example.com'});

        stage.pass = function() {
            test.ok(false);
        };
        
        var response = stage.service(request);
        test.ok(response instanceof capsela.Redirect);
        test.equal(response.statusCode, 301);
        test.equal(response.getHeader('location'), 'http://www.example.com/');

        request = new capsela.Request('GET', '/', {host: 'example.com'}, null, 'https');
        response = stage.service(request);
        test.ok(response instanceof capsela.Redirect);
        test.equal(response.statusCode, 301);
        test.equal(response.getHeader('location'), 'https://www.example.com/');

        test.done();
    },

    "test favor http": function(test) {

        var stage = new PreferredHost('www.example.com', 'http');
        var request = new capsela.Request('GET', '/', {host: 'example.com'});

        stage.pass = function() {
            test.ok(false);
        };

        var response = stage.service(request);
        test.ok(response instanceof capsela.Redirect);
        test.equal(response.getHeader('location'), 'http://www.example.com/');

        request = new capsela.Request('GET', '/', {host: 'example.com'}, null, 'https');
        response = stage.service(request);
        test.ok(response instanceof capsela.Redirect);
        test.equal(response.getHeader('location'), 'http://www.example.com/');

        test.done();
    },

    "test favor https": function(test) {

        var stage = new PreferredHost('www.example.com:445', 'https');
        var request = new capsela.Request('GET', '/', {host: 'example.com'});

        stage.pass = function() {
            test.ok(false);
        };

        var response = stage.service(request);
        test.ok(response instanceof capsela.Redirect);
        test.equal(response.getHeader('location'), 'https://www.example.com:445/');

        request = new capsela.Request('GET', '/', {host: 'example.com'}, null, 'https');
        response = stage.service(request);
        test.ok(response instanceof capsela.Redirect);
        test.equal(response.getHeader('location'), 'https://www.example.com:445/');

        test.done();
    }
});