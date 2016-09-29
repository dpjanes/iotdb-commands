/*
 *  action_up_down.js
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

describe("action_up_down", function() {
    describe("action:turn on", function() {
        const action = "turn up";

        it("thing:all", function(done) {
            const thing = null;

            helpers.run({
                action: action,
                thing: thing,
            }, (error, matches) => {
                try {
                    assert.ok(!error, "no error expected");
                    assert.strictEqual(helpers.updates(matches).length, 7);

                    {
                        const r_thing = helpers.select(matches, 'thing-basement-heater');
                        const r_value = r_thing.value.temperature;
                        const x_value = 20.5;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-main-thermometer');
                        const r_value = r_thing.value.tem;
                        const x_value = 71;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-main-tv');
                        const r_value = r_thing.value.volume;
                        const x_value = 70;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-master-ac');
                        const r_value = r_thing.value.t;
                        const x_value = 16.5;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-master-lighting');
                        const r_value = r_thing.value.brightness;
                        const x_value = 20;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-master-tv-on');
                        const r_value = r_thing.value['volume-up'];
                        assert.ok(r_value);
                    }

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
                    assert.strictEqual(helpers.updates(matches).length, 2);
                    {
                        const r_thing = helpers.select(matches, 'thing-main-tv');
                        const r_value = r_thing.value.volume;
                        const x_value = 70;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-master-tv-on');
                        const r_value = r_thing.value['volume-up'];
                        assert.ok(r_value);
                    }
                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });
    });
    describe("action:turn down", function() {
        const action = "turn down";

        it("thing:all", function(done) {
            const thing = null;

            helpers.run({
                action: action,
                thing: thing,
            }, (error, matches) => {
                try {
                    assert.ok(!error, "no error expected");
                    assert.strictEqual(helpers.updates(matches).length, 7);

                    {
                        const r_thing = helpers.select(matches, 'thing-basement-heater');
                        const r_value = r_thing.value.temperature;
                        const x_value = 19.5;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-main-thermometer');
                        const r_value = r_thing.value.tem;
                        const x_value = 69;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-main-tv');
                        const r_value = r_thing.value.volume;
                        const x_value = 30;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-master-ac');
                        const r_value = r_thing.value.t;
                        const x_value = 15.5;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-master-lighting');
                        const r_value = r_thing.value.brightness;
                        const x_value = 0;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-master-tv-off');
                        const r_value = r_thing.value['volume-down'];
                        assert.ok(r_value);
                    }

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
                    assert.strictEqual(helpers.updates(matches).length, 2);
                    {
                        const r_thing = helpers.select(matches, 'thing-main-tv');
                        const r_value = r_thing.value.volume;
                        const x_value = 30;
                        assert.deepEqual(r_value, x_value);
                    }
                    {
                        const r_thing = helpers.select(matches, 'thing-master-tv-off');
                        const r_value = r_thing.value['volume-down'];
                        assert.ok(r_value);
                    }
                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });
    });
});
