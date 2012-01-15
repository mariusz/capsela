/*!
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
var http = require('http');
var https = require('https');
var Q = require('qq');

var Server = Stage.extend(
/** @lends Server */ {
},
/** @lends Server# */ {
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * @constructs
     * @extends Stage
     * @param port
     * @param options  TLS-related options
     */
    init: function(port, options) {

        this.port = port || 80;
        this.secure = (options && options.secure) || false;
        this.name = (options && options.name) || 'Capsela';

        var t = this;

        // create the server

        if (this.secure) {
            this.protocol = 'https';
            this.server = https.createServer(options, function (req, res) {
                t.handleRequest(req, res);
            });
        }
        else {
            this.protocol = 'http';
            this.server = http.createServer(function(req, res) {
                t.handleRequest(req, res);
            });
        }

        // create a new resolver registry for this server
        this.setResolver(new capsela.Resolver());
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a promise that's resolved when all stages are ready.
     *
     * @return promise
     */
    isReady: function() {

        // collect the ready promises of all stages, including this one
        var ready = [];
        var curStage = this;

        while (curStage.next) {
            curStage = curStage.next;
            ready.push(curStage.isReady());
        }

        return Q.all(ready);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Starts the server once all stages are ready to go.
     *
     * @return promise
     */
    start: function() {

        var t = this;

        return Q.when(this.isReady(),
            function() {
                var d = Q.defer();

                t.server.listen(t.port, null, function() {
                    t.log(Log.INFO, (t.secure ? "https " : "http ") + "server listening on port " + t.port);
                    d.resolve();
                });

                return d.promise;
            }
        );
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Stops the server.
     *
     * @return promise
     */
    stop: function() {

        var d = Q.defer();

        this.log(Log.INFO, "stopping" + (this.secure ? " secure " : " insecure ") + "server on port " + this.port);
        this.server.once('close', function() {
            d.resolve();
        });
        this.server.close();

        return d.promise;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Turns a Node request into a Capsela Request, hand it off to the pipeline
     * for servicing, then renders the resulting Response into the Node response.
     *
     * @param req
     * @param res
     */
    handleRequest: function(req, res) {

        var t = this;

        // create a request object from the node request
        var request = new capsela.Request(
            req.method,
            req.url,
            req.headers,
            req, // the body stream
            this.protocol,
            req.connection && req.connection.pskIdentity);

        this.echo(request);

        Q.when(this.service(request),
            function(response) {

                // if no stage returned a response, return a 404
                if (!response) {
                    return new capsela.Response(404, {}, "no stage provided a response");
                }
                else if (response instanceof capsela.Response) {
                    return response;
                }

                return new capsela.Response(500, {}, "stages produced an invalid response");
            },
            function(err) {

                // if there was a processing error, return a 500
                return new capsela.Response(500, {}, err.message);
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

                var sendBody = true;

                // see if the agent is validating its cache with mtime
                var checkTime = request.getHeader('if-modified-since');
                var checkTag = request.getHeader('if-none-match');
                var mtime = response.getLastModified();

                // compare with 1s resolution - not ms
                if (checkTime && mtime && Math.floor(mtime.getTime()/1000) <= Date.parse(checkTime)/1000) {
                    response.statusCode = 304; // might want to futz with headers as well
                    sendBody = false;
                }
//                else if (checkTag && checkTag != response.getTag()) {
//                    response.statusCode = 304; // might want to futz with headers as well
//                    sendBody = false;
//                }

                // write the response head
                res.writeHead(response.statusCode, headers);

                if (sendBody) {
                    // send the response body
                    response.sendBody(res);
                }
                else {
                    // always need to end the stream
                    res.end();
                }

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
            }
        ).end();
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     *
     * @param request
     */
    service: function(request) {

        try {
            return this.pass(request);
        }
        catch(err) {
            return Q.reject(err);
        }
    }
});

exports.Server = Server;

var capsela = require('capsela');