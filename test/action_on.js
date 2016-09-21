/*
 *  actions_on.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-09-21
 *
 *  This will create a Transporter for the test code to work with
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

describe("action_on", function() {
    const _run = ( requestd, done ) => {
        helpers.transport.create((error, transporter) => {
            if (error) {
                return done(error);
            }

            iotdb_thing.match({
                verbose: false,
                transporter: transporter,
                requestd: requestd,
            }, done);
        });
    };

    const _select = ( matches, id ) => matches.find(d => d['thing-id'] === id)
    const _ids = ( matches ) => matches.map(d => d['thing-id']).sort()

    it("all", function(done) {
        _run({
            action: "turn on",
            thing: null,
        }, (error, matches) => {
            try {
                assert.ok(!error, "no error expected");
                assert.deepEqual(_ids(matches), [ 'thing-main-tv', "thing-master-lighting", 'thing-master-tv-on' ]);
                assert.deepEqual(_select(matches, 'thing-main-tv').ostate, { on: true });
                assert.deepEqual(_select(matches, 'thing-master-lighting').ostate, { on: true });
                assert.ok(_select(matches, 'thing-master-tv-on').ostate.on);
                done();
            }
            catch (x) {
                done(x);
            }
        });
    });
    it("TV", function(done) {
        _run({
            action: "turn on",
            thing: "TV",
        }, (error, matches) => {
            try {
                assert.ok(!error, "no error expected");
                assert.deepEqual(_ids(matches), [ 'thing-main-tv', 'thing-master-tv-on' ]);
                assert.deepEqual(_select(matches, 'thing-main-tv').ostate, { on: true });
                assert.ok(_select(matches, 'thing-master-tv-on').ostate.on);
                done();
            }
            catch (x) {
                done(x);
            }
        });
    });
});
