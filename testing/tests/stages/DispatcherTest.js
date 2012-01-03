/**
 * Copyright (C) 2011 Sitelier Inc.
 * All rights reserved.
 *
 * Author: Seth Purcell
 * Date: 12/9/11
 */

"use strict";

var testbench = require(__dirname + '/../../TestBench');
var testCase = require('nodeunit').testCase;

var capsela = require('capsela');
var Dispatcher = capsela.stages.Dispatcher;
var View = capsela.View;

var Q = require('qq');

module.exports["basics"] = testCase({

    "test hyphenize": function(test) {

        test.equal(Dispatcher.hyphenize('testing'), 'testing');
        test.equal(Dispatcher.hyphenize('test1'), 'test1');
        test.equal(Dispatcher.hyphenize('testApp'), 'test-app');
        test.equal(Dispatcher.hyphenize('test-App'), 'test-app');
        test.equal(Dispatcher.hyphenize('TestApp'), 'test-app');
        test.equal(Dispatcher.hyphenize('TestJsonMLApp'), 'test-json-mlapp'); // defining not-ideal as correct
        test.equal(Dispatcher.hyphenize('testAlbumEditor'), 'test-album-editor');
        test.done();
    },

    "test camelize": function(test) {

        test.equal(Dispatcher.dehyphenize('testing'), 'testing');
        test.equal(Dispatcher.dehyphenize('test1'), 'test1');
        test.equal(Dispatcher.dehyphenize('test-app'), 'testApp');
        test.equal(Dispatcher.dehyphenize('test-App'), 'testApp');
        test.equal(Dispatcher.dehyphenize('Test-App'), 'testApp');
        test.equal(Dispatcher.dehyphenize('Test-Json-ML-App'), 'testJsonMlApp'); // defining not-ideal as correct
        test.equal(Dispatcher.dehyphenize('test-album-editor'), 'testAlbumEditor');
        test.done();
    },

    "test init/getConfig": function(test) {

        var d = new Dispatcher('butterball');
        test.deepEqual(d.getConfig(), {});

        var config = {};
        d = new Dispatcher('butterball', config);

        test.equal(d.getConfig(), config);

        test.done();
    },

    "test add controller": function(test) {

        var d = new Dispatcher();

        var c = {};
        d.addController(c, 'mikey', '/home/tool');

        test.equal(c.name, 'mikey');
        test.equal(c.dispatcher, d);
        test.equal(c.homeDir, '/home/tool');

        test.done();
    },

    "test setUp": function(test) {

//        test.expect(4);

        var d = new Dispatcher();

        var exp = ['default', 'test1'];

        d.loadController = function(baseDir, name) {
            test.equal(baseDir, testbench.fixturesDir + '/controllers');
            test.equal(name, exp.shift());
        };

        d.setUp(testbench.fixturesDir + '/controllers').then(
            function() {
                test.done();
            }
        ).end();
    }
});

module.exports["link assembly"] = testCase({

    "test getLink": function(test) {
        
        var d = new Dispatcher();

        d.addController({}, 'user');

        d.setUp(testbench.fixturesDir + '/controllers').then(
            function(result) {

                test.equal(d.getLink('default', 'default'), '/');
                test.equal(d.getLink('default', 'default', {'answer': 42}), '/answer/42/');
                test.equal(d.getLink('default', 'default',
                    {'answer': 42, hoop: 'a', joop: undefined}), '/answer/42/hoop/a/joop/');
                test.equal(d.getLink('default', 'default',
                    {'answer': 42, hoop: 'a', joop: undefined}, true), '/answer/42/hoop/a/joop');

                test.equal(d.getLink('default', 'edit'), '/edit/');
                test.equal(d.getLink('default', 'edit', {'answer': 42}), '/edit/answer/42/');
                test.equal(d.getLink('default', 'edit',
                    {'answer': 42, hoop: 'a', joop: undefined}), '/edit/answer/42/hoop/a/joop/');
                test.equal(d.getLink('default', 'edit',
                    {'answer': 42, hoop: 'a', joop: undefined}, true), '/edit/answer/42/hoop/a/joop');

                test.equal(d.getLink('user', 'default'), '/user/');
                test.equal(d.getLink('user', 'default', {'answer': 42}), '/user/answer/42/');
                test.equal(d.getLink('user', 'default',
                    {'answer': 42, hoop: 'a', joop: undefined}), '/user/answer/42/hoop/a/joop/');
                test.equal(d.getLink('user', 'default',
                    {'answer': 42, hoop: 'a', joop: undefined}, true), '/user/answer/42/hoop/a/joop');

                test.equal(d.getLink('user', 'edit'), '/user/edit/');
                test.equal(d.getLink('user', 'edit', {'answer': 42}), '/user/edit/answer/42/');
                test.equal(d.getLink('user', 'edit',
                    {'answer': 42, hoop: 'a', joop: undefined}), '/user/edit/answer/42/hoop/a/joop/');
                test.equal(d.getLink('user', 'edit',
                    {'answer': 42, hoop: 'a', joop: undefined}, true), '/user/edit/answer/42/hoop/a/joop');

                test.done();
            }
        ).end();
    },

    "test getUrl": function(test) {

        var d = new Dispatcher('https://www.shareakeet.com');
        var params = {};

        d.getLink = function(c, a, p, leaf) {
            test.equal(c, 'controller');
            test.equal(a, 'action');
            test.equal(p, params);
            test.equal(leaf, true);
            return '/the-link';
        };

        test.equal(d.getUrl('controller', 'action', params, true),
            'https://www.shareakeet.com/the-link');

        test.done();
    }
});

module.exports["dispatching"] = testCase({

    "test no controller match": function(test) {

        var d = new Dispatcher();

        d.setNext(new capsela.Stage(
            function(request) {
                return 'fell through';
            }
        ));

        Q.when(d.service(new capsela.Request('GET', '/test/edit/x/y/z')),
            function(result) {
                test.equal(result, 'fell through');
                test.done();
            }
        ).end();
    },

    "test no action match": function(test) {

        var d = new Dispatcher();

        d.setNext(new capsela.Stage(
            function(request) {
                return 'fell through';
            }
        ));

        d.addController({}, 'testing');

        Q.when(d.service(new capsela.Request('POST', '/testing/snrk/x/y/z')),
            function(result) {

                test.equal(result, 'fell through');
                test.done();
            }
        ).end();
    },

    "test default action match": function(test) {

        var d = new Dispatcher();

        d.setUp(testbench.fixturesDir + '/controllers').then(
            function() {
                return d.service(new capsela.Request('POST', '/test1/mork'));
            }
        ).then(
            function(result) {

                test.equal(result, 'test1 default action called');
                test.done();
            }
        ).end();
    },

    "test dispatch null route": function(test) {

        var d = new Dispatcher();

        d.setUp(testbench.fixturesDir + '/controllers').then(
            function() {
                return d.service(new capsela.Request('POST', '/'));
            }
        ).then(
            function(result) {

                test.equal(result, 'default default action called');
                test.done();
            }
        ).end();
    },

    "test dispatch default controller": function(test) {

        var d = new Dispatcher();

        d.setUp(testbench.fixturesDir + '/controllers').then(
            function() {
                return d.service(new capsela.Request('POST', '/hit-me'));
            }
        ).then(
            function(result) {

                test.equal(result, 'default hitMe action called');
                test.done();
            }
        ).end();
    },

    "test dispatch success": function(test) {

        var d = new Dispatcher();

        d.setUp(testbench.fixturesDir + '/controllers').then(
            function() {
                return d.service(new capsela.Request('POST', '/test1/edit/x/y/z'));
            }
        ).then(
            function(result) {

                test.equal(result, 'called edit!');
                test.done();
            }
        ).end();
    },

    "test infer default": function(test) {

        var d = new Dispatcher();
        
        d.addController({
            defaultAction: function(request) {
                test.deepEqual(request.params, {
                    answer: 57,
                    hoop: 'a',
                    joop: ''
                });
                return 'here i am!';
            }
        }, 'default');

        Q.when(d.service(new capsela.Request('POST', '/answer/57/hoop/a/joop')),
            function(result) {

                test.equal(result, 'here i am!');
                test.done();
            }
        ).end();
    },

    "test dispatch with trailing slash": function(test) {

        var d = new Dispatcher();

        d.addController({
            defaultAction: function(request) {
                test.deepEqual(request.params, {
                    answer: 57,
                    hoop: 'a',
                    joop: ''
                });
                return 'here i am!';
            }
        }, 'default');

        Q.when(d.service(new capsela.Request('POST', '/answer/57/hoop/a/joop/')),
            function(result) {

                test.equal(result, 'here i am!');
                test.done();
            }
        ).end();
    },

    "test no result falls through": function(test) {

        var d = new Dispatcher();

        d.setNext(new capsela.Stage(
            function(request) {
                return 'fell through';
            }
        ));

        d.addController({
            defaultAction: function(request) {
                test.deepEqual(request.params, {
                    answer: 57,
                    hoop: 'a',
                    joop: ''
                });
            }
        }, 'default');

        Q.when(d.service(new capsela.Request('POST', '/answer/57/hoop/a/joop/')),
            function(result) {

                test.equal(result, 'fell through');
                test.done();
            }
        ).end();
    }
});

module.exports["view handling"] = testCase({

    "test injects into view": function(test) {
        
        var d = new Dispatcher();
        var view = new View('xyz');

        d.addController({
            defaultAction: function(request) {
                return Q.ref(view);
            }
        }, 'default');

        Q.when(d.service(new capsela.Request()),
            function(result) {

                test.equal(result, view);
                test.equal(result.urlFactory, d);
                test.done();
            }
        ).end();
    }
});