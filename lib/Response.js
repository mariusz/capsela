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
 * Date: Mar 2, 2011
 */

"use strict";

var Class = require('capsela-util').Class;
var Q = require('qq');
var fs = require('fs');
var path = require('path');
var querystring = require('querystring');

// todo support multiple headers with the same name e.g. Set-Cookie

var Response = Class.extend({
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new HTTP server response.
     * 
     * @param statusCode    status code (defaults to 200)
     * @param headers       optional headers
     * @param body          optional body content, string or buffer
     * @param type          optional mime type
     * @param encoding      optional string encoding
     */
    init: function(statusCode, headers, body, type, encoding) {

        this.statusCode = statusCode || 200;
        this.headers = {};
        this.params = {};

        this.body = body;

        if (type) {
            this.setContentType(type, encoding || 'utf8');
        }
        else if (body && typeof body == 'string') {
            this.setContentType('text/plain', 'utf8');
        }

        if (body && body.length) {
            this.setHeader('Content-Length', body.length);
        }

        // copy the headers over
        for (var name in headers) {
            this.setHeader(name, headers[name]);
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the value of the specified header.
     *
     * @param name
     */
    getHeader: function(name) {
        var header = this.headers[name.toLowerCase()];
        return header ? header.value : null;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns all headers set on the Response.
     */
    getHeaders: function() {
        var headers = {};

        for (var i in this.headers) {
            if (this.headers.hasOwnProperty(i)) {
                var header = this.headers[i];
                headers[header.name] = header.value;
            }
        }
        
        return headers;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Sets the given header to the given value.
     *
     * @param name
     * @param value
     */
    setHeader: function(name, value) {

        // todo support multiple headers with the same name, e.g. set-cookie

        if (!name) {
            throw new Error("can't set header without name");
        }

        if (typeof value === 'undefined') {
            throw new Error("can't set header without value");
        }

        // preserve the case of header names
        this.headers[name.toLowerCase()] = {name: name, value: value};
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Removes the named header
     *
     * @param name
     */
    removeHeader: function(name) {
        delete this.headers[name.toLowerCase()];
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Sets the content-type header for the response.
     * 
     * @param mediaType the desired mime type
     * @param encoding  the node.js encoding
     */
    setContentType: function(mediaType, encoding) {

        if (!mediaType) {
            // only set the content type if we know what it is, as opposed to
            // falling back on application/octet-stream a la apache
            this.removeHeader('Content-Type');
            return;
        }

        var params = null;

        if (mediaType.substring(0,5) == 'text/' && encoding) {
            
            if (encoding == 'ascii') {
                params = {charset: 'us-ascii'};
            }
            else if (encoding == 'utf8') {
                params = {charset: 'utf-8'};
            }
        }

        // save the encoding for later
        this.encoding = encoding;

        this.setHeader('Content-Type',
                mediaType + (params ? '; ' + querystring.stringify(params) : ''));
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the content-type header for the response.
     */
    getContentType: function() {
        return this.getHeader('Content-Type');
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Forces the browser to download this response rather than display it.
     *
     * @param filename  the suggested filename for the download
     */
    forceDownload: function(filename) {

        var value = "attachment" + (filename ? '; filename="' + filename + '"' : '');

        return this.setHeader('Content-Disposition', value);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Renders into the given writable stream.
     * 
     * @param stream
     */
    writeBody: function(stream) {

        if (this.body) {
            stream.end(this.body, this.encoding);
        }
        else {
            stream.end();
        }
    }

});

exports.Response = Response;
