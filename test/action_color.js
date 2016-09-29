/*
 *  action_color.js
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

describe("action_color", function() {
    describe("action:change color", function() {
        const action = "change color";

        describe("thing:all", function() {
            const thing = null;

            it("color:red", function(done) {
                const argument = "RED";

                helpers.run({
                    action: action,
                    thing: thing,
                    argument: argument,
                }, (error, matches) => {
                    try {
                        assert.ok(!error, "no error expected");
                        assert.deepEqual(helpers.response(matches), "HomeStar is changing color to RED for 1 thing");
                        assert.deepEqual(helpers.updates(matches).length, 1);
                        assert.deepEqual(helpers.select(matches, 'thing-master-lighting').value.color, argument)
                        done();
                    }
                    catch (x) {
                        done(x);
                    }
                });
            });
            it("color:blue", function(done) {
                const argument = "blue";

                helpers.run({
                    action: action,
                    thing: thing,
                    argument: argument,
                }, (error, matches) => {
                    try {
                        assert.ok(!error, "no error expected");
                        assert.deepEqual(helpers.response(matches), "HomeStar is changing color to blue for 1 thing");
                        assert.deepEqual(helpers.updates(matches).length, 1);
                        assert.deepEqual(helpers.select(matches, 'thing-master-lighting').value.color, argument)
                        done();
                    }
                    catch (x) {
                        done(x);
                    }
                });
            });
            it("color:bad", function(done) {
                const argument = "bad";

                helpers.run({
                    action: action,
                    thing: thing,
                    argument: argument,
                }, (error, matches) => {
                    try {
                        assert.ok(!error, "no error expected");
                        assert.deepEqual(helpers.updates(matches).length, 0);
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
