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
 * Date: Mar 4, 2011
 */

"use strict";

var Class = require('capsela-util').Class;
var Logger = require('capsela-util').Logger;
var url = require('url');
var Q = require('qq');

var http = require('http');
var Pipe = require('capsela-util').Pipe;
var SafeStream = require('capsela-util').SafeStream;
var util = require('util');

// todo content-length

var Request = Class.extend({

    mixin: Logger,
        
    nextId: 0   // each request gets an ID to tag its log entries with
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new request from the given params.
     * 
     * @param method
     * @param reqUrl        the URL after the host part
     * @param headers
     * @param bodyStream
     * @param secure        true if the request was/should be via https
     * @param pskId         the TLS-PSK identity for this request
     * @param psk           the pre-shared key to authenticate the request
     */
    init: function(method, reqUrl, headers, bodyStream, secure, pskId, psk) {

        this.inception = Date.now();
        this.id = Request.nextId++;
        this.method = method ? method.toLowerCase() : 'get';
        this.url = reqUrl || '/';
        this.headers = headers || {};
        this.cookies = Cookie.getCookies(this);
        this.bodyStream = bodyStream || new Pipe(); // todo always wrap in a SafeStream?
        this.secure = pskId ? true : secure;    // todo replace with a protocol field?
        this.pskId = pskId;
        this.psk = psk;

        // if the body stream is a normal Node ServerRequest then we need to work around
        // a bug (https://github.com/joyent/node/pull/1040). pause() and resume() do not
        // work as advertised, so buffer the data and end events using a Pipe object,
        // which does support pause() and resume() correctly
        // todo move this into safestream
        if (bodyStream instanceof http.IncomingMessage) {
            this.bodyStream = new SafeStream(new Pipe());
            util.pump(bodyStream, this.bodyStream);
        }

        // pause the bodystream so no data is missed during routing etc.
        this.bodyStream && this.bodyStream.pause();

        this.connection = bodyStream && bodyStream.connection;

        var parts = url.parse(this.url, true);

        this.path = parts.pathname;
        this.params = {};

        for (var i in parts.query) {
            if (parts.query.hasOwnProperty(i)) {
                this.params[i] = parts.query[i];
            }
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the base URL of this request: protocol://hostname:port
     *
     * @return string
     */
    getBaseUrl: function() {
        return (this.secure ? 'https' : 'http') + '://' + this.getHeader('host');
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a URL formed by resolving the given path in the context of this request.
     *
     * @return string
     */
    getRelativeUrl: function(path) {
        return url.resolve(this.getBaseUrl() + this.url, path || '');
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the parsed query string params.
     *
     * @return object
     */
    getParams: function() {
        return this.params;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns true if this request was sent over TLS.
     *
     * todo replace with getProtocol()
     */
    isSecure: function() {
        return this.secure;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns true if this request is a GET request.
     */
    isHead: function() { return this.method == 'head'; },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns true if this request is a GET request.
     */
    isGet: function() { return this.method == 'get'; },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns true if this request is a GET request.
     */
    isPost: function() { return this.method == 'post'; },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns true if this request is a GET request.
     */
    isPut: function() { return this.method == 'put'; },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns true if this request is a GET request.
     */
    isDelete: function() { return this.method == 'delete'; },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the PSK ID associated with the request's connection, if available.
     */
    getPskId: function() {
        return this.pskId;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the time elapsed since this request was created, in ms.
     */
    getElapsedTime: function() {
        return Date.now() - this.inception;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Gets the body stream.
     */
    getBodyStream: function() {
        return this.bodyStream;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the value of the header with the given name.
     *
     * @param name
     */
    getHeader: function(name) {

        for (var i in this.headers) {
            if (i.toLowerCase() == name.toLowerCase()) {
                return this.headers[i];
            }
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the request headers.
     */
    getHeaders: function() {
        return this.headers;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the value of the named cookie, or null if not found.
     * 
     * @param name
     */
    getCookie: function(name) {
        return this.cookies[name];
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a promise for an object obtained by JSON parsing the request body.
     * Note: this function necessarily buffers the entire request body.
     *
     * @return promise
     */
    getBodyObject: function() {

        return Pipe.buffer(this.bodyStream).then(
            function(body) {
                try {
                    return JSON.parse(body);
                }
                catch (e) {
                    throw new Error("request body is not valid JSON");
                }
            });
    }
});

exports.Request = Request;

var Cookie = require('./Cookie').Cookie;
var Form = require('./Form').Form;
var Response = require('./Response').Response;
var Log = require('capsela-util').Log;
