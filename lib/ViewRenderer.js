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
 * Date: 1/9/12
 */

"use strict";

var Class = require('capsela-util').Class
var Logger = require('capsela-util').Logger;
var Log = require('capsela-util').Log;
var fs = require('q-fs');
var Q = require('qq');
var pathUtils = require('path');

var ViewRenderer = Class.extend({
        
    mixin: Logger
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     *
     * @param views optional map of view objects
     */
    init: function(views) {
        this.views = views || {};
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the view having the specified name.
     *
     * @param view  the name of the view
     */
    getView: function(name) {
        return this.views[name];
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Registers a view with the specified name.
     *
     * @param name
     * @param view
     */
    addView: function(name, view) {
        this.views[name] = view;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Adds the given views.
     *
     * @param views an map of view names to template objects
     */
    addViews: function(views) {

        for (var name in views) {
            this.views[name] = views[name];
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Loads all files in the given directory into view objects of the
     * specified type.
     *
     * @param dir   directory path
     * @param type  a view class constructor
     *
     * @return promise  completion promise
     */
    loadViews: function(dir, type) {

        var self = this;

        if (!dir) {
            throw new Error("can't load views without directory");
        }
        
        if (!type) {
            throw new Error("can't load views without constructor");
        }

        return fs.listTree(dir).then(
            function(children) {

                var pending = [];

                children.forEach(function(path) {

                    pending.push(fs.stat(path).then(
                        function(stats) {
                            if (stats.isFile()) {
                                var name = pathUtils.basename(path).split('.')[0];

                                self.log(Log.DEBUG, 'loading view ' + pathUtils.basename(path));
                                return fs.read(path).then(
                                    function(data) {
                                        self.addView(name, new type(data.toString()));
                                    }
                                )
                            }
                        }
                    ));
                });

                return Q.all(pending);
            }
        );
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Sets the resolver to use for resolving embedded references.
     *
     * @param resolver
     */
    setResolver: function(resolver) {
        this.resolver = resolver;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Renders the specified view with the given model, resolves references if
     * possible, and returns the result.
     *
     * @param name      a View object or the name of the view to render
     * @param model     the model for the view
     *
     * @return string
     */
    render: function(view, model) {

        var v = typeof view == 'string' ? this.views[view] : view;

        if (!v) {
            throw new Error('view "' + view + '" not found');
        }

        var result = v.render(model);

        // if we have a resolver, use it to resolve any references
        return this.resolver ? this.resolveReferences(result) : result;
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

        var resolver = this.resolver;

        if (!resolver) {
            return str;
        }

        var re = /ref:([A-Za-z0-9][A-Za-z0-9_-]+):([^\\"&<>\[\]^`{|}~]+)/g;

        return str.replace(re,
            function(match, namespace, nss) {
                return resolver.resolve(namespace, nss);
            });
    }
});

exports.ViewRenderer = ViewRenderer;

var View = require('./View').View;