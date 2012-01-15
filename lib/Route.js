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

var Class = require('capsela-util').Class;

var Route = Class.extend(
    /** @lends Route */ {
},
/** @lends Route# */ {
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * @constructs
     * @param route
     * @param getFn
     * @param postFn
     */
    init: function(route, getFn, postFn, putFn, delFn) {

        // ignore any trailing slashes
        var parts = route.replace(/\/+$/, '').split('/');
        parts.shift();

        this.parts = parts;

        this.handlers = {
            'get': getFn,
            'post': postFn,
            'put': putFn,
            'delete': delFn
        };
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns true if this route matches the given URL path, false otherwise.
     * 
     * @param path
     * @param params    an object to which route params will be added
     */
    match: function(path, params) {

        // ignore any trailing slashes
        var pathParts = path.split('/');

        // the first part is empty since all paths start with /
        pathParts.shift();

        // just so we have somewhere to put them
        params = params || {};

        // todo support param defaults?

        if (pathParts.length < this.parts.length) {

            if (this.parts[this.parts.length - 1] == '*') {
                params.wildcard = null;
            } else {
                return false;
            }
        }

        for (var i = 0; i < pathParts.length; i++) {

            if (this.parts[i] == undefined) {

                if (pathParts[i] != '') {
                    return false;
                }
            }
            else if (this.parts[i][0] == ':') {
                // the route part is a param, set the value
                params[this.parts[i].substr(1)] = pathParts[i];
            }
            else if (this.parts[i] == '*') {
                params['wildcard'] = pathParts.slice(i).join('/');
                break;
            }
            else if (this.parts[i] != pathParts[i]) {
                return false;
            }
        }

        return true;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Assembles a path for this route with the given params.
     * 
     * @param params
     */
    assemble: function(params) {

        var path = '';

        params = params || {};

        for (var i = 0; i < this.parts.length; i++) {

            // see if this part should have a param

            if (this.parts[i][0] == ':') {

                var paramName = this.parts[i].substr(1);

                if (params[paramName] == null) {
                    throw new Error('no value given for parameter "' + paramName + '"');
                }

                path += '/' + params[paramName];
            }
            else {
                path += '/' + this.parts[i];
            }
        }

        return path || '/';
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a controller function or null if the given method is not supported.
     *
     * @param method    the HTTP method (e.g. get, post)
     */
    getHandler: function(method) {
        return this.handlers[method.toLowerCase()];
    }
});

exports.Route = Route;