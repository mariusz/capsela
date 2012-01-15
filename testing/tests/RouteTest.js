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
 * Date: 4/18/11
 */

"use strict";

var testbench = require('../TestBench');

var Route = require('capsela').Route;

var controller = {

    login: function() {

    },

    logout: function() {

    }
};

module.exports["match"] = {

    "test match wildcard": function(test) {

        var route = new Route('/caps/*', controller.login, controller.login);

        var params = {};

        test.ok(route.match('/caps/', params));
        test.deepEqual(params, {wildcard: ''});

        test.ok(route.match('/caps/yo', params));
        test.deepEqual(params, {wildcard: 'yo'});

        test.ok(route.match('/caps//yo', params));
        test.deepEqual(params, {wildcard: '/yo'});

        test.done();
    },

    "test match wildcard with param": function(test) {

        var route = new Route('/monkeys/:id/*', controller.login, controller.login);

        test.equal(route.match('/bunk'), false);
        
        var params = {};

        test.ok(route.match('/monkeys/77', params));
        test.deepEqual(params, {id: 77, wildcard: null});

        test.ok(route.match('/monkeys/77/', params));
        test.deepEqual(params, {id: 77, wildcard: ''});

        test.ok(route.match('/monkeys/77/42', params));
        test.deepEqual(params, {id: 77, wildcard: '42'});

        test.ok(route.match('/monkeys/77/well/it/happened/years/ago', params));
        test.deepEqual(params, {id: 77, wildcard: 'well/it/happened/years/ago'});

        test.done();
    },

    "test match trailing slash": function(test) {

        var route = new Route('/caps', controller.login, controller.login);

        var params = {};
        test.ok(route.match('/caps/', params));
        test.deepEqual(params, {});

        test.done();
    },

    "test match/assemble root": function(test) {

        var route = new Route('/', controller.login, controller.login);

        var params = {};
        
        test.ok(route.match('/', params));
        test.deepEqual(params, {});

        test.ok(route.match(''), params);
        test.deepEqual(params, {});
        
        test.equal(route.match('/bunk'), false);
        
        test.equal(route.assemble(), '/');

        test.done();
    },

    "test match path longer than route": function(test) {

        var route = new Route('/caps', controller.login, controller.login);

        test.equal(route.match('/caps/install'), false);

        var params = {};

        test.ok(route.match('/caps/', params));
        test.deepEqual(params, {});

        test.done();
    },

    "test match no params": function(test) {

        var route = new Route('/user/login', controller.login);

        var params = {};
        
        test.ok(route.match('/user/login', params));
        test.deepEqual(params, {});
        
        test.equal(route.match('/user/logout'), false);

        test.done();
    },

    "test match with params": function(test) {

        var route = new Route('/user/:id/profile/:action', controller.login);

        var params = {};

        test.ok(route.match('/user/47/profile/edit', params));
        test.deepEqual(params, {id: 47, action: 'edit'});
        
        test.equal(route.match('/user/logout'), false);

        test.done();
    },

    "test assemble no params": function(test) {

        var route = new Route('/user/logout', controller.login);

        test.equal(route.assemble(), '/user/logout');

        test.done();
    },

    "test assemble with params": function(test) {

        var route = new Route('/monkeys/:quantity/:color', controller.login);

        var assembled = route.assemble({ quantity: 0, color: 'greenish' });
        test.equal('/monkeys/0/greenish', assembled);
        
        try {
            route.assemble({ color: 'greenish' });
        } catch (e) {
            test.equal('no value given for parameter "quantity"', e.message);
        }

        test.done();
    }
};


module.exports["handlers"] = {

    "test get handler no post": function(test) {

        var route = new Route('/user/login', controller.login);

        test.equal(route.getHandler('get'), controller.login);
        test.equal(route.getHandler('GET'), controller.login);
        test.equal(route.getHandler('post'), null);
        test.equal(route.getHandler('POST'), null);

        test.done();
    },

    "test get handler no get": function(test) {

        var route = new Route('/user/login', null, controller.login);

        test.equal(route.getHandler('post'), controller.login);
        test.equal(route.getHandler('pOSt'), controller.login);
        test.equal(route.getHandler('get'), null);
        test.equal(route.getHandler('GET'), null);
        test.equal(route.getHandler('put'), null);
        test.equal(route.getHandler('delete'), null);

        test.done();
    },

    "test get handler get/post": function(test) {

        var route = new Route('/user/login', controller.login, controller.login);

        test.equal(route.getHandler('get'), controller.login);
        test.equal(route.getHandler('GET'), controller.login);
        test.equal(route.getHandler('post'), controller.login);
        test.equal(route.getHandler('POST'), controller.login);

        test.done();
    },

    "test get handler put del": function(test) {

        var route = new Route('/user/login', null, null, controller.login, controller.login);

        test.equal(route.getHandler('get'), null);
        test.equal(route.getHandler('post'), null);
        test.equal(route.getHandler('put'), controller.login);
        test.equal(route.getHandler('delete'), controller.login);

        test.done();
    }
};