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
var jsontemplate = require('json-template');

var TemplateResponse = Response.extend({
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new template response from the given JSON template and params.
     * 
     * @param template  string  a JSON template
     * @param params    object
     * @param code      optional HTTP status code
     */
    init: function(template, params, code) {

        this._super(code);
        this.template = template;
        this.params = params || {};
        
        this.setContentType('text/html', 'utf8');
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Writes the response body to the given stream.
     *
     * @param stream    writable stream
     */
    writeBody: function(stream) {

        stream.end(
            jsontemplate.expand(this.template, this.params, {undefined_str: ''}),
            'utf8');
    }
});

exports.TemplateResponse = TemplateResponse;
