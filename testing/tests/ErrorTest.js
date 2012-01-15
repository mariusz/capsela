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
 * Date: 1/4/12
 */

"use strict";

var testbench = require(__dirname + '/../TestBench');

var capsela = require('capsela');

module.exports["basics"] = {

    "test init": function(test) {

        var error = new capsela.Error('oh no!');

        test.equal(error.message, 'oh no!');
        test.equal(error.code, 500);
        test.equal(error.antecedent, undefined);
        test.ok(error instanceof Error);
        test.ok(error instanceof capsela.Error);

        error = new capsela.Error('oh no!', 404, new Error('bummer'));

        test.equal(error.message, 'oh no!');
        test.equal(error.code, 404);
        test.equal(error.antecedent.message, 'bummer');
        test.ok(error instanceof Error);
        test.ok(error instanceof capsela.Error);

        test.done();
    }
};