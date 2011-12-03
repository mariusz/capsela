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
 * Date: 8/5/11
 */

"use strict";

var Class = require('capsela-util').Class;
var Q = require('qq');

var http = require('http');
var https = require('https');
var parseUrl = require('url').parse;

var HttpClient = Class.extend({

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new HttpClient from the given FULL URL (i.e. starts with
     * the protocol, not just path + querystring)
     *
     * @param url
     */
    createFromUrl: function(url) {

        var bits = parseUrl(url);
        
        return new HttpClient(bits.hostname, bits.port, bits.protocol == 'https:');
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Fetches the resource at the given URL, returning a promise for a response.
     *
     * @param url
     */
    get: function(url) {

        var client = HttpClient.createFromUrl(url);
        var request = new Request('GET', url);

        var result = client.dispatch(request, function(err) {

            if (err) {
                result.reject(err);
                return;
            }
        });

        request.bodyStream.end();

        return result;
    }
},
{
    ////////////////////////////////////////////////////////////////////////////
    /**
     * Creates an HttpClient with the specified connection info.
     * 
     * @param hostname
     * @param port
     * @param secure
     */
    init: function(hostname, port, secure) {
        this.hostname = hostname;
        this.port = port;
        this.client = secure ? https : http;
    },
    
    ////////////////////////////////////////////////////////////////////////////
    /**
     * Dispatches the given request, returning a promise for a client response.
     * 
     * @param request
     *
     * @return promise
     */
    dispatch: function(request) {

        var options = {
            host: this.hostname,
            path: request.url,
            method: request.method,
            headers: request.getHeaders()
        };

        if (this.port) {
            options.port = this.port;
        }

        // if a TLS-PSK identity and key are specified, include them in the
        // options, which will be passed down to the TLS connection layer
        if (request.getPskId()) {
            options.pskIdentity = request.getPskId();
            options.pskKey = request.psk;
        }
        
        var result = Q.defer();
        
        var clientRequest = this.client.request(options, function(res) {
            
            // pause the stream so we don't miss anything
            res.pause();

            // create a client response with the given bodystream
            var response = new ClientResponse(res.statusCode, res.headers, res);

            result.resolve(response);
        });

        // todo this is sketchy - we should probably pipe instead of this replace
        request.bodyStream = clientRequest;

//        clientRequest.setTimeout(5000, function() {
//            clientRequest.socket.destroy();
//            cb(new Error("connection timed out"));
//        });

        clientRequest.on('error', function(err) {
            result.reject(err);
        });

        return result.promise;
    }
});

exports.HttpClient = HttpClient;

var Request = require('capsela').Request;
var ClientResponse = require('./ClientResponse').ClientResponse;
var BufferUtils = require('capsela-util').BufferUtils;