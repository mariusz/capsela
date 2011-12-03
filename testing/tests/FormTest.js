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

var testbench = require(__dirname + '/../TestBench');
var testCase = require('nodeunit').testCase;

var Form = require('capsela').Form;
var Pipe = require('capsela-util').Pipe;
var BufferUtils = require('capsela-util').BufferUtils;

module.exports["basics"] = testCase({

    "test init": function(test) {

        var form = new Form();

        test.deepEqual(form.getFields(), {});
        test.deepEqual(form.getFiles(), {});

        form = new Form({name: "Seth", login: "spurcell"});

        test.deepEqual(form.getFields(), {name: "Seth", login: "spurcell"});
        test.deepEqual(form.getFiles(), {});

        form = new Form({name: "Seth", login: "spurcell"}, {});

        test.deepEqual(form.getFields(), {name: "Seth", login: "spurcell"});
        test.deepEqual(form.getFiles(), {});

        form = new Form({name: "Seth", login: "spurcell"}, {image: {path: '/tmp/upload.jpg'}});

        test.deepEqual(form.getFields(), {name: "Seth", login: "spurcell"});
        test.deepEqual(form.getFiles(), {image: {path: '/tmp/upload.jpg'}});

        test.done();
    },

    "test get value": function(test) {

        var form = new Form({name: "Seth", login: "spurcell"});

        test.equal('Seth', form.getValue('name'));
        test.equal('spurcell', form.getValue('login'));

        test.done();
    },

    "test add/get file": function(test) {

        var form = new Form();

        test.deepEqual(form.getFiles(), {});
        test.equal(form.getFile('image'), null)

        var properties = {
            path: '/tmp/monkeys',
            size: 16566,
            name: 'monkeys.jpg',
            type: 'image/jpeg'
        };
        
        form.addFile('image', properties);

        test.deepEqual(form.getFile('image'), properties);
        test.deepEqual(form.getFiles(), {image: properties});
        
        test.done();
    },

    "test encode simple": function(test) {
        // todo
        test.done();
    },

    "test write": function(test) {

        var pipe = new Pipe();
        var newline = String.fromCharCode(13,10);

        var form = new Form({
            name: 'Teddy Roosevelt',
            email: 'teddy@whitehouse.gov',
            password: 'bully!'
        });

        BufferUtils.bufferStream(pipe).then(
            function(data) {
                test.equal(data.toString(),
'--this is a boundary' + newline + '\
Content-Disposition: form-data; name="name"' + newline + '\
' + newline + '\
Teddy Roosevelt' + newline + '\
--this is a boundary' + newline + '\
Content-Disposition: form-data; name="email"' + newline + '\
' + newline + '\
teddy@whitehouse.gov' + newline + '\
--this is a boundary' + newline + '\
Content-Disposition: form-data; name="password"' + newline + '\
' + newline + '\
bully!' + newline + '\
--this is a boundary--' + newline);
                test.done();
            }
        );

        form.serialize(pipe, 'this is a boundary');
        pipe.end();
    }
});