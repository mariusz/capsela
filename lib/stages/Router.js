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
 * Date: Feb 26, 2011
 */

"use strict";

var Stage = require('capsela').Stage;
var Route = require('../Route').Route;
var Q = require('qq');

var Router = Stage.extend({
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     *
     */
    init: function() {
        this.routes = [];
        this.nameIndex = {};
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Installs a route to the given functions.
     *
     * @param name
     * @param path
     * @param getFn
     * @param postFn
     * @param putFn
     * @param delFn
     */
    install: function(name, path, getFn, postFn, putFn, delFn) {

        // if a route having that name already exists, remove it
        var route = this.nameIndex[name];

        if (route) {
            this.routes.splice(this.routes.indexOf(route), 1);
        }

        if (path.charAt(0) != '/') {
            path = '/' + path;
        }

        route = new Route(path, getFn, postFn, putFn, delFn);

        this.routes.unshift(route);
        this.nameIndex[name] = route;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Assembles the named route, returning an absolute URL.
     *
     * @param name
     * @param params
     */
    assemble: function(name, params) {

        var route = this.nameIndex[name];
        return route.assemble(params);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Routes to a child layer.
     *
     * @param request
     */
    service: function(request) {

        // inject router into request for lower layers
        request.router = this;

        // look for a matching route

        var found = false;
        var route;

        for (var i in this.routes) {
            if (this.routes.hasOwnProperty(i)) {

                route = this.routes[i];

                if (route.match(request.path, request.params)) {
                    found = true;
                    break;
                }
            }
        }

        // no match found, pass through
        if (!found) {
            return this.pass(request);
        }

        // stash the active route in the request
        request.route = route;

        // get the handler
        var handler = route.getHandler(request.method);

        if (handler == undefined) {
            return new ErrorResponse("method not supported", 405);
        }

        // dispatch to the handler
        // handler functions are intentionally not run with an object context

        return handler(request);
    }
});

exports.Router = Router;

var Response = require('capsela').Response;
var ErrorResponse = require('capsela').ErrorResponse;