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
 * Wraps a ViewRenderer in a Stage that intercepts ViewResponses
 * and injects the ViewRenderer into them so they can use it to
 * render themselves.
 */

var capsela = require('capsela');
var Q = require('qq');

var ViewRenderer = capsela.Stage.extend({
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
            this.ready = this.vr.loadViews(dir, type);
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
     * @param view
     */
    addView: function(name, view) {
        this.vr.addView(name, view);
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

                if (result && result instanceof ViewResponse) {
                    result.setRenderer(self);
                    return result;
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
     * @param model
     *
     * @return string
     */
    render: function(view, model) {

        var result;

        try {
            result = this.vr.render(view, model);
        }
        catch (err) {

            if (this.vr.getView('error')) {
                err.code = 500;
                result = this.vr.render('error', {error: err});
            }
            else {
                throw err;
            }
        }

        var layout = this.vr.getView('layout');

        if (layout) {
            result = layout.render({content: result});
        }

        // if we have a resolver, use it to resolve any references
        return this.vr.resolveReferences(result);
    }
});

exports.ViewRenderer = ViewRenderer;

var View = require('../View').View;
var ViewResponse = require('../ViewResponse').ViewResponse;