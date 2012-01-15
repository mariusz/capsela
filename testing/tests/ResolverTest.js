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
 * Date: 12/22/11
 */

"use strict";

var testbench = require(__dirname + '/../TestBench');

var capsela = require('capsela');

module.exports["basics"] = {

    "test register/resolve": function(test) {

        var reg = new capsela.Resolver();

        test.equal(reg.resolve('base_url'), undefined);

        reg.register('action_link', {
            resolve: function(nid, nss, r) {
                test.equal(r, reg);
                return '/aloha';
            }
        });
        
        test.equal(reg.resolve('base_url'), undefined);

        reg.register('base_url', {
            resolve: function(nid, nss) {
                return 'http://www.example.com';
            }
        });

        test.equal(reg.resolve('base_url'), 'http://www.example.com');
        test.equal(reg.resolve('action_link'), '/aloha');

        test.done();
    },
    
    "test register bare function": function(test) {

        var reg = new capsela.Resolver();

        test.equal(reg.resolve('base_url'), undefined);

        reg.register('action_link',
            function(nid, nss) {
                return '/aloha';
            });

        test.equal(reg.resolve('base_url'), undefined);

        reg.register('base_url',
            function(nid, nss) {
                return 'http://www.example.com';
            });

        test.equal(reg.resolve('base_url'), 'http://www.example.com');
        test.equal(reg.resolve('action_link'), '/aloha');

        test.done();
    }
};

module.exports["resolving"] = {

    "test resolve": function(test) {

        var r = new capsela.Resolver();

        r.register('cap', {
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