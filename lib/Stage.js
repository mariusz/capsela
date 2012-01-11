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
 * Date: 10/28/11
 */

"use strict";

var Class = require('capsela-util').Class;
var Logger = require('capsela-util').Logger;

var Stage = Class.extend({
        
    mixin: Logger
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new processing stage from the given function.
     *
     * @param handler   function(request) that returns a response or a promise
     */
    init: function(handler) {
        this.handler = handler;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a promise resolved when this stage is ready.
     *
     * @return promise
     */
    isReady: function() {
        return true;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Services the given request, returning a promise for a response.
     *
     * @param request
     *
     * @return promise  a promise for a Response
     */
    service: function(request) {
        return this.handler(request);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Passes the request to the next stage, if one exists.
     * 
     * @param request
     *
     * @return promise  promise for a response
     */
    pass: function(request) {

        if (this.next) {
            return this.next.service(request);
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Adds a post-processing stage to this stage.
     * 
     * @param stage
     *
     * @return stage    the stage that was just added
     */
    setNext: function(stage) {

        this.next = (typeof stage == 'function' ? new Stage(stage) : stage);

        // add the new stage to our resolver pool
        if (typeof this.next.setResolver == 'function') {
            this.next.setResolver(this.resolver);
        }

        // echo the stage's log events
        this.echo(this.next);

        return this.next;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Adds the given stage to the end of the list.
     *
     * @param stage
     */
    addStage: function(stage) {

        // find the last stage
        var last = this;

        while (last.next) {
            last = last.next;
        }

        last.setNext(stage);

        return this;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Gives this stage a resolver registry with which it can register itself
     * and/or resolve references as needed.
     *
     * @param reg  a Resolver
     */
    setResolver: function(reg) {
        this.resolver = reg;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Attaches the given resolver to the shared resolver.
     * 
     * @param type
     * @param resolver
     */
    addResolver: function(type, resolver) {

        this.resolver.register(type, resolver);
        
        return this;
    }
});

exports.Stage = Stage;

var Response = require('./Response').Response;