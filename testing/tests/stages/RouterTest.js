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

var capsela = require('capsela');
var Layer = capsela.Layer;
var Response = capsela.Response;
var Request = capsela.Request;
var Router = capsela.stages.Router;
var Q = require('qq');

module.exports = testCase({

    "test match correct route": function(test) {

        test.expect(1);
        
        var router = new Router();
        var request = new Request('GET', '/testing');

        router.install('route1', '/', function(req) {
            test.equal(req, request);
        });

        router.install('route2', '/testing', function(req) {
            test.equal(req, request);
        });

        Q.when(router.service(request), function() {
            test.done();
        });
    },

    "test match correct route reverse": function(test) {

        test.expect(1);

        var router = new Router();
        var request = new Request('GET', '/testing');

        router.install('route1', '/testing', function(req) {
            test.equal(req, request);
        });

        router.install('route2', '/', function(req) {
            test.equal(req, request);
        });

        Q.when(router.service(request), function() {
            test.done();
        });
    },

    "test install/assemble": function(test) {

        var router = new Router();

        router.install('route1', '/testing', function() {});

        test.equal('/testing', router.assemble('route1'));

        // now forget leading slash
        router.install('route2', 'testingAgain', {});
        test.equal('/testingAgain', router.assemble('route2'));

        test.done();
    },

    "test get": function(test) {

        test.expect(1);

        var router = new Router();

        router.install('route1', '/testing', function(request) {
            test.ok(true);
        });

        Q.when(router.service(new Request('GET', '/testing')), function() {
            test.done();
        });
    },

    "test post": function(test) {

        test.expect(1);

        var router = new Router();

        router.install('route1', '/testing', null, function(request) {
            test.ok(true);
        });

        Q.when(router.service(new Request('POST', '/testing')), function() {
            test.done();
        });
    },

    "test put": function(test) {

        test.expect(1);

        var router = new Router();

        router.install('route1', '/testing', null, null, function(request) {
            test.ok(true);
        });

        Q.when(router.service(new Request('PUT', '/testing')), function() {
            test.done();
        });
    },

    "test delete": function(test) {

        test.expect(1);

        var router = new Router();

        router.install('route1', '/testing', null, null, null, function(request) {
            test.ok(true);
        });

        Q.when(router.service(new Request('DELETE', '/testing')), function() {
            test.done();
        });
    },

    "test no match falls through": function(test) {

        var router = new Router();
        var request = new Request('GET', '/yomama');

        test.expect(3);

        router.pass = function() {
            test.ok(true);
        };

        Q.when(router.service(request),
            function(response) {
                test.equal(request.router, router);
                test.equal(response, undefined);
                test.done();
            });
    },

    "test wrong method": function(test) {

        var router = new Router();
        var request = new Request('POST', '/');

        router.install('default', '/',
                function(request) {
                    return new Response();
                });


        try {
            router.service(request);
        }
        catch (err) {
            test.equal(request.router, router);
            test.equal(err.code, 405);
            test.done();
        }
    },

    "test match root": function(test) {

        var router = new Router();
        var request = new Request('GET', '/');
        var mockResponse = {};

        router.install('default', '/',
            function(request) {
                return mockResponse;
            });

        Q.when(router.service(request), function(response) {

            // make sure router injects self into request
            test.equal(request.router, router);
            test.equal(response, mockResponse);
            test.done();
        });
    },

    "test newest route wins": function(test) {

        var router = new Router();
        var request = new Request('GET', '/testing');
        var mockResponse = {};

        router.install('act', '/testing',
                function(request) {
                });

        router.install('zipzap', '/testing',
                function(request) {
                    return mockResponse;
                });

        Q.when(router.service(request),
            function(response) {
                test.equal(request.router, router);
                test.equal(response, mockResponse);
                test.done();
            });
    },

    "test clobber existing route with name": function(test) {

        var router = new Router();
        var request = new Request('GET', '/testing');

        router.install('act', '/testing',
                function(request) {
                    test.ok(false);
                });

        router.install('act', '/test-again',
                function(request) {
                    test.ok(false);
                });

        Q.when(router.service(request),
            function(response) {
                test.equal(request.router, router);
                test.equal(response, undefined);
                test.done();
            });
    },

    "test route to POST": function(test) {

        var router = new Router();
        var request = new Request('POST', '/monkeys');
        var mockResponse = {};

        router.install('testRoute', '/monkeys',
                function(request) {
                    test.ok(false);
                },
                function(request) {
                    return mockResponse;
                });

        Q.when(router.service(request), function(response) {
            test.equal(request.router, router);
            test.equal(response, mockResponse);
            test.done();
        });
    },

    "test route with named params": function(test) {

        test.expect(8);

        var router = new Router();
        var mockResponse = {};

        router.install('testRoute', '/monkeys/:quantity/:color',
                function(request) {
                    test.equal(request.params.quantity, 822);
                    test.equal(request.params.color, 'blue');
                    test.equal(request.params.title, 'yesterday');
                    return mockResponse;
                });

        var assembled = router.assemble('testRoute', { quantity: 17, color: 'greenish' });
        test.equal('/monkeys/17/greenish', assembled);

        try {
            router.assemble('testRoute', { color: 'greenish' });
        } catch (e) {
            test.equal('no value given for parameter "quantity"', e.message);
        }

        // querystring param will get clobbered by route param
        var request = new Request('GET', '/monkeys/822/blue?title=yesterday&color=mauve');

        test.deepEqual(request.params, {title: 'yesterday', color: 'mauve'});

        Q.when(router.service(request), function(response) {
            test.equal(request.router, router);
            test.equal(response, mockResponse);
            test.done();
        });
    },

    "test routing tolerates GET query string": function(test) {

        test.expect(2);

        var router = new Router();
        var mockResponse = {};

        router.install('testRoute', '/monkeys', function(request) {
            test.equal(request.url, '/monkeys?i=989234');
            return mockResponse;
        });

        var request = new Request('GET', '/monkeys?i=989234');

        Q.when(router.service(request), function(response) {
            test.equal(response, mockResponse);
            test.done();
        });
    }
});