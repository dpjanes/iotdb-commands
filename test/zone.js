/*
 *  zone.js
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

describe("zone", function() {
    const query = "list";
    const thing = null;

    it("zone:living room", function(done) {
        const zone = "Living Room"

        helpers.run({
            query: query,
            thing: thing,
            zone: zone,
        }, (error, matches) => {
            try {
                assert.ok(!error, "no error expected");
                assert.strictEqual(matches.length, 3);
                done();
            }
            catch (x) {
                done(x);
            }
        });
    });
    it("zone:main floor", function(done) {
        const zone = "Main Floor";

        helpers.run({
            query: query,
            thing: thing,
            zone: zone,
        }, (error, matches) => {
            try {
                assert.ok(!error, "no error expected");
                assert.strictEqual(matches.length, 5);
                done();
            }
            catch (x) {
                done(x);
            }
        });
    });
    it("zone:second floor", function(done) {
        const zone = "second Floor";

        helpers.run({
            query: query,
            thing: thing,
            zone: zone,
        }, (error, matches) => {
            try {
                assert.ok(!error, "no error expected");
                assert.strictEqual(matches.length, 4);
                done();
            }
            catch (x) {
                done(x);
            }
        });
    });
    it("zone:study", function(done) {
        const zone = "study";

        helpers.run({
            query: query,
            thing: thing,
            zone: zone,
        }, (error, matches) => {
            try {
                assert.ok(!error, "no error expected");
                assert.strictEqual(matches.length, 1);
                done();
            }
            catch (x) {
                done(x);
            }
        });
    });
    it("zone:third floor", function(done) {
        const zone = "third Floor";

        helpers.run({
            query: query,
            thing: thing,
            zone: zone,
        }, (error, matches) => {
            try {
                assert.ok(!error, "no error expected");
                assert.strictEqual(matches.length, 0);
                done();
            }
            catch (x) {
                done(x);
            }
        });
    });
});

