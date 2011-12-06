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
 * Date: 12/5/11
 */

"use strict";

var Class = require('capsela-util').Class
var jsontemplate = require('json-template');

var View = Class.extend({

},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new View from the given JSON template and params.
     *
     * @param template  string  a JSON template
     * @param params    object
     */
    init: function(template, params) {

        this.template = template;
        this.params = params;

        // try to get the title from the template
        var matches = template.match(/^\s*<!--JSON\s*(.*)\s*-->\s*(\S[\s\S]*)/);
        if (matches) {
            
            var info = JSON.parse(matches[1]);
            this.title = info.title;

            // the template is the remainder
            this.template = matches[2];
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Renders the template and returns HTML.
     *
     * @return string
     */
    getHtml: function() {

        // only render if we've been given params; otherwise we assume the
        // template is non-parameterized (static) and we don't need to render it
        
        if (this.params) {
            return jsontemplate.expand(
                this.template,
                this.params,
                {undefined_str: ''});
        }

        return this.template;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns this view's title.
     *
     * @return string
     */
    getTitle: function() {
        return this.title;
    }
});

exports.View = View;