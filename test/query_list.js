/*
 *  query_list.js
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

describe("query_list", function() {
    const query = "list";

    it("thing:all", function(done) {
        const thing = null;

        helpers.run({
            query: query,
            thing: thing,
        }, (error, matches) => {
            try {
                assert.ok(!error, "no error expected");
                assert.ok(matches.length);
                // assert.strictEqual(matches.filter(md => md.response).length, matches.length - 1);
                // console.log(matches);
                done();
            }
            catch (x) {
                done(x);
            }
        });
    });
    it("thing:tv", function(done) {
        const thing = "tv";

        helpers.run({
            query: query,
            thing: thing,
        }, (error, matches) => {
            try {
                assert.ok(!error, "no error expected");
                assert.strictEqual(matches.length - 1, 3);
                done();
            }
            catch (x) {
                done(x);
            }
        });
    });
    it("thing:lights", function(done) {
        const thing = "lights";

        helpers.run({
            query: query,
            thing: thing,
        }, (error, matches) => {
            try {
                assert.ok(!error, "no error expected");
                assert.strictEqual(matches.length - 1, 1);
                done();
            }
            catch (x) {
                done(x);
            }
        });
    });
});
