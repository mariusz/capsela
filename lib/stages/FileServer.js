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
 * Date: Feb 26, 2011
 */

"use strict";

var pathUtils = require('path');
var capsela = require('capsela');
var Stage = capsela.Stage;
var qfs = require('q-fs');
var Q = require('qq');

var FileServer = Stage.extend({
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a file server for the specified directory.
     *
     * @param {string} location base location in the URL tree
     * @param {string} dir      the path to the directory to serve
     * @param defaultFile       the filename to serve as directory indexes (optional)
     */
    init: function(baseUrl, directory, defaultFile) {

        this.mappings = [];
        this.defaultFile = defaultFile;

        this.mount(directory, baseUrl);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Add an additional path mapping.
     * 
     * @param {string} dir      path to the directory to serve
     * @param {string} location mount point in URL tree
     */
    mount: function(dir, location) {

        // normalize with leading slash
        location = location.charAt(0) == '/' ? location : '/' + location;

        this.mappings.push({
            location: location,
            root: dir
        });
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     */
    service: function(request) {

        var t = this;
        var reqPath = request.path;

        // bounce potentially malicious paths - not very sophisticated; could be legal
        // todo do we need to decodeURIComponent request.url or does node do that?
        if (reqPath.indexOf('..') >= 0) {
            throw new capsela.Error("can't use .. in path", 403);
        }

        // tries the specified mapping
        function tryMapping(index) {

            var mapping = t.mappings[index];

            if (!mapping) {
                return t.pass(request);    // out of mappings to try
            }

            // see if the request matches the baseUrl
            if (reqPath.indexOf(mapping.location) == 0) {

                // cut the prefix off the path
                var remainder = reqPath.substr(mapping.location.length);

                var filePath = pathUtils.join(mapping.root, remainder);
                
                // stat the path
                return qfs.stat(filePath).then(
                    function(stats) {

                        if (stats.isDirectory()) {

                            // if we have a default file name, use it
                            if (t.defaultFile) {
                                filePath = pathUtils.join(filePath, t.defaultFile);
                            }
                            else {
                                return new capsela.Error("directory listing denied", 403);
                            }
                        }

                        return FileResponse.create(filePath).then(null,
                            function() {
                                // fall through on error
                                return t.pass(request);
                            });
                    },
                    function(err) {
                        
                        // try the next mapping
                        return tryMapping(index + 1);
                    }
                );
            }

            // doesn't match; try the next mapping
            return tryMapping(index + 1);
        }

        return tryMapping(0);
    }
});

exports.FileServer = FileServer;

var Response = require('capsela').Response;
var FileResponse = require('capsela').FileResponse;