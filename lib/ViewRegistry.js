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

var ViewRegistry = Class.extend({
        
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
     * Recursively renders the given/named view and its parent(s) and returns
     * the result.
     *
     * @param name      a View object or the name of the view to render
     * @param model     the model for the view
     * @param layout    the default parent view
     *
     * @return string
     */
    render: function(view, model, layout) {

        // look up the view in the registry, if necessary
        var v = typeof view == 'string' ? this.views[view] : view;

        if (!v) {
            throw new Error('view "' + view + '" not found');
        }

        var result = v.render(model);

        if (v.isComplete()) {
            return result;
        }

        // see if the view has a parent, and render that, too
        var parent = v.getParent() || layout;

        if (parent) {
            return this.render(parent, {
                content: result,
                child: model
            });
        }

        return result;
    }
});

exports.ViewRegistry = ViewRegistry;

var View = require('./View').View;