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
 * Author: Chris Osborn
 * Date: 5/6/11
 */

"use strict";

var testbench = require('../TestBench');
var testCase = require('nodeunit').testCase;

var capsela = require('capsela');

var Session = capsela.Session;
var SessionStore = capsela.SessionStore;
var Monitor = require('capsela-util').Monitor;

// save the originals
var originals = {
    datenow: Date.now,
    setInterval: setInterval
};

module.exports = testCase({

    tearDown: function(cb) {

        setInterval = originals.setInterval;
        Date.now = originals.datenow;
        cb();
    },

    "test init": function(test) {

        test.expect(1);

        // make sure a timer is installed pointing to the cleanup function

        setInterval = function(cb, delay) {
            test.equal(delay, global.config.session.cleanup_interval * 1000);
        };

        var sm = new SessionStore();
        test.done();
    },

    "test save": function(test) {

        var store = new SessionStore();

        Date.now = function() {return 72000;};
        var session = new Session();

        test.equal(session.store, null);
        test.equal(session.getLastSaveTime(), 72000);

        Date.now = function() {return 73000;};

        store.save(session).then(
            function() {
                test.equal(session.getLastSaveTime(), 73000);
                test.equal(session.store, store);
                test.done();
            });
    },

    "test load session not found": function(test) {

        var store = new SessionStore();

        store.load('mickey').then(
            function(err, session) {
                test.done();
            });
    },

    "test save/load/destroy": function(test) {

        test.expect(3);

        var store = new SessionStore();
        var session = new Session();

        session.monkeys = 7;

        // try saving
        store.save(session)
        .then(
            function(foundSession) {
                test.equal(foundSession.monkeys, 7);
                return store.load(session.getId());
            }
        ).then(
            function(foundSession) {
                test.equal(foundSession.monkeys, 7);

                // try destroying
                return store.destroy(foundSession);
            }
        ).then(
            function() {
                return store.load(session.getId());
            }
        ).then(
            function(foundSession) {
                test.equals(foundSession, undefined);
                test.done();
            });
    },

//    // functional test
//
//    "test cleanup": function(test) {
//
//        var store = new SessionStore();
//
//        // create some sessions with varying creation times and save them
//
//        var now = 72000;
//        Date.now = function(){return now;};
//
//        var sessions = [];
//        var session;
//
//        for (var i = 0; i < 6; i++) {
//            session = new Session();
//            sessions.push(session);
//        }
//
//        var saveMonitor = new Monitor(sessions.length);
//
//        saveMonitor.on('complete', function(){
//
//            // phase 1
//            now = 72000;
//
//            store.cleanup(Session.TIMEOUT, function() {
//
//                var loadMonitor = new Monitor(sessions.length);
//
//                // nothing should be gone
//                loadMonitor.on('report', function(session, err, result) {
//                   test.equal(session, result);
//                });
//
//                loadMonitor.on('complete', function(session, result) {
//                    phase2();
//                });
//
//                for (i in sessions) {
//                    if (sessions.hasOwnProperty(i)) {
//                        store.load(sessions[i].getId(), loadMonitor.addReport(sessions[i]));
//                    }
//                }
//            });
//        });
//
//        // first one should time out
//
//        function phase2() {
//
//            now += global.config.session.timeout * 1000;
//
//            store.cleanup(Session.TIMEOUT, function() {
//
//                var loadMonitor = new Monitor(sessions.length);
//
//                loadMonitor.on('report', function(session, err, result) {
//                    if (session.getId() == sessions[0].getId()) {
//                        test.equal(result, undefined);
//                    }
//                    else {
//                        test.ok(result);
//                    }
//                });
//
//                loadMonitor.on('complete', function(session, result) {
//                    phase3();
//                });
//
//                for (i in sessions) {
//                    if (sessions.hasOwnProperty(i)) {
//                        store.load(sessions[i].getId(), loadMonitor.addReport(sessions[i]));
//                    }
//                }
//            });
//        }
//
//        // next two should time out
//
//        function phase3() {
//
//            now += global.config.session.timeout * 1000;
//
//            store.cleanup(Session.TIMEOUT, function() {
//
//                var loadMonitor = new Monitor(sessions.length);
//
//                loadMonitor.on('report', function(session, err, result) {
//                    if (session.getId() == sessions[0].getId()) {
//                        test.equal(result, undefined);
//                    }
//                    else if (session.getId() == sessions[1].getId()) {
//                        test.equal(result, undefined);
//                    }
//                    else if (session.getId() == sessions[2].getId()) {
//                        test.equal(result, undefined);
//                    }
//                    else {
//                        test.ok(result);
//                    }
//                });
//
//                loadMonitor.on('complete', function(session, result) {
//                    phase4();
//                });
//
//                for (i in sessions) {
//                    if (sessions.hasOwnProperty(i)) {
//                        store.load(sessions[i].getId(), loadMonitor.addReport(sessions[i]));
//                    }
//                }
//            });
//        }
//
//        // next two should time out
//
//        function phase4() {
//
//            now += global.config.session.timeout * 1000;
//
//            store.cleanup(Session.TIMEOUT, function() {
//
//                var loadMonitor = new Monitor(sessions.length);
//
//                loadMonitor.on('report', function(session, err, result) {
//                    if (session.getId() == sessions[0].getId()) {
//                        test.equal(result, undefined);
//                    }
//                    else if (session.getId() == sessions[1].getId()) {
//                        test.equal(result, undefined);
//                    }
//                    else if (session.getId() == sessions[2].getId()) {
//                        test.equal(result, undefined);
//                    }
//                    else if (session.getId() == sessions[3].getId()) {
//                        test.equal(result, undefined);
//                    }
//                    else if (session.getId() == sessions[4].getId()) {
//                        test.equal(result, undefined);
//                    }
//                    else {
//                        test.ok(result);
//                    }
//                });
//
//                loadMonitor.on('complete', function(session, result) {
//                    test.done();
//                });
//
//                for (i in sessions) {
//                    if (sessions.hasOwnProperty(i)) {
//                        store.load(sessions[i].getId(), loadMonitor.addReport(sessions[i]));
//                    }
//                }
//            });
//        }
//
//        var start = 72000;
//        var mTimes = [
//            start,
//            start + Session.TIMEOUT - 1,
//            start + Session.TIMEOUT,
//            start + Session.TIMEOUT * 2 - 1,
//            start + Session.TIMEOUT * 2,
//            start + Session.TIMEOUT * 3 - 1];
//
//        for (var i in sessions) {
//            if (sessions.hasOwnProperty(i)) {
//                now = mTimes[i];
//                store.save(sessions[i], saveMonitor.addReport(sessions[i]));
//            }
//        }
//    }
});