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
 * Date: 4/6/11
 */

"use strict";

var Class = require('capsela-util').Class;
var fs = require('fs');
var formidable = require('formidable');
var qs = require('querystring');
var Q = require('qq');

var Form = Class.extend({

    NEWLINE: String.fromCharCode(13,10),

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a vanilla Form from the given request.
     *
     * @param request
     */
    createFromRequest: function(request) {

        var stream = request.getBodyStream();

        if (stream == null) {
            return Q.reject(new Error("request has no body stream"));
        }

        var form = new formidable.IncomingForm();
        var result = Q.defer();

        // formidable requires a node request, so we fabricate one here

        var fakeRequest = stream;

        // if the body stream is already a real node request, do nothing
        if (typeof fakeRequest.headers == "undefined") {
            fakeRequest.headers = request.getHeaders();
        }

        try {
            form.parse(fakeRequest, function(err, fields, files) {

                if (err) {
                    result.reject(new Error("error parsing form: " + err.message));
                }

                result.resolve(new Form(fields, files));
            });
        }
        catch (err) {
            result.reject(new Error("error parsing form: " + err.message));
        }

        stream.resume();   // in case it's been paused

        return result.promise;
    }
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new form with the given fields and formidable files.
     *
     * @param fields
     * @param files
     */
    init: function(fields, files) {
        this.fields = fields || {};
        this.files = files || {};
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a map of all field names to their values.
     *
     * @return object
     */
    getFields: function() {
        return this.fields;
    },

    ///////////////////////////////////////////////////////////////////////////////
    getFiles: function() {
        return this.files;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the value of the specified field.
     * 
     * @param fieldName
     */
    getValue: function(fieldName) {
        return this.fields[fieldName];
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the file with the given control name.
     *
     * todo support multi-file uploads 
     *
     * @param fileName
     */
    getFile: function(fileName) {
        return this.files[fileName];
    },

    ///////////////////////////////////////////////////////////////////////////////
    addFile: function(name, properties) {
        this.files[name] = properties;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a request from this form.
     *
     * @param method
     * @param path
     * @param headers
     * @param protocol
     * @param multipart     if true, use multipart encoding
     */
    createRequest: function(method, path, headers, protocol, multipart) {

        // todo support encoding and streaming of body
        
        var encoding = multipart ? 'multipart/form-data' : 'application/x-www-form-urlencoded';

        // set the content type header
        
        headers = headers || {};
        headers['content-type'] = encoding;

        var bodyStream = new Pipe();
        var request = new Request(method || 'POST', path, headers, bodyStream, protocol);
        var self = this;

        // add a useful device
        request.sendBody = function() {

            if (multipart) {
                self.serialize(bodyStream, 'dream-of-fair-to-middling-women');
                bodyStream.end();
            }
            else {
                self.serialize(bodyStream);
                bodyStream.end();
            }
        };

        return request;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Writes the form into the given stream.
     *
     * @param stream    a writable stream
     * @param boundary  optional multipart boundary to render multipart
     */
    serialize: function(stream, boundary) {

        if (!boundary) {
            stream.write(qs.stringify(this.fields));
            return;
        }

        var file;

        for (var fieldName in this.fields) {

            stream.write(new Buffer('--' + boundary + Form.NEWLINE
                + 'Content-Disposition: form-data; name="'
                + fieldName + '"' + Form.NEWLINE + Form.NEWLINE
                + this.fields[fieldName] + Form.NEWLINE));
        }

        for (var fileName in this.files) {
            
            file = this.files[fileName];

            stream.write(new Buffer('--' + boundary + Form.NEWLINE
                + 'Content-Disposition: form-data; name="'
                + fileName + '"; filename="' + file.name + '"' + Form.NEWLINE
                + 'Content-Type: ' + file.type + Form.NEWLINE + Form.NEWLINE, 'utf8'));
            
            // sweet jesus!
            stream.write(fs.readFileSync(file.path));
            stream.write(new Buffer(Form.NEWLINE));
        }

        // finish 'er off
        stream.write(new Buffer('--' + boundary + '--' + Form.NEWLINE));
    }
});

exports.Form = Form;

var Pipe = require('capsela-util').Pipe;
var Request = require('./Request').Request;