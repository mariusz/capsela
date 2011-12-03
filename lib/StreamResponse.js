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
 * Date: 11/14/11
 */

"use strict";

var Response = require('./Response').Response;
var util = require('util');

var StreamResponse = Response.extend({
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates the response from the given stream and type.
     * 
     * @param stream    a readable stream to provide the response body
     * @param type      the media type string, e.g. image/jpeg
     * @param length    the length of the body data
     */
    init: function(stream, type, length) {

        this._super();
        this.stream = stream;

        // pause it since who knows when we'll get around to reading it
        this.stream.pause();

        if (type) {
            this.setContentType(type);
        }

        if (length >= 0) {
            this.setHeader('Content-Length', length);
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Writes the response body to the given stream.
     *
     * @param stream    writable stream
     */
    writeBody: function(stream) {
        util.pump(this.stream, stream);
        this.stream.resume();
    }
});

exports.StreamResponse = StreamResponse;
