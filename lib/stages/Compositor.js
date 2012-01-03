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
 * Wraps a View in a template to generate a full HTML document response.
 *
 * We could perhaps provide a way for CSS fragments to be included in views
 * and rendered into a <style> tag by the compositor.
 */

var Stage = require('capsela').Stage;
var Q = require('qq');

var Compositor = Stage.extend({

},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * @param template  the JSON template to use for wrapping views
     */
    init: function(template) {
        this.template = template;
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

                // intercept Views
                if (result && result instanceof View) {

                    var env = result.getEnv();

                    if (env.complete) {
                        return new ViewResponse(result);
                    }

                    return new ViewResponse(
                        new View(t.template, {
                            view: result.render(),
                            title: env.title
                        }, result.urlFactory));
                }

                // pass through others unmolested
                return result;
            });
    }
});

exports.Compositor = Compositor;

var View = require('../View').View;
var ViewResponse = require('../ViewResponse').ViewResponse;