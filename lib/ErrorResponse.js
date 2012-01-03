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

var View = require('./View').View;
var ViewResponse = require('./ViewResponse').ViewResponse;

var ErrorResponse = ViewResponse.extend({

    TEMPLATE:
        '<html>' +
            '<head>' +
            '<title>Error</title>' +
            '<style type="text/css">' +
            'body {' +
                'font-family: Arial;' +
                'color: #888;' +
            '}' +
            '</style>' +
            '</head>' +
            '<body>' +
                '<h1 class="error">{error.message}</h1>' +
                '<pre>{error.stack}</pre>' +
            '</body>' +
        '</html>'
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new error response with the given error and HTTP status code.
     * 
     * @param error
     * @param code
     */
    init: function(error, code) {

        code = code || 500;

        this._super(new View(this.Class.TEMPLATE, {error: error, code: code}), code);
        this.error = error || new Error("An error occurred");
    }
});

exports.ErrorResponse = ErrorResponse;
