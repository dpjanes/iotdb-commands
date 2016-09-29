/*
 *  action_mute.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-09-22
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

describe("action_mute", function() {
    describe("action:mute", function() {
        const action = "mute";

        it("thing:all", function(done) {
            const thing = null;

            helpers.run({
                action: action,
                thing: thing,
            }, (error, matches) => {
                try {
                    assert.ok(!error, "no error expected");
                    assert.deepEqual(helpers.response(matches), "muting 3 things");
                    assert.deepEqual(helpers.updates(matches).length, 3);
                    assert.ok(helpers.select(matches, 'thing-master-tv-on').value.mute);
                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });
        it("thing:TV", function(done) {
            const thing = "TV";

            helpers.run({
                action: action,
                thing: thing,
            }, (error, matches) => {
                try {
                    assert.ok(!error, "no error expected");
                    assert.deepEqual(helpers.response(matches), "muting 2 TVs");
                    assert.deepEqual(helpers.updates(matches).length, 2);
                    assert.deepEqual(helpers.select(matches, 'thing-main-tv').value.mute, true);
                    assert.ok(helpers.select(matches, 'thing-master-tv-on').value.mute);
                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });
    });
    describe("action:unmute", function() {
        const action = "unmute";

        it("thing:all", function(done) {
            const thing = null;

            helpers.run({
                action: action,
                thing: thing,
            }, (error, matches) => {
                try {
                    assert.ok(!error, "no error expected");
                    assert.deepEqual(helpers.response(matches), "unmuting 3 things");
                    assert.deepEqual(helpers.updates(matches).length, 3);
                    assert.ok(helpers.select(matches, 'thing-master-tv-off').value.unmute);
                    assert.strictEqual(helpers.select(matches, 'thing-main-tv').value.mute, false);
                    assert.strictEqual(helpers.select(matches, 'thing-main-radio').value.mute, false);
                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });
        it("thing:Radio", function(done) {
            const thing = "Radio";

            helpers.run({
                action: action,
                thing: thing,
            }, (error, matches) => {
                try {
                    assert.ok(!error, "no error expected");
                    assert.deepEqual(helpers.response(matches), "unmuting one Radio");
                    assert.deepEqual(helpers.updates(matches).length, 1);
                    assert.strictEqual(helpers.select(matches, 'thing-main-radio').value.mute, false);
                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });
    });
});
