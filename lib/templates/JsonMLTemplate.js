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
 * Date: 1/9/12
 */

"use strict";

var Class = require('capsela-util').Class

var emptyTags = {
    'img': true,
    'br': true,
    'hr': true
};

var JsonMLTemplate = Class.extend({

    renderJsonMl: function(obj, params) {

        var tag;
        var attributes;
        var name;
        var children = [];
        var i;
        var emptyTag = false;

        if (typeof obj == 'string') {

            // todo HTML-escape strings
            return obj;
        }

        tag = obj[0];
        emptyTag = emptyTags[tag.toLowerCase()];

        // service any children
        for (i = 1; i < obj.length; i++) {

            if (typeof obj[i] == 'string') {

                // text child
                children.push(obj[i]);
            }
            else if (Array.isArray(obj[i])) {

                // child element or elements
                children.push(JsonMLTemplate.renderJsonMl(obj[i]));
            }
            else if (typeof obj[i] == 'object' && i == 1) {

                // child is an attributes object
                attributes = [];

                for (name in obj[i]) {
                    attributes.push(name + '="' + obj[i][name] + '"');
                }
            }
        }

        if (emptyTag) {
            return '<' + tag + (attributes ? ' ' + attributes.join(' ') : '') + '/>';
        }

        return '<' + tag + (attributes ? ' ' + attributes.join(' ') : '') +
            '>' + (children.length > 0 ? children.join('\n') + '\n' : '') + '</' + tag + '>';
    }
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param template
     */
    init: function(template) {
        this.template = template;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the result of rendering this template using the given params.
     *
     * @param params
     *
     * @return string
     */
    render: function(params) {
        return JsonMLTemplate.renderJsonMl(this.template, params);
    }
});

exports.JsonMLTemplate = JsonMLTemplate;