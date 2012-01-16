/*!
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
 * Date: Feb 28, 2011
 */

"use strict";

var testbench = require('../../TestBench');

var fs = require('fs');

var capsela = require('capsela');
var Response = capsela.Response;
var Request = capsela.Request;
var FileServer = capsela.stages.FileServer;
var MonkeyPatcher = require('capsela-util').MonkeyPatcher;
var Pipe = require('capsela-util').Pipe;

var fileServer;
var origDateNow = Date.now;
var now = new Date(1980, 1, 22).getTime();
var Q = require('q');
var mp = new MonkeyPatcher();

exports["basics"] = {

    setUp: function(cb) {

        mp.patch(Date, 'now', function() {
            return now;
        });

        fileServer = new FileServer("/resources", testbench.fixturesDir + '/fileserver');

        cb();
    },

    tearDown: function(cb) {
        Date.now = origDateNow;
        cb();
    },

    "test non-matching request falls through": function(test) {

        var request = new Request('GET', '/yomama');

        fileServer.pass = function(req) {
            test.equal(req, request);
            return 'ok';
        }

        Q.when(fileServer.service(request),
            function(response) {
                test.equal(response, 'ok');
                test.done();
            });
    },

    "test malicious request throws 403": function(test) {

        var request = new Request('GET', '/resources/../../etc/passwd');

        try {
            fileServer.service(request);
        }
        catch (err) {
            test.equal(err.code, 403);
            test.done();
        }
    },

    "test url containing baseUrl falls through": function(test) {

        var request = new Request('GET', '/other/resources/blah.jpg');

        fileServer.pass = function(req) {
            test.equal(req, request);
            return 'ok';
        }

        Q.when(fileServer.service(request),
            function(response) {
                test.equal(response, 'ok');
                test.done();
            });
    },

    "test url starting with baseUrl falls through": function(test) {
        var request = new Request('GET', '/resources_of_joy/blah.jpg');

        fileServer.pass = function(req) {
            test.equal(req, request);
            return 'ok';
        }

        Q.when(fileServer.service(request),
            function(response) {
                test.equal(response, 'ok');
                test.done();
            });
    },

    "test root base URL matches": function(test) {

        var fileServer = new FileServer("/", testbench.fixturesDir + '/fileserver');
        var request = new Request('GET', '/chickens.html');
        var bodyBuffer = new Pipe(true);
        var contentLength;

        Q.when(fileServer.service(request),
            function(response) {
                test.equal(response.statusCode, 200);
                contentLength = response.getHeader('content-length');
                test.equal(response.getHeader("Content-Type"), "text/html");
                test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                response.sendBody(bodyBuffer);
                return bodyBuffer.getData();
            }
        ).then(
            function(data) {
                test.ok(data.toString().indexOf('<p>chickens</p>') > 0);
                test.equal(data.length, contentLength);
                test.done();
            }
        ).end();
    },

    "test missing file falls through": function(test) {

        var fileServer = new FileServer("/", testbench.fixturesDir + '/fileserver');
        var request = new Request('GET', '/resources/chickens.jpg');

        fileServer.pass = function(req) {
            test.equal(req, request);
            return 'ok';
        }

        Q.when(fileServer.service(request),
            function(response) {
                test.equal(response, 'ok');
                test.done();
            });
    }
}

exports["default file"] = {

    setUp: function(cb) {

        mp.patch(Date, 'now', function() {
            return now;
        });

        fileServer = new FileServer("/resources", testbench.fixturesDir + '/fileserver');

        cb();
    },

    tearDown: function(cb) {
        Date.now = origDateNow;
        cb();
    },

    "test dir with missing default file falls through": function(test) {

        var fileServer = new FileServer("/resources", testbench.fixturesDir + '/fileserver', 'index.html');
        var request = new Request('GET', '/resources');

        fileServer.pass = function(req) {
            test.equal(req, request);
            return 'ok';
        }

        Q.when(fileServer.service(request),
            function(response) {
                test.equal(response, 'ok');
                test.done();
            }
        ).end();
    },

    "test default file option without trailing slash": function(test) {

        var fileServer = new FileServer("/resources", testbench.fixturesDir + '/fileserver', 'chickens.html');
        var request = new Request('GET', '/resources');
        var bodyBuffer = new Pipe(true);
        var contentLength;

        Q.when(fileServer.service(request),
            function(response) {
                test.equal(response.statusCode, 200);
                contentLength = response.getHeader('content-length');
                test.equal(response.getHeader("Content-Type"), "text/html");
                test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                response.sendBody(bodyBuffer);
                return bodyBuffer.getData();
            }
        ).then(
            function(data) {
                test.equal(data.length, contentLength);
                test.ok(data.toString().indexOf('<p>chickens</p>') > 0);
                test.done();
            }
        ).end();
    },

    "test default file option with trailing slash": function(test) {

        var fileServer = new FileServer("/resources", testbench.fixturesDir + '/fileserver', 'chickens.html');
        var request = new Request('GET', '/resources/');
        var bodyBuffer = new Pipe(true);
        var contentLength;

        Q.when(fileServer.service(request),
            function(response) {
                test.equal(response.statusCode, 200);
                contentLength = response.getHeader('content-length');
                test.equal(response.getHeader("Content-Type"), "text/html");
                test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                response.sendBody(bodyBuffer);
                return bodyBuffer.getData();
            }
        ).then(
            function(data) {
                test.equal(data.length, contentLength);
                test.ok(data.toString().indexOf('<p>chickens</p>') > 0);
                test.done();
            }
        ).end();
    },

    "test default file in subdirectory": function(test) {

        var fileServer = new FileServer("/", testbench.fixturesDir + '/fileserver', 'main.css');
        var request = new Request('GET', '/styles');
        var bodyBuffer = new Pipe(true);
        var contentLength;

        Q.when(fileServer.service(request),
            function(response) {
                test.equal(response.statusCode, 200);
                contentLength = response.getHeader('content-length');
                test.equal(response.getHeader("Content-Type"), "text/css");
                test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                response.sendBody(bodyBuffer);
                return bodyBuffer.getData();
            }
        ).then(
            function(data) {
                test.equal(data.length, contentLength);
                test.ok(data.toString().indexOf('font-family:') > 0);
                test.done();
            }
        ).end();
    }
}

exports["file types"] = {

    setUp: function(cb) {

        mp.patch(Date, 'now', function() {
            return now;
        });

        fileServer = new FileServer("/resources", testbench.fixturesDir + '/fileserver');

        cb();
    },

    tearDown: function(cb) {
        Date.now = origDateNow;
        cb();
    },

    "test serve txt": function(test) {

        var request = new Request('GET', '/resources/monkeys.txt');
        var bodyBuffer = new Pipe(true);

        fs.stat(testbench.fixturesDir + '/fileserver/monkeys.txt', function(err, stat) {

            Q.when(fileServer.service(request),
                function(response) {
                    test.equal(response.statusCode, 200);
                    test.equal(response.getHeader('content-length'), 13);
                    test.equal(response.getHeader("Content-Type"), "text/plain");
                    test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                    test.equal(response.getHeader('Last-Modified'), stat.mtime.toUTCString());
                    response.sendBody(bodyBuffer);
                    return bodyBuffer.getData();
                }
            ).then(
                function(data) {
                    test.equal(data.toString().indexOf('snow monkeys!'), 0);
                    test.done();
                }
            ).end();
        });
    },

    "test serve html": function(test) {

        var request = new Request('GET', '/resources/chickens.html');
        var bodyBuffer = new Pipe(true);

        fs.stat(testbench.fixturesDir + '/fileserver/chickens.html', function(err, stat) {

            Q.when(fileServer.service(request),
                function(response) {
                    test.equal(response.statusCode, 200);
                    test.equal(response.getHeader('content-length'), stat.size);
                    test.equal(response.getHeader("Content-Type"), "text/html");
                    test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                    test.equal(response.getHeader('Last-Modified'), stat.mtime.toUTCString());
                    response.sendBody(bodyBuffer);
                    return bodyBuffer.getData();
                }
            ).then(
                function(data) {
                    test.ok(data.toString().indexOf('<p>chickens</p>') > 0);
                    test.done();
                }
            ).end();
        });
    },

    "test serve css": function(test) {

        var request = new Request('GET', '/resources/styles/main.css');
        var bodyBuffer = new Pipe(true);

        fs.stat(testbench.fixturesDir + '/fileserver/styles/main.css', function(err, stat) {

            Q.when(fileServer.service(request),
                function(response) {
                    test.equal(response.statusCode, 200);
                    test.equal(response.getHeader("Content-Type"), "text/css");
                    test.equal(response.getHeader('content-length'), stat.size);
                    test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                    test.equal(response.getHeader('Last-Modified'), stat.mtime.toUTCString());
                    response.sendBody(bodyBuffer);
                    return bodyBuffer.getData();
                }
            ).then(
                function(data) {
                    test.ok(data.toString().indexOf('font-family:') > 0);
                    test.done();
                }
            ).end();
        });
    },

    "test serve js": function(test) {

        var request = new Request('GET', '/resources/scripts/hello.js');
        var bodyBuffer = new Pipe(true);

        fs.stat(testbench.fixturesDir + '/fileserver/scripts/hello.js', function(err, stat) {

            Q.when(fileServer.service(request),
                function(response) {
                    test.equal(response.statusCode, 200);
                    test.equal(response.getHeader("Content-Type"), "text/javascript");
                    test.equal(response.getHeader('content-length'), stat.size);
                    test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                    test.equal(response.getHeader('Last-Modified'), stat.mtime.toUTCString());
                    response.sendBody(bodyBuffer);
                    return bodyBuffer.getData();
                }
            ).then(
                function(data) {
                    test.ok(data.toString().indexOf('function() {') > 0);
                    test.done();
                }
            ).end();
        });
    },

    "test serve js with query string": function(test) {

        var request = new Request('GET', '/resources/scripts/hello.js?something');
        var bodyBuffer = new Pipe(true);

        fs.stat(testbench.fixturesDir + '/fileserver/scripts/hello.js', function(err, stat) {

            Q.when(fileServer.service(request),
                function(response) {
                    test.equal(response.statusCode, 200);
                    test.equal(response.getHeader("Content-Type"), "text/javascript");
                    test.equal(response.getHeader('content-length'), stat.size);
                    test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                    test.equal(response.getHeader('Last-Modified'), stat.mtime.toUTCString());
                    response.sendBody(bodyBuffer);
                    return bodyBuffer.getData();
                }
            ).then(
                function(data) {
                    test.ok(data.toString().indexOf('function() {') > 0);
                    test.done();
                }
            ).end();
        });
    },

    "test serve PNG": function(test) {

        var request = new Request('GET', '/resources/favicon.png');

        // todo check the body data
        fs.stat(testbench.fixturesDir + '/fileserver/monkeys.txt', function(err, stat) {

            Q.when(fileServer.service(request),
                function(response) {
                    test.equal(response.statusCode, 200);
                    test.equal(response.getHeader("Content-Type"), "image/png");
                    test.equal(response.getHeader('content-length'), 661);
                    test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                    test.equal(response.getHeader('Last-Modified'), stat.mtime.toUTCString());
                    test.done();
                }
            ).end();
        });
    },

    "test serve file with unrecognized extension": function(test) {

        var request = new Request('GET', '/resources/mystery.xyz');

        fs.stat(testbench.fixturesDir + '/fileserver/monkeys.txt', function(err, stat) {

            Q.when(fileServer.service(request), function(response) {
                test.equal(response.statusCode, 200);
                test.equal(response.getHeader("Content-Type"), null);
                test.equal(response.getHeader('content-length'), 18);
                test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                test.equal(response.getHeader('Last-Modified'), stat.mtime.toUTCString());
                test.done();
            });
        });
    },

    "test serve empty file": function(test) {

        var request = new Request('GET', '/resources/empty.txt');

        fs.stat(testbench.fixturesDir + '/fileserver/monkeys.txt', function(err, stat) {

            Q.when(fileServer.service(request), function(response) {
                test.equal(response.statusCode, 200);
                test.equal(response.getHeader("Content-Type"), "text/plain");
                test.equal(response.getHeader('content-length'), 0);
                test.equal(response.getHeader('Expires'), new Date(now + 365 * 86400 * 1000).toUTCString());
                test.equal(response.getHeader('Last-Modified'), stat.mtime.toUTCString());
                test.done();
            }).end();

        });
    },

    "test serve from additional paths": function(test) {

        var request = new Request('GET', '/resources/more/scripts/hi.js');

        Q.when(fileServer.service(request),
            function(response) {
                test.equal(response, undefined);

                request = new Request('GET', '/resources/more/scripts/hi.js');
                fileServer.mount(testbench.fixturesDir + '/fileserver2', "/resources/more");

                return fileServer.service(request);
            }
        ).then(
            function(response) {
                test.equal(response.statusCode, 200);

                request = new Request('GET', '/resources/evenmore/styles/other.css');

                return fileServer.service(request);
            }
        ).then(
            function(response) {
                test.equal(response, undefined);

                request = new Request('GET', '/resources/evenmore/styles/other.css');
                fileServer.mount(testbench.fixturesDir + '/fileserver3', "/resources/evenmore");

                return fileServer.service(request);
            }
        ).then(
            function(response) {
                test.equal(response.statusCode, 200);

                request = new Request('GET', '/resources/more/scripts/hi.js');

                return fileServer.service(request);
            }
        ).then(
            function(response) {
                test.equal(response.statusCode, 200);
                test.done();
        }).end();
    }
};