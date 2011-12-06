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
 * Date: 11/1/11
 */

"use strict";

var fs = require('fs');
var path = require('path');

var capsela = require('capsela');
var Browser = capsela.Browser;
var HttpClient = capsela.HttpClient;
var Request = capsela.Request;
var ClientResponse = capsela.ClientResponse;
var Q = require('qq');
var BufferUtils = require('capsela-util').BufferUtils;
var Pipe = require('capsela-util').Pipe;
var Pipe = require('capsela-util').Pipe;
var Cookie = capsela.Cookie;

var UnitBrowser = Browser.extend({
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param stage the stage under test
     */
    init: function(stage) {
        this.stage = stage;
        this._super();
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Processes the given request and returns a promise for a response.
     *
     * @param request
     *
     * @return promise
     */
    clientDispatch: function(hostname, request) {
        
        // you know we need this
        request.headers.host = hostname;

        // slap a pipe on that bad boy
        request.bodyStream = new Pipe();

        // do any required preparation
        if (this.prepRequest) {
            this.prepRequest(request);
        }

        console.log('unit browser: ' + request.method + ' ' +
            (request.secure ? 'https://' : 'http://') + hostname + request.path);
        
        return Q.when(this.stage.service(request),
            function(response) {

                if (!response) {
                    throw new Error("stage didn't return a response");
                }

                // dress the server response up as a client response
                // this gives us easy direct access to the server response
                // alternatively, we could create a real ClientResponse
                // and stash the server response on it
                
                var bodyStream = new Pipe();

                response.getBodyStream = function() {
                    return bodyStream;
                }

                bodyStream.pause();

                // write the response body
                response.writeBody(bodyStream);

                return response;
            }
        );
    }
});

exports.UnitBrowser = UnitBrowser;