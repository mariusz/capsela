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
var pathUtils = require('path');
var fs = require('fs');
var qfs = require('q-fs');
var Q = require('qq');
var util = require('util');

var FileResponse = Response.extend({

    TYPES: {

        'txt':  {type: 'text', subtype: 'plain'},
        'html': {type: 'text', subtype: 'html'},
        'xml':  {type: 'text', subtype: 'xml'},
        'css':  {type: 'text', subtype: 'css'},
        'js':   {type: 'text', subtype: 'javascript'}, // yeah, yeah, i know
        'json': {type: 'application', subtype: 'json'},
        'png':  {type: 'image', subtype: 'png'},
        'svg':  {type: 'image', subtype: 'svg+xml'},
        'jpg':  {type: 'image', subtype: 'jpeg'},
        'jpeg': {type: 'image', subtype: 'jpeg'},
        'gif':  {type: 'image', subtype: 'gif'},
        'tiff': {type: 'image', subtype: 'tiff'},
        'ico':  {type: 'image', subtype: 'x-icon'}
    },
        
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a promise for a new FileResponse for the given path.
     *
     * @param path
     */
    create: function(path) {

        var r = new FileResponse();

        r.path = path;

        var fileExt = pathUtils.extname(path).substr(1).toLowerCase();
        var fileType = this.TYPES[fileExt];
        var contentType;

        // set the content type based on extension
        if (fileType) {
            contentType = fileType.type + '/' + fileType.subtype;
        }

        r.setContentType(contentType);

        return qfs.stat(path).then(
            function(stats) {
                if (stats.isFile()) {
                    this.size = stats.size;
                    r.setHeader('Content-Length', stats.size);
                    r.enableCaching(stats.mtime);
                    return r;
                }
                else {
                    throw new Error("file not found or something, man");
                }
            });
    }
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Writes the response body to the given stream.
     *
     * @param stream
     */
    sendBody: function(stream) {
        util.pump(fs.createReadStream(this.path), stream);
    }
});

exports.FileResponse = FileResponse;
