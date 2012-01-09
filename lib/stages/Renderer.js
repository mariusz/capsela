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
 * Date: 12/6/11
 */

"use strict";

/**
 * Intercepts Views and turns them into Responses.
 */

var capsela = require('capsela');
var Q = require('qq');

var Renderer = capsela.Stage.extend({

},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * @param templates a map of view names to Template objects
     * @param layout    the optional Template to use for rendering pages
     */
    init: function(templates, layout) {

        this.templates = templates || {};
        this.layout = layout;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     *
     * @param request
     */
    service: function(request) {

        var t = this;

        return Q.when(this.pass(request),
            function(result) {

                // give ViewResponses the ability to render themselves
                if (result && result instanceof ViewResponse) {
                    result.setRenderer(t);
                    return result;
                }

                // intercept Views and replace with Responses
                if (result && result instanceof View) {

                    // find the template
                    var template = t.templates[result.name];

                    if (!template) {
                        throw new Error('no template found for view "' + result.name + '"');
                    }

                    // create a response that can render the view
                    return new ViewResponse(result).setRenderer(t);
                }

                // pass through others unmolested
                return result;
            });
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Renders the given view and returns the result as a string.
     *
     * @param view
     * @param nested    set to true if this is a nested view
     *
     * @return string
     */
    render: function(view, nested) {
 
        // find the template
        var template = this.templates[view.name];

        // fall back on the error template, if available
        if (!template) {
            return this.render(
                new View('error', {
                    error: new Error('no template found for view "' + view.name + '"')
                }));
        }

        // render any nested views
        
        var params = {};
        var key, value;

        for (key in view.params) {

            value = view.params[key];

            if (value instanceof View) {
                params[key] = this.render(value, true);
            }
            else {
                params[key] = value;
            }
        }

        var result = template.render(params);

        if (!nested && this.layout) {
            result = this.layout.render({view: result});
        }

        // if we have a resolver, use it to resolve any references
        return this.resolverPool ? this.resolveReferences(result) : result;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Resolves URN-like textual references of the form ref:nid:nss
     *
     * @param str   the source text within which refs will be resolved
     *
     * @return string
     */
    resolveReferences: function(str) {

        var resolver = this.resolverPool;
        var re = /ref:([A-Za-z0-9][A-Za-z0-9_-]+):([^\\"&<>\[\]^`{|}~]+)/g;
        
        return str.replace(re,
            function(match, namespace, nss) {
                return resolver.resolve(namespace, nss);
            });
    }
});

exports.Renderer = Renderer;

var View = require('../View').View;
var ViewResponse = require('../ViewResponse').ViewResponse;