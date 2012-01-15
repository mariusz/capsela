/*!
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

var BlobResponse = Response.extend(
/** @lends BlobResponse */{
},
/** @lends BlobResponse# */ {
        
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a response from the given blob.
     *
     * @constructs
     * @extends Response
     *
     * @param {blob} blob the blob
     */
    init: function(blob) {

        this._super();
        this.blob = blob;

        this.setContentType(blob.getType());
        this.setHeader('Content-Length', blob.getSize());
        this.enableCaching(blob.getLastModified());
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Writes the response body to the given stream.
     *
     * @param stream    writable stream
     */
    sendBody: function(stream) {
        util.pump(this.blob.getStream(), stream);
    }
});

exports.BlobResponse = BlobResponse;
