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
var jsontemplate = require('../deps/json-template');

var View = Class.extend({

},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new View from the given JSON template and params.
     *
     * @param template  string  a JSON template
     * @param params    object
     * @param urlFactory
     */
    init: function(template, params, urlFactory) {

        if (!template) {
            throw new Error("c'mon - a view needs a template");
        }

        this.template = template;
        this.params = params;
        this.urlFactory = urlFactory;
        this.env = {};

        // load any outbound params from the template
        
        var matches = template.match(/^\s*<!--JSON\s*(.*)\s*-->\s*(\S[\s\S]*)/);
        
        if (matches) {

            try {
                this.env = JSON.parse(matches[1]);
            }
            catch(err) {
                throw new Error("error parsing view JSON: " + err.message);
            }

            // the template is the remainder
            this.template = matches[2];
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the template for this view.
     */
    getTemplate: function() {
        return this.template;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the params for this view.
     */
    getParams: function() {
        return this.params;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Renders the template and returns HTML.
     *
     * @return string
     */
    render: function() {

        // only render if we've been given params; otherwise we assume the
        // template is non-parameterized (static) and we don't need to render it

        // todo recursive rendering of params that are views??
        
        if (this.params) {

            // render any links into URLs
            var params = {};
            var key, value;

            for (key in this.params) {

                value = this.params[key];

                if (value instanceof Link) {

                    if (!this.urlFactory) {
                        throw new Error("can't render links without URL factory, man");
                    }

                    params[key] = value.render(this.urlFactory);
                }
                else {
                    params[key] = value;
                }
            }

            return jsontemplate.expand(this.template, params, {undefined_str: ''});
        }

        return this.template;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the environment variables provided by this view.
     *
     * @return string
     */
    getEnv: function() {
        return this.env;
    }
});

exports.View = View;

var Link = require('./Link').Link;