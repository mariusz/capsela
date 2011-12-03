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

/**
 * high-fidelity mock of a node HTTP response for both server and client purposes.
 * i.e. a response can be created to provide input to a client method or
 * to receive output from a server method
 */

var util = require('util');
var Class = require('capsela-util').Class;
var BufferUtils = require('capsela-util').BufferUtils;

var EventEmitter = require('events').EventEmitter;
var Stream = require('stream').Stream;

// create a mock of node's response object

var MockResponse = function() {
    Stream.call(this);

    // flag defined in WritableStream interface
    this.writable = true;

    this.ended = false;
//    this.written = '';
    this.statusCode = 200;
    this.headers = {};
    this.paused = false;
    this.fifo = [];

    this.headWritten = false;

    var t = this;

    BufferUtils.bufferStream(this).then(
        function(buffer) {
            t.written = buffer;
        }
    );
};

util.inherits(MockResponse, Stream);

MockResponse.prototype._emit = MockResponse.prototype.emit;

MockResponse.prototype.emit = function(event, arg) {

    if (this.paused) {
        this.fifo.push({name: event, arg: arg});
    }
    else {
        this._emit(event, arg);
    }
};

MockResponse.prototype.write = function(data, encoding) {
    
    if (!this.headWritten) {
        this.writeHead(this.statusCode, this.headers);
    }
    
//    this.written += data;
    this.encoding = encoding;
    
    this.emit('data', data);
};

MockResponse.prototype.end = function(data, encoding) {

    // writable flag becomes false after end()
    this.writable = false;

    if (!this.headWritten) {
        this.writeHead(this.statusCode, this.headers);
    }
    
    this.ended = true;
//    this.written += data;
    if (data) {
        this.write(data, encoding);
    }
    this.encoding = encoding;
    this.emit('end');
};

MockResponse.prototype.pause = function() {
    this.paused = true;
};

MockResponse.prototype.resume = function() {

    // play back the queued events
    while(this.fifo.length > 0) {
        var event = this.fifo.shift();
        this._emit(event.name, event.arg);
    }

    this.paused = false;
};

MockResponse.prototype.destroy = function() {
    
    // writable flag becomes false after end()
    this.writable = false;
};

MockResponse.prototype.writeHead = function(statusCode, headers) {

    this.statusCode = statusCode;
    this.headers = headers;
    this.headWritten = true;
    this.emit('head');
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Sets the given header to the given value.
 *
 * @param name
 * @param value
 */
MockResponse.prototype.setHeader = function(name, value) {

    if (!name) {
        throw new Error("can't set header without name");
    }

    if (!value) {
        throw new Error("can't set header without value");
    }

    this.headers[name.toLowerCase()] = value;
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Returns the value of the specified header.
 *
 * @param name
 */
MockResponse.prototype.getHeader = function(name) {
    var header = this.headers[name.toLowerCase()];
    return header ? header.value : null;
};


MockResponse.prototype.setEncoding = function(encoding) {
    this.encoding = encoding;
};


exports.Response = MockResponse;