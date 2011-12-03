/**
 * Copyright (c) 2011 Sitelier Inc.
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
 * Date: 8/10/11
 */


"use strict";

/**
 * implements RFC 6265
 */

var Class = require('capsela-util').Class;

// todo Request.getCookies
// Response.setCookie(attrs)
// Response.unsetCookie(attrs)

// todo quote values containing spaces?

var Cookie = Class.extend({

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a hash of the cookies included in the given request.
     *
     * @param request
     */
    getCookies: function(request) {

        var header = request.getHeader('cookie');
        var cookies = {};

        if (header) {
            var params = header.split(/\s*[;,]\s*/);

            for (var i in params) {
                if (params.hasOwnProperty(i) && params[i]) {
                    var parts = params[i].split('=');
                    cookies[parts[0].toLowerCase()] = parts[1] || true;
                }
            }
        }

        return cookies;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a cookie parsed from the given set-cookie header.
     *
     * @param header
     */
    fromString: function(header) {

        var pairs = header.split(/\s*;\s*/);
        var params = {};

        // the first part is the name=value pair
        pairs.forEach(function(part, index) {

            var pair = part.split('=');
            var name = pair[0];
            var value = pair[1];

            if (index == 0) {
                params.name = name;
                params.value = value;
            }
            else {
                params[name.toLowerCase()] = value || true;
            }
        });

        return new Cookie(
            params.name,
            params.value,
            params.expires && new Date(params.expires),
            params['max-age'] && +params['max-age'],
            params.domain,
            params.path,
            params.secure,
            params.httponly);
    }
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new cookie with the given attributes.
     *
     * @param name
     * @param value
     * @param expires   Date
     * @param maxAge    max lifetime in seconds
     * @param domain
     * @param path
     * @param secure
     * @param httpOnly
     */
    init: function(name, value, expires, maxAge, domain, path, secure, httpOnly) {
        this.name = name;
        this.value = value;
        this.expires = expires;
        this.maxAge = maxAge;
        this.domain = domain;
        this.path = path;
        this.secure = secure;
        this.httpOnly = httpOnly;
    },

    ///////////////////////////////////////////////////////////////////////////////
    
    getName: function() {
        return this.name;
    },

    ///////////////////////////////////////////////////////////////////////////////

    getValue: function() {
        return this.value;
    },

    ///////////////////////////////////////////////////////////////////////////////

    getExpires: function() {
        return this.expires;
    },

    ///////////////////////////////////////////////////////////////////////////////

    getMaxAge: function() {
        return this.maxAge;
    },

    ///////////////////////////////////////////////////////////////////////////////

    getDomain: function() {
        return this.domain;
    },

    ///////////////////////////////////////////////////////////////////////////////

    getPath: function() {
        return this.path;
    },

    ///////////////////////////////////////////////////////////////////////////////

    isSecure: function() {
        return this.secure;
    },

    ///////////////////////////////////////////////////////////////////////////////

    isHttpOnly: function() {
        return this.httpOnly;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Sets this cookie in the given response.
     * 
     * @param response
     */
    setIn: function(response) {
        response.setHeader('Set-Cookie', this.toString());
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Unsets this cookie in the given response (should be deleted on the client).
     *
     * @param response
     */
    unsetIn: function(response) {

        // clobber the value
        this.value = 'aloha';

        // set the expires to a time in the past
        this.expires = new Date(19800222);
        
        this.setIn(response);
    },

    ///////////////////////////////////////////////////////////////////////////////

    toString: function() {

        var parts = [this.name + '=' + this.value];

        if (this.expires) {
            parts.push('Expires=' + this.expires.toUTCString());
        }

        if (this.maxAge) {
            parts.push('Max-Age=' + this.maxAge);
        }

        if (this.domain) {
            parts.push('Domain=' + this.domain);
        }
        
        if (this.path) {
            parts.push('Path=' + this.path);
        }

        if (this.secure) {
            parts.push('Secure');
        }

        if (this.httpOnly) {
            parts.push('HttpOnly');
        }

        return parts.join('; ');
    }
});

exports.Cookie = Cookie;