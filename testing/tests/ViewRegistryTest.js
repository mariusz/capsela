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
 * Date: 1/9/12
 */

"use strict";

var capsela = require('capsela');
var ViewRegistry = capsela.ViewRegistry;
var JsonTemplate = capsela.views.JsonTemplate;

var testbench = require('../TestBench');

var TestView = capsela.View.extend({

},
{
    init: function(render) {
        this.render = render;
    },

    render: function() {
        // will be replaced
    },

    isComplete: function() {
        return false;
    }
});

module.exports["basics"] = {

    "test addViews": function(test) {
        
        var vr = new ViewRegistry();

        var views = [{}, {}, {}, {}];

        vr.addView('view1', views[0]);

        test.deepEqual(vr.views, {view1: views[0]});

        vr.addViews({
            'view2': views[3],
            'view3': views[2],
            'view4': views[1]
        });
        
        test.deepEqual(vr.views, {
            view1: views[0],
            view2: views[3],
            view3: views[2],
            view4: views[1]
        });

        test.done();
    },

    "load templates": function(test) {

        var vr = new ViewRegistry();

        vr.loadViews(testbench.fixturesDir + '/views', JsonTemplate).then(
            function() {

                test.ok(vr.getView('default') instanceof JsonTemplate);
                test.ok(vr.getView('user') instanceof JsonTemplate);
                test.done();
            }
        ).end();
    }
};

module.exports["rendering"] = {

    "test render w/view object": function(test) {

        test.expect(1);
        
        var vr = new ViewRegistry();

        var params = {};

        vr.render(new TestView(
            function(model) {
                test.equal(model, params);
            }), params);

        test.done();
    },

    "test render missing view throws": function(test) {

        var vr = new ViewRegistry();

        try {
            vr.render('my-view');
        }
        catch (err) {
            test.equal(err.message, 'view "my-view" not found');
            test.done();
        }
    },

    "test render with no params": function(test) {

        var r = new ViewRegistry();
        r.addView('myview', new TestView(function() {return 'howdy'}));

        test.equal(r.render('myview'), 'howdy');
        test.done();
    },

    "test render w/o parent": function(test) {

        var r = new ViewRegistry();
        var p = {};
        
        r.addView('myview', new TestView(
            function(params) {
                test.equal(params, p);
                return 'howdy'
            }));

        test.equal(r.render('myview', p), 'howdy');
        test.done();
    },

    "test render w/parent string": function(test) {

        test.expect(3);

        var r = new ViewRegistry();
        var p = {};

        r.addView('layout', new TestView(
            function(params) {
                test.deepEqual(params, {
                    content: 'howdy',
                    child: p
                })
                return 'layout';
            }
        ))

        var view = new TestView(
            function(params) {
                test.equal(params, p);
                return 'howdy'
            });

        view.setParent('layout');

        r.addView('myview', view);

        test.equal(r.render('myview', p), 'layout');

        test.done();
    },

    "test render w/parent object": function(test) {

        test.expect(3);

        var r = new ViewRegistry();
        var p = {};

        var view = new TestView(
            function(params) {
                test.equal(params, p);
                return 'howdy'
            });

        view.setParent(new TestView(
            function(params) {
                test.deepEqual(params, {
                    content: 'howdy',
                    child: p
                })
                return 'layout';
            }
        ));

        r.addView('myview', view);

        test.equal(r.render('myview', p), 'layout');

        test.done();
    },

    "test render w/layout": function(test) {

        test.expect(3);

        var r = new ViewRegistry();
        var p = {};

        var view = new TestView(
            function(params) {
                test.equal(params, p);
                return 'howdy'
            });

        r.addView('layout', new TestView(
            function(params) {
                test.deepEqual(params, {
                    content: 'howdy',
                    child: p
                })
                return 'layout';
            }
        ));

        r.addView('myview', view);

        test.equal(r.render('myview', p, 'layout'), 'layout');

        test.done();
    },

    "test render w/grandparent": function(test) {

        test.expect(16);

        var r = new ViewRegistry();
        var p = {};

        var view = new TestView(
            function(params) {
                test.equal(params, p);
                return 'howdy'
            });

        var layout = new TestView(
            function(params) {
                test.deepEqual(params, {
                    content: 'howdy',
                    child: p
                })
                return 'layout';
            });

        var superLayout = new TestView(
            function(params) {
                test.deepEqual(params, {
                    content: 'layout',
                    child: {
                    content: 'howdy',
                    child: p
                }
                })
                return 'superLayout!';
            }
        )

        r.addView('myview', view);
        r.addView('layout', layout);
        r.addView('superLayout', superLayout);

        view.setParent(layout);
        layout.setParent('superLayout');
        test.equal(r.render('myview', p), 'superLayout!');
        
        view.setParent('layout');
        layout.setParent(superLayout);
        test.equal(r.render('myview', p), 'superLayout!');

        view.setParent('layout');
        layout.setParent('superLayout');
        test.equal(r.render('myview', p), 'superLayout!');

        view.setParent(layout);
        layout.setParent(superLayout);
        test.equal(r.render('myview', p), 'superLayout!');

        test.done();
    },

//    "test render and resolve": function(test) {
//
//        var r = new ViewRenderer();
//        r.addView('myview', new JsonTemplate('ref:static_file:logo'));
//
//        r.setResolver({
//            resolve: function(nid, nss) {
//                test.equal(nid, 'static_file');
//                test.equal(nss, 'logo');
//                return 'http://www.example.com/logo.png';
//            }
//        });
//
//        test.equal(r.render('myview'), 'http://www.example.com/logo.png');
//        test.done();
//    }
};
