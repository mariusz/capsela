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
 * Date: 11/16/11
 */

"use strict";

var capsela = require('capsela');
var Q = require('q');

var ErrorHandler = capsela.Stage.extend({
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Catches errors and empty responses and turns them into ViewResponses.
     * 
     * @param request
     */
    service: function(request) {

        var t = this;

        return Q.call(this.pass, this, request).then(
            function(response) {

                // turn empty responses into errors
                if (!response) {
                    throw new capsela.Error("resource not found", 404);
                }

                return response;
            }
        ).then(
            null,
            function(err) {

                // caught an exception!

                var code = err.code || 500;

                return new capsela.ViewResponse('error', {error: err}, code);
            }
        );
    }
});

exports.ErrorHandler = ErrorHandler;