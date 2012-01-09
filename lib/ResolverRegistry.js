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
 * Date: 12/22/11
 */

"use strict";

/**
 * A Resolver is just an object that implements resolve(type, ref)
 */

var Class = require('capsela-util').Class;

var ResolverRegistry = Class.extend({

},
{
    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     */
    init: function() {
        this.resolvers = {};
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Registers the given resolver as a handler for the given ref type.
     *
     * @param type      a reference type (namespace ID)
     * @param resolver  a resolver object or a function
     */
    register: function(type, resolver) {
        this.resolvers[type] = typeof resolver == 'function' ?
            {resolve: resolver} : resolver;
    },
    
    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param type
     * @param ref
     */
    resolve: function(type, ref) {

        var resolver = this.resolvers[type];

        if (!resolver) {
            return undefined;
        }

        return resolver.resolve(type, ref);
    }
});

exports.ResolverRegistry = ResolverRegistry;