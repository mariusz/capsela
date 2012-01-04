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
 * Author: Chris Osborn
 * Date: 5/4/11
 */

"use strict";

var Class = require('capsela-util').Class;
var crypto = require('crypto');

var EventEmitter = require('events').EventEmitter;

var Session = Class.extend({

    mixin: [ EventEmitter ],

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a new session key generated with the usual lame algorithm. I'd
     * rather pull the keys from /dev/urandom or a crypto PRNG; Math.random()
     * is usually pretty weak.
     */
    makeId: function() {
        var hash = crypto.createHash('md5');
        hash.update(process.pid + '.' + Date.now() + Math.random());
        return hash.digest('hex');
    }
},
{
    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     */
    init: function() {
        this.id = this.Class.makeId();
        this.mTime = Date.now();
        this.ended = false;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Initializes a new session.
     *
     * @param request   optional request for which this session is being initialized
     */
    initialize: function(request) {
        // does nothing for now; in future may want to record client IP, etc.
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @return string
     */
    getId: function() {
        return this.id;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the time at which the session was last accessed.
     */
    getLastSaveTime: function() {
        return this.mTime;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Updates the session mtime.
     */
    touch: function() {
        this.mTime = Date.now();
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns true if the session has been ended.
     */
    isEnded: function() {
        return this.ended;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Ends the session.
     */
    end: function() {
        this.ended = true;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns true if this session is still valid (not expired).
     *
     * @param timeout   session timeout in seconds
     */
    stillValid: function(timeout) {

        if (this.ended) {
            return false;
        }

        return Date.now() < (this.getLastSaveTime() + (timeout * 1000));
    }
});

exports.Session = Session;