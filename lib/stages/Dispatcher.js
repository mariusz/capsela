/**
 * Copyright (C) 2011 Sitelier Inc.
 * All rights reserved.
 *
 * Author: Seth Purcell
 * Date: 12/9/11
 */

"use strict";

/**
 * do view rendering here rather than in separate compositor??
 */

var capsela = require('capsela');
var fs = require('q-fs');
var Q = require('qq');

var Dispatcher = capsela.Stage.extend({

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the given string converted from camel-case to URL style with hyphens.
     * 
     * @param name
     */
    hyphenize: function(name) {

        // replace xY with x-y
        var s = name.replace(/([a-z])([A-Z])/g, function(match, s1, s2) {
            return s1 + '-' + s2.toLowerCase();
        });

        return s.toLowerCase();
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the given string converted from URL style with hyphens to camel-case.
     *
     * @param name
     */
    dehyphenize: function(name) {

        // replace x-y with xY
        return name.toLowerCase().replace(/(\w)-(\w)/g, function(match, s1, s2) {
            return s1.toLowerCase() + s2.toUpperCase();
        });
    }
},
{
    ////////////////////////////////////////////////////////////////////////////
    /**
     * @param baseUrl   the base URL to use when generating links
     * @param config    optional config object, accessible by controllers
     */
    init: function(baseUrl, config) {
        
        this.baseUrl = baseUrl;
        this.config = config;
        this.cByRoute = {};
        this.cByName = {};
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     */
    getConfig: function() {
        return this.config;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     *
     * @param baseDir   directory where controller dirs can be found
     */
    setUp: function(baseDir) {

        var t = this;

        // go through all dirs looking for controllers
        return fs.list(baseDir).then(
            function(children) {

                children.forEach(function(name) {
                    t.loadController(baseDir, name);
                });
            }
        );
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Loads the controller in the specified directory and installs it.
     * 
     * @param baseDir
     * @param name
     */
    loadController: function(baseDir, name) {

        // load the controller
        console.log('loading controller ' + name);

        var homeDir = baseDir + '/' + name;
        var cls = require(homeDir + '/Controller').Controller;
        
        this.addController(new cls(), name, homeDir);
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Adds the given Controller to this dispatcher.
     * 
     * @param c
     * @param name
     * @param homeDir
     */
    addController: function(c, name, homeDir) {

        // have setters on controller instead?
        c.name = name;
        c.dispatcher = this;
        c.homeDir = homeDir;

        if (name == 'default') {
            c.mountPoint = '';
        }
        else {
            c.mountPoint = this.Class.hyphenize(name);
        }

        this.cByRoute[c.mountPoint] = c;
        this.cByName[c.name] = c;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a relative URL (but an absolute path) for hitting the specified
     * controller action with the given params.
     *
     * @param controller
     * @param action
     * @param params
     * @param isLeaf      set to true if the target resource can not have children (otherwise appends slash)
     */
    getLink: function(controller, action, params, isLeaf) {

        var parts = [];
        var c;

        if (controller != 'default') {
            c = this.cByName[controller];

            if (!c) {
                throw new Error("controller '" + controller + "' not found");
            }

            parts.push(c.mountPoint);
        }

        if (action != 'default') {
            parts.push(this.Class.hyphenize(action));
        }

        for(var key in params) {
            parts.push(key);

            if (params[key] != null) {
                parts.push(params[key]);
            }
        }

        return '/' + parts.join('/') + (isLeaf ? '' : (parts.length ? '/' : ''));
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns an absolute URL  for hitting the specified
     * controller action with the given params.
     * 
     * @param controller
     * @param action
     * @param params
     * @param leaf      set to true if the target resource can not have children (otherwise appends slash)
     */
    getUrl: function(controller, action, params, leaf) {

        return this.baseUrl + this.getLink(controller, action, params, leaf);
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Dispatches the request to the appropriate controller action or falls through
     * if none found.
     * 
     * @param request
     *
     * @return response
     */
    service: function(request) {

        var t = this;
        var parts = request.path.split('/');

        parts.shift(); // always has a leading slash

        var controller = this.cByRoute[parts[0]];

        if (controller) {
            parts.shift();
        }
        else {
            controller = this.cByName['default'];
        }

        if (controller) {

            var methodName = parts[0] && this.Class.dehyphenize(parts[0]) + 'Action'
            var method = methodName && controller[methodName];
            var params = {};

            if (typeof method == 'function') {
                parts.shift();
            }
            else {
                method = controller['defaultAction'];
            }
            
            if (method) {

                // split remainder of path into key/value pairs
                var i = 0;
                while(i < parts.length) {
                    params[parts[i]] = parts[i+1] || '';
                    i += 2;
                }

                request.params = params;

                return Q.when(method.apply(controller, [request]),
                    function(result) {

                        if (result instanceof capsela.View) {
                            result.urlFactory = t;
                        }

                        return result;
                    });
            }
        }

        // fall through
        return this.pass(request);
    }
});

exports.Dispatcher = Dispatcher;