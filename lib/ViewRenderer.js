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
var fs = require('q-fs');
var Q = require('qq');
var pathUtils = require('path');

var ViewRenderer = Class.extend({
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     *
     * @param templates optional map of view names to Templates
     */
    init: function(templates) {
        this.templates = templates || {};
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Registers the template for the specified view.
     *
     * @param view  the name of the view
     */
    getTemplate: function(view) {
        return this.templates[view];
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Registers a template to use for rendering the specified view.
     *
     * @param name
     * @param template
     */
    addTemplate: function(name, template) {
        this.templates[name] = template;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Adds the given templates.
     *
     * @param templates an map of view names to template objects
     */
    addTemplates: function(templates) {

        for (var name in templates) {
            this.templates[name] = templates[name];
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Loads all files in the given directory into template objects of the
     * specified type.
     *
     * @param dir   directory path
     * @param type  a template constructor
     *
     * @return promise  completion promise
     */
    loadTemplates: function(dir, type) {

        var self = this;

        if (!dir) {
            throw new Error("can't load templates without directory");
        }
        
        if (!type) {
            throw new Error("can't load templates without constructor");
        }

        return fs.listTree(dir).then(
            function(children) {

                var pending = [];

                children.forEach(function(path) {

                    pending.push(fs.stat(path).then(
                        function(stats) {
                            if (stats.isFile()) {
                                var name = pathUtils.basename(path).split('.')[0];

                                console.log('loading template ' + pathUtils.basename(path));
                                return fs.read(path).then(
                                    function(data) {
                                        self.addTemplate(name, new type(data.toString()));
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
     * Recursively renders the given View and returns the result.
     *
     * @param view
     *
     * @return string
     */
    render: function(view) {

        var template = this.templates[view.name];

        if (!template) {
            throw new Error('no template for view "' + view.name + '"');
        }
        
        // render any nested views

        var params = {};
        var key, value;

        for (key in view.params) {

            value = view.params[key];

            if (value instanceof View) {
                params[key] = this.render(value);
            }
            else {
                params[key] = value;
            }
        }

        var result = template.render(params);

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