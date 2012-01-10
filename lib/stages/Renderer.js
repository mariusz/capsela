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
     * 
     * @param dir
     * @param type
     */
    init: function(dir, type) {

        this.vr = new capsela.ViewRenderer();

        if (dir && type) {
            this.ready = this.vr.loadTemplates(dir, type);
        }
        else {
            this.ready = Q.ref();
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * @return promise
     */
    isReady: function() {
        return this.ready;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param reg
     */
    setResolverPool: function(reg) {
        this._super(reg);
        this.vr.setResolver(reg);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param name
     * @param template
     */
    addTemplate: function(name, template) {
        this.vr.addTemplate(name, template);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     *
     * @param request
     */
    service: function(request) {

        var self = this;

        return Q.when(this.pass(request),
            function(result) {

                // give ViewResponses the ability to render themselves
                if (result && result instanceof ViewResponse) {
                    result.setRenderer(self);
                    return result;
                }

                // intercept Views and replace with Responses
                if (result && result instanceof View) {
//
//                    if (!self.vr.getTemplate(result.name)) {
//                        throw new Error('no template found for view "' + result.name + '"');
//                    }

                    // create a response that can render the view
                    return new ViewResponse(result).setRenderer(self);
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
     *
     * @return string
     */
    render: function(view) {

        // fall back on the error template, if available
//        if (!template) {
//            return this.render(
//                new View('error', {
//                    error: new Error('no template found for view "' + view.name + '"')
//                }));
//        }

        var result;

        try {
            result = this.vr.render(view);
        }
        catch (err) {
            if (this.vr.getTemplate('error')) {
                err.code = 500;
                result = this.vr.render(new capsela.View('error', {error: err}));
            }
            else {
                throw err;
            }
        }

        var layout = this.vr.getTemplate('layout');

        if (layout) {
            result = layout.render({view: result});
        }

        // if we have a resolver, use it to resolve any references
        return this.vr.resolveReferences(result);
    }
});

exports.Renderer = Renderer;

var View = require('../View').View;
var ViewResponse = require('../ViewResponse').ViewResponse;