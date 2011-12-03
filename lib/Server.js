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

var Stage = require('./Stage').Stage;
var Log = require('capsela-util').Log;
var Logger = require('capsela-util').Logger;
var http = require('http');
var https = require('https');
var Q = require('qq');

var Server = Stage.extend({

    mixin: Logger
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates the server.
     *
     * @param port
     * @param options  TLS-related options
     */
    init: function(port, options) {

        if (!port) {
            throw new Error("can't create server without a port");
        }

        this.port = port;
        this.secure = (options && options.secure) || false;
        this.name = (options && options.name) || 'Capsela';

        var t = this;

        // create the server

        if (this.secure) {
            this.server = https.createServer(options, function (req, res) {
                t.handleRequest(req, res);
            });
        }
        else {
            this.server = http.createServer(function(req, res) {
                t.handleRequest(req, res);
            });
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Starts the server.
     */
    start: function(cb) {
        this.log(Log.INFO, "starting" + (this.secure ? " secure " : " insecure ") + "server on port " + this.port);
        this.server.listen(this.port, null, cb);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Stops the server.
     */
    stop: function(cb) {
        this.log(Log.INFO, "stopping" + (this.secure ? " secure " : " insecure ") + "server on port " + this.port);
        this.server.once('close', cb);
        this.server.close();
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     *
     * @param req
     * @param res
     */
    handleRequest: function(req, res) {

        var t = this;

        // create a request object from the node request
        var request = new Request(
            req.method,
            req.url,
            req.headers,
            req,
            this.secure,
            req.connection && req.connection.pskIdentity);

        Q.when(this.process(request),
            function(response) {

                // if no stage returned a response, return a 404
                return response || new ErrorResponse(new Error("no stage provided a response"), 404);
            },
            function(err) {

                // if there was a processing error, return a 500
                return new ErrorResponse(err, 500);
            }
        ).then(
            function(response) {
                
                var headers = response.getHeaders();

                // add a couple global headers

                headers['Date'] = new Date(Date.now()).toUTCString();
                headers['Server'] = t.name;

                // render the response into the node response
                // write the headers first, then the body itself

                // unpause the request stream in case it hasn't been already
                // todo i think destroying the stream is actually what we want, here
                request.bodyStream.resume();

                // write the response head
                res.writeHead(response.statusCode, headers);

                // write the response body
                response.writeBody(res);

                // log the request/response
                var logFields = [
                        req.headers.host ? req.headers.host : '-',
                        req.method.toUpperCase(),
                        req.url,
                        'HTTP/' + req.httpVersion,
                        response.statusCode,
                        request.getElapsedTime()
                    ];

                t.log(Log.INFO, logFields.join(' '));

                if (response.error) {
                    t.log(Log.ERROR, response.error.stack);
                }
            }
        ).end();
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param request
     */
    process: function(request) {

        try {
            return this.pass(request);
        }
        catch(err) {
            return Q.reject(err);
        }
    }
});

exports.Server = Server;

var Request = require('./Request').Request;
var Response = require('./Response').Response;
var ErrorResponse = require('./ErrorResponse').ErrorResponse;