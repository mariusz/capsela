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

var JsonResponse = require('capsela').JsonResponse;
var Pipe = require('capsela-util').Pipe;

module.exports["basics"] = {

    "test init bad entity": function(test) {

        test.throws(function() {
            var r = new JsonResponse({
                toJSON: function() {
                    throw new Error("i die");
                }
            });
        });
        
        test.done();
    },
    
    "test init": function(test) {

        var r = new JsonResponse();

        test.equal(r.statusCode, 200);
        test.deepEqual(r.getContentType(), 'application/json');
        test.equal(r.getEntity(), null);
        test.equal(r.getJson(), null);

        r = new JsonResponse({'expires': 'tomorrow'}, JsonResponse.WRAP_HTML);

        test.equal(r.statusCode, 200);
        test.deepEqual(r.getContentType(), 'application/json');
        test.deepEqual(r.getEntity(), {expires: 'tomorrow'});
        test.equal(r.getJson(), JSON.stringify(r.getEntity()));

        var entity = {'title': 'demon days'};

        r.setEntity(entity);
        test.equal(r.getEntity(), entity);
        test.equal(r.getJson(), JSON.stringify(r.getEntity()));
        
        test.done();
    },

    "test sendBody no wrap": function(test) {

        var entity = {'expires': 'tomorrow'};
        var r = new JsonResponse(entity);
        var pipe = new Pipe();

        pipe.getData().then(
            function(data) {
                test.equal(data, JSON.stringify(entity));
                test.done();
            }
        );

        r.sendBody(pipe);
    },

    "test sendBody HTML wrap": function(test) {

        var entity = {'expires': 'tomorrow'};
        var r = new JsonResponse(entity);
        var pipe = new Pipe();

        r.setWrap(JsonResponse.WRAP_HTML);

        test.equal(r.getContentType(), 'text/html; charset=utf-8');

        pipe.getData().then(
            function(data) {
                test.equal(data, '<textarea>' + JSON.stringify(entity) + '</textarea>');
                test.done();
            }
        );

        r.sendBody(pipe);
    }
};