/*
 *  action_channel.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-09-24
 *
 *  Copyright [2013-2016] [David P. Janes]
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use strict";

const assert = require("assert");
const helpers = require("./helpers");

const iotdb_thing = require("..");

describe("action_channel", function() {
    describe("action:change channel", function() {
        const action = "change channel";

        describe("thing:TV", function() {
            const thing = "TV";

            it("channel 32", function(done) {
                const argument = 32

                helpers.run({
                    action: action,
                    thing: thing,
                    argument: argument,
                }, (error, matches) => {
                    try {
                        assert.ok(!error, "no error expected");
                        assert.deepEqual(matches.length, 1);
                        assert.deepEqual(helpers.select(matches, 'thing-main-tv').value.channel, "32");
                        done();
                    }
                    catch (x) {
                        done(x);
                    }
                });
            });
        });
    });
    describe("action:switch channel", function() {
        const action = "switch channel";

        describe("thing:TV", function() {
            const thing = "TV";

            it("channel 48", function(done) {
                const argument = 48

                helpers.run({
                    action: action,
                    thing: thing,
                    argument: argument,
                }, (error, matches) => {
                    try {
                        assert.ok(!error, "no error expected");
                        assert.deepEqual(matches.length, 1);
                        assert.deepEqual(helpers.select(matches, 'thing-main-tv').value.channel, "48");
                        done();
                    }
                    catch (x) {
                        done(x);
                    }
                });
            });
        });
    });
    describe("action:set channel", function() {
        const action = "set channel";

        describe("thing:Radio", function() {
            const thing = "Radio";

            /*
             *  Note there's a bug in 'lib/match' - it should
             *  be matching two attibutes. So at some point this will break
             *  and the fix should be to add the other channel.
             */
            it("channel 500 (becomes 535)", function(done) {
                const argument = 500

                helpers.run({
                    action: action,
                    thing: thing,
                    argument: argument,
                }, (error, matches) => {
                    try {
                        assert.ok(!error, "no error expected");
                        assert.deepEqual(matches.length, 1);
                        assert.deepEqual(helpers.select(matches, 'thing-main-radio').value.am, 535);
                        done();
                    }
                    catch (x) {
                        done(x);
                    }
                });
            });
        });
    });
});
