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
 * Date: Feb 15, 2011
 */

"use strict";

/**
 * mocks an HTTP request for both server and client purposes.
 * i.e. a request can be created to provide input to a server method or
 * to receive output from a client method
 */

var Class = require('capsela-util').Class;
var Pipe = require('capsela-util').Pipe;

var EventEmitter = require ('events').EventEmitter;
var util = require('util');

// only works with buffered body mode right now

var Request = Pipe.extend({

    // todo kill this
    createServerRequest: function(method, url, headers, body) {

        if (!/GET|POST|PUT|DELETE/.test(method)) {
            throw new Error("invalid HTTP method: " + method);
        }

        var req = new Request(method, url, headers);

        req.body = body;

        return req;
    }
},
{
    init: function(method, url, headers) {
        this.method = method || 'GET';
        this.url = url || '/';
        this.httpVersion = '1.1';
        this.headers = {};
        this.open = true;
        this.body = '';

        // lowercase the headers, as node does
        for (var i in headers) {
            this.headers[i.toLowerCase()] = headers[i];
        }

        this._super();
    },
    
    write: function(chunk, encoding) {
        this._super(chunk, encoding);
    }
});

exports.Request = Request;