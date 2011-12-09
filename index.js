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
 * Author: Chris Osborn
 * Date: 5/4/11
 */

"use strict";
/*global require: false, __dirname: false, global: false, process: false, exports: true, Buffer: false, module: false, setInterval: true */

var modules = ['Server', 'Stage', 'Request', 'Response',
    'Redirect', 'ErrorResponse', 'FileResponse',
    'JsonResponse', 'StreamResponse', 'TemplateResponse',
    'ClientResponse', 'Controller',
     'Route', 'HttpClient', 'Browser', 'Cookie', 'Form',
    'Session', 'SessionStore', 'View'];

function loadModule(name) {
    var module = require(__dirname + '/lib/' + name);
    exports[name] = module;
    for (var item in module) {
        exports[item] = module[item];
    }
}

modules.forEach(loadModule);

exports.stages = require(__dirname + '/lib/stages');

/**
 * Set up getters for the "rigs" and "probes" namespaces so the
 * corresponding code doesn't get loaded unless explicitly requested.
 */

Object.defineProperty(exports, 'rigs', {
    get: function() {
        return require(__dirname + '/testing/rigs');
    }
});

Object.defineProperty(exports, 'mocks', {
    get: function() {

        return {
            Request: require(__dirname + '/testing/mocks/Request').Request,
            Response: require(__dirname + '/testing/mocks/Response').Response
        };
    }
});