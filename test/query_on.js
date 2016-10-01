/*
 *  query_on.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-09-23
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

describe("query_on", function() {

    describe("query:on", function() {
        const query = "on";
        
        it("thing:all", function(done) {
            const thing = null;

            helpers.run({
                query: query,
                thing: thing,
            }, (error, matches) => {
                try {
                    assert.ok(!error, "no error expected");

                    assert.deepEqual(helpers.select(matches, 'thing-main-radio').response, 'Radio is on');
                    assert.deepEqual(helpers.select(matches, 'thing-master-lighting').response, 'Lights is on');
                    assert.strictEqual(helpers.response(matches), "HomeStar found 2 things on");

                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });
        it("thing:coffee maker", function(done) {
            const thing = "coffee maker";

            helpers.run({
                query: query,
                thing: thing,
            }, (error, matches) => {
                try {
                    // console.log(error);
                    assert.ok(!error, error);

                    assert.strictEqual(helpers.response(matches), "HomeStar found no things");

                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });

        it("thing:time machine", function(done) {
            const thing = "time machine";

            helpers.run({
                query: query,
                thing: thing,
            }, (error, matches) => {
                try {
                    assert.ok(!error, "no error expected");

                    assert.strictEqual(helpers.response(matches), "HomeStar didn't find this type of thing");

                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });
    });

    describe("query:off", function() {
        const query = "off";
        
        it("thing:all", function(done) {
            const thing = null;

            helpers.run({
                query: query,
                thing: thing,
            }, (error, matches) => {
                try {
                    assert.ok(!error, "no error expected");

                    assert.deepEqual(helpers.select(matches, 'thing-main-tv').response, 'TV is off');
                    assert.strictEqual(helpers.response(matches), "HomeStar found 1 thing off");

                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });
        it("thing:dishwasher", function(done) {
            const thing = "dishwasher";

            helpers.run({
                query: query,
                thing: thing,
            }, (error, matches) => {
                try {
                    assert.ok(!error, "no error expected");

                    // assert.strictEqual(helpers.response(matches), "HomeStar didn't find this thing");

                    done();
                }
                catch (x) {
                    done(x);
                }
            });
        });
    });
});
