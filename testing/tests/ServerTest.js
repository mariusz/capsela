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
 * Date: Feb 15, 2011
 */

"use strict";

var testbench = require('../TestBench');
var testCase = require('nodeunit').testCase;

var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var StreamUtil = require('capsela-util').StreamUtil;

var capsela = require('capsela');
var Server = capsela.Server;
var Response = capsela.Response;
var Form = capsela.Form;
var Request = capsela.Request;
var Log = require('capsela-util').Log;
var Q = require('qq');

var mocks = require('capsela').mocks;

var MonkeyPatcher = require('capsela-util').MonkeyPatcher;

var mp = new MonkeyPatcher();
var log;

module.exports["conditional get"] = testCase({

    "test validate mtime 304": function(test) {

        var mtime = new Date(72145);

        var req = new mocks.Request('GET', '/something', {
            'If-Modified-Since': mtime.toUTCString()
        });
        var res = new mocks.Response();

        var server = new Server();

        server.setNext(
            function(request) {
                var r = new Response();
                r.enableCaching(mtime);
                return r;
            });

        server.handleRequest(req, res);
        
        // hitting a null inner stage results in a 404
        res.on('end', function() {
            test.equal(304, res.statusCode);
            test.done();
        });
    },

    "test validate mtime 200": function(test) {

        var mtime = new Date(72185);

        var req = new mocks.Request('GET', '/something', {
            'If-Modified-Since': mtime.toUTCString()
        });
        var res = new mocks.Response();

        var server = new Server();

        server.setNext(
            function(request) {
                var r = new Response();
                r.enableCaching(new Date(73248)); // needs to be > in second resolution
                return r;
            });

        server.handleRequest(req, res);

        // hitting a null inner stage results in a 404
        res.on('end', function() {
            test.equal(200, res.statusCode);
            test.done();
        });
    }
});

module.exports["construct/start"] = testCase({

    setUp: function(cb) {
        log = new Log();
        cb();
    },

    tearDown: function(cb) {
        mp.tearDown();
        cb();
    },

    "test logging": function(test) {

        var now = Date.now();
        var logged = 0;

        mp.patch(Date, 'now', function() {
            return now;
        });

        test.expect(2);

        var server = new Server();

        server.setNext(
            function(request) {
                now += 88;
                return new Response(202);
            });

        server.on('log', function(priority, message) {

            test.equal(priority, Log.INFO);
            test.equal(message, '- GET / HTTP/1.1 202 88');
            test.done();
        });

        var req = new mocks.Request();
        var res = new mocks.Response();

        server.handleRequest(req, res);
    },

    "test start fails on stage error": function(test) {

        var server = new Server();
        var stage = new capsela.Stage();

        server.addStage(stage);

        stage.isReady = function() {
            return Q.reject("oh dear");
        }

        server.start().then(
            null,
            function(reason) {
                test.equal(reason, "oh dear");
                test.done();
            }
        );
    },

    "test isReady": function(test) {

        var server = new Server();

        var d = [
            Q.defer(),
            Q.defer(),
            Q.defer()
        ];

        var ready = false;

        var p = d.map(function(def) {
            return def.promise.then(
                function() {
                    test.ok(ready == false);
                }
            );
        });

        var stage1 = new capsela.Stage();
        
        stage1.isReady = function() {
            return p[1];
        };

        var stage2 = new capsela.Stage();

        stage2.isReady = function() {
            return p[2];
        };

        server.addStage(stage1);
        server.addStage(stage2);

        server.isReady().then(function() {
            ready = true;
            test.done();
        }).end();

        setTimeout(function() {
            d[0].resolve();
        }, 10);

        setTimeout(function() {
            d[1].resolve();
        }, 20);

        setTimeout(function() {
            d[2].resolve();
        }, 4);
    },

    "test start calls isReady": function(test) {

        test.expect(3);

        // mock http

        var fakeServer = {

            listen: function(port, host, cb) {
                test.equals(port, 80);
                test.ok(host == null);

                if (cb) {
                    process.nextTick(cb);
                }
            }
        };

        mp.patch(http, 'createServer', function(options, cb) {
            fakeServer.onRequest = cb;
            return fakeServer;
        });

        var server = new Server();

        server.isReady = function() {
            test.ok(true);
            return Q.ref();
        };

        server.start().then(function() {
            test.done();
        }).end();
    },

    "test construct/start secure": function(test) {

        test.expect(4);

        var fakeServer = {

            listen: function(port, host, cb) {
                test.equals(port, 443);
                test.ok(host == null);

                if (cb) {
                    process.nextTick(cb);
                }
            }
        };

        // mock http

        mp.patch(https, 'createServer', function(options, cb) {
            fakeServer.onRequest = cb;
            return fakeServer;
        });

        var req = new mocks.Request();
        var res = new mocks.Response();

        // hitting a null inner stage results in a 404
        res.on('end', function() {
            test.equal(404, res.statusCode);
            test.done();
        });

        var server = new Server(443, {secure: true});

        server.addStage(function(request) {
            test.ok(request.isSecure());
        });

        server.start().then(function() {
            fakeServer.onRequest(req, res);
        }).end();
    },

    "test construct/start secure with TLS-PSK connection": function(test) {

        test.expect(6);

        var fakeServer = {

            listen: function(port, host, cb) {
                test.equals(port, 443);
                test.ok(host == null);

                if (cb) {
                    process.nextTick(cb);
                }
            }
        };

        var pskCallback = function(pskId) {
            return 'pre-shared-key';
        };

        // mock http

        mp.patch(https, 'createServer', function(options, cb) {
            // the psk callback should be passed through to the node server
            test.equal(options.pskCallback, pskCallback);
            fakeServer.onRequest = cb;
            return fakeServer;
        });

        var serverOpts = {
            secure: true,
            pskCallback: pskCallback
        };

        var server = new Server(443, serverOpts);

        server.addStage(function(request) {
            test.ok(request.isSecure());
            // make sure the pskId was copied from the request's connection up to the request
            test.equal(request.getPskId(), 'pre-shared-key-id');
        });

        var req = new mocks.Request();
        var res = new mocks.Response();

        // Server will look for req.connection.pskIdentity
        req.connection = {
            pskIdentity: 'pre-shared-key-id'
        };

        // hitting a null inner layer results in a 404
        res.on('end', function() {
            test.equal(404, res.statusCode);
            test.done();
        });

        server.start().then(function() {
            fakeServer.onRequest(req, res);
        }).end();
    },

    "test construct/start insecure": function(test) {

        test.expect(4);

        var fakeServer = {

            listen: function(port, host, cb) {
                test.equals(port, 9001);
                test.ok(host == null);

                if (cb) {
                    process.nextTick(cb);
                }
            }
        };

        // mock http

        mp.patch(http, 'createServer', function(cb) {
            fakeServer.onRequest = cb;
            return fakeServer;
        });

        var server = new Server(9001);

        server.addStage(function(request) {
            test.ok(!request.isSecure());
        });

        var req = new mocks.Request();
        var res = new mocks.Response();

        // hitting a null inner layer results in a 404
        res.on('end', function() {
            test.equal(404, res.statusCode);
            test.done();
        });

        server.start().then(function() {
            fakeServer.onRequest(req, res);
        }).end();
    },

    "test stop": function(test) {

        test.expect(3);

        var fakeServer = {

            listen: function(port, host, cb) {
                test.ok(true);
                if (cb) {
                    process.nextTick(cb);
                }
            },

            close: function() {
                test.ok(true);
                if (this.onClose) {
                    process.nextTick(this.onClose);
                }
            },

            once: function(event, cb) {
                test.ok('listening for underlying server close event');
                this.onClose = cb;
            }
        };

        // mock http

        mp.patch(http, 'createServer', function(cb) {
            return fakeServer;
        });

        var server = new Server(9000);

        server.start().then(
            function() {
                return server.stop();
            }
        ).then(
            function() {
                test.done();
            }).end();
    }
});

// todo move these somewhere else?
module.exports["form processing"] = testCase({

    "test submit multipart form": function(test) {

        var expected = {
            adminName: 'Seth Purcell',
            adminLogin: 'spurcell',
            adminPassword: 'm',
            adminConfirm: 'm',
            publicHost: 'www.skstest.com',
            restrictedHost: 'skstest.sitelier.net',
            shellName: 'Sitelier Console',
            shellAddress: 'http://localhost:9000',
            shellFingerprint: '',
            submit: 'Create My Site'
        };

        var server = new Server(80);

        server.setNext(
            function(request) {
                return Form.createFromRequest(request).then(function(form) {
                    test.deepEqual(form.getFields(), expected);
                    test.equal(form.getFiles().adminImage.size, 0);
                });
            });

        var req = new mocks.Request('POST', '/yomama');

        req.headers = {
            'content-type': 'multipart/form-data; boundary=---------------------------23701554932345',
            'content-length': '1319'
        };

        var res = new mocks.Response();

        // hitting a null inner layer results in a 404
        res.on('end', function() {
            test.equal(404, res.statusCode);
            test.done();
        });

        server.handleRequest(req, res);

        req.write(fs.readFileSync(testbench.fixturesDir + '/form-data/fields_only.bin'));
        req.end();
    },

    "test form file upload": function(test) {

        // todo shouldn't this test be in Request or Form??

        test.expect(6);

        var fields = {
            adminName: 'Seth Purcell',
            adminLogin: 'spurcell',
            adminPassword: 'm',
            adminConfirm: 'm',
            publicHost: 'www.skstest.com',
            restrictedHost: 'skstest.sitelier.net',
            shellName: 'Sitelier Console',
            shellAddress: 'http://localhost:9000',
            shellFingerprint: '',
            submit: 'Create My Site'
        };

        var server = new Server(80);

        server.setNext(
            function(request) {

                var d = Q.defer(); // need to wait

                Form.createFromRequest(request).then(function(form) {

                    test.deepEqual(form.getFields(), fields);

                    var file = form.getFile('adminImage');

                    test.equal(file.name, 'chupacabra.jpg');
                    test.equal(file.type, 'image/jpeg');

                    // make sure the path exists
                    path.exists(file.path, function(exists) {
                        test.ok(exists);

                        // read the file that was received
                        var fileContent = fs.readFileSync(file.path);

                        // compare to file that was sent
                        var expected = fs.readFileSync(testbench.fixturesDir + '/form-data/chupacabra.jpg');

                        test.ok(StreamUtil.equal(expected, fileContent), "received file doesn't match expected");
                        d.resolve();
                    });
                });

                return d.promise;
            });

        var req = new mocks.Request('POST', '/yomama');

        req.headers = {
            'content-type': 'multipart/form-data; boundary=---------------------------157865218992',
            'content-length': '17883'
        };

        var res = new mocks.Response();

        // hitting a null inner layer results in a 404
        res.on('end', function() {
            test.equal(404, res.statusCode);
            test.done();
        });

        server.handleRequest(req, res);

        req.write(fs.readFileSync(testbench.fixturesDir + '/form-data/jpeg_upload.bin'));
        req.end();
    }
});

module.exports["request processing"] = testCase({

    tearDown: function(cb) {
        mp.tearDown();
        cb();
    },

    "test handle request no stages": function(test) {

        var server = new Server(80);

        var req = new mocks.Request();
        var res = new mocks.Response();

        var now = Date.now();
        var nowUTC = new Date(now).toUTCString();

        mp.patch(Date, 'now', function() {
            return now;
        });

        res.on('end', function() {
            test.equal(404, res.statusCode);
            test.deepEqual(res.headers, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Length': '28',
                Date: nowUTC,
                Server: 'Capsela'
            });
            test.done();
        });

        server.handleRequest(req, res);
    },

    "test synch processing error": function(test) {

        var server = new Server(80);

        server.addStage(
            function(request) {
                throw new Error("fool! you've killed us all!");
            });

        var req = new mocks.Request();
        var res = new mocks.Response();
        var body = '';

        res.on('data', function(chunk) {
            chunk && (body += chunk.toString());
        });

        res.on('end', function(chunk) {
            chunk && (body += chunk.toString());

            test.equal(500, res.statusCode);
            test.ok(body.indexOf("fool! you've killed us all!") >= 0);
            test.done();
        });

        server.handleRequest(req, res);
    },

    "test asynch processing error": function(test) {

        var server = new Server(80);

        server.addStage(
            function(request) {
                return Q.ref().then(
                    function() {
                        throw new Error("fool! you've killed us all!");
                    });
            });

        var req = new mocks.Request();
        var res = new mocks.Response();
        var body = '';

        res.on('data', function(chunk) {
            chunk && (body += chunk.toString());
        });

        res.on('end', function(chunk) {
            chunk && (body += chunk.toString());

            test.equal(500, res.statusCode);
            test.ok(body.indexOf("fool! you've killed us all!") >= 0);
            test.done();
        });

        server.handleRequest(req, res);
    },

    "test process one stage": function(test) {

        test.expect(3);

        var now = Date.now();
        var nowUTC = new Date().toUTCString();

        mp.patch(Date, 'now', function() {
            return now;
        });

        var server = new Server(80, {name: 'TestServer'});

        server.addStage(
            function(request) {
                test.ok(request instanceof Request);
                return new Response(410);
            });

        var req = new mocks.Request();
        var res = new mocks.Response();

        res.on('end', function() {
            test.equal(410, res.statusCode);
            test.deepEqual(res.headers, {
                Date: nowUTC,
                Server: 'TestServer'
            });
            test.done();
        });

        server.handleRequest(req, res);
    },

    "test handle non-response response": function(test) {

        var server = new Server();

        server.addStage(function(request) {
                return {};
            });
        
        var req = new mocks.Request();
        var res = new mocks.Response();

        res.on('end', function() {
            test.equal(500, res.statusCode);
            test.done();
        });

        server.handleRequest(req, res);
    }
});

