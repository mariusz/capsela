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
 * Date: 1/6/12
 */

"use strict";

var capsela = require('capsela');
var Q = require('qq');

var PreferredHost = capsela.Stage.extend({

},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param host      the preferred hostname:port
     * @param protocol  if unspecified, will use the protocol of the request
     */
    init: function(host, protocol) {

        this.protocol = protocol;
        this.host = host.toLowerCase();
        this.baseUrl = (protocol || 'http') + '://' + this.host;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Catches exceptions and transmutes them into HTML responses.
     *
     * @param request
     */
    service: function(request) {

        // make sure the host is the preferred host
        var host = request.getHeader('host');
        var protocol = this.protocol || request.protocol;

        if (host.toLowerCase() != this.host) {
            return new capsela.Redirect(protocol + '://' + this.host + '/');
        }

        return this.pass(request);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     *
     */
    setResolver: function(resolver) {

        var t = this;
        this._super(resolver);

        resolver.register('absolute_url',
            function(type, link, r) {
                return r.resolveReferences(t.baseUrl + link);
            });
    }
});

exports.PreferredHost = PreferredHost;