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
                    console.log(matches);
                    assert.ok(!error, "no error expected");
                    /*
                    assert.deepEqual(helpers.ids(matches), [ 'thing-main-tv', "thing-master-lighting", 'thing-master-tv-on' ]);
                    assert.deepEqual(helpers.select(matches, 'thing-master-lighting').ostate, { on: true });
                    assert.ok(helpers.select(matches, 'thing-master-tv-on').ostate.on);
                    */
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
                    console.log(matches);
                    assert.ok(!error, "no error expected");
                    /*
                    assert.deepEqual(helpers.ids(matches), [ 'thing-main-tv', 'thing-master-tv-on' ]);
                    assert.deepEqual(helpers.select(matches, 'thing-main-tv').ostate, { on: true });
                    assert.ok(helpers.select(matches, 'thing-master-tv-on').ostate.on);
                    */
                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });
    });
});
