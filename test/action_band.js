/*
 *  action_band.js
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

describe("action_band", function() {
    describe("action:switch to", function() {
        const action = "switch to";

        describe("thing:all", function() {
            const thing = null;

            it("band:HDMI", function(done) {
                const argument = "hdmi"

                helpers.run({
                    action: action,
                    thing: thing,
                    argument: argument,
                }, (error, matches) => {
                    try {
                        assert.ok(!error, "no error expected");
                        assert.deepEqual(helpers.response(matches), "switched 2 things to HDMI");
                        assert.deepEqual(helpers.updates(matches).length, 2);
                        assert.deepEqual(helpers.select(matches, 'thing-main-tv').value.band, 'iot-purpose:band.hdmi');
                        assert.deepEqual(helpers.select(matches, 'thing-master-tv-on').value.band, 'iot-purpose:band.hdmi');
                        done();
                    }
                    catch (x) {
                        done(x);
                    }
                });
            });
            it("band:HDMI 2", function(done) {
                const argument = "hdmi 2"

                helpers.run({
                    action: action,
                    thing: thing,
                    argument: argument,
                }, (error, matches) => {
                    try {
                        // console.log(matches);
                        assert.deepEqual(helpers.response(matches), "switched 2 things to HDMI 2");
                        assert.deepEqual(helpers.updates(matches).length, 2);
                        assert.deepEqual(helpers.select(matches, 'thing-main-tv').value.band, 'iot-purpose:band.hdmi.2');
                        assert.deepEqual(helpers.select(matches, 'thing-master-tv-on').value.band, 'iot-purpose:band.hdmi.2');
                        done();
                    }
                    catch (x) {
                        done(x);
                    }
                });
            });
            it("band:am", function(done) {
                const argument = "am"

                helpers.run({
                    action: action,
                    thing: thing,
                    argument: argument,
                }, (error, matches) => {
                    try {
                        // console.log(matches);
                        assert.deepEqual(helpers.response(matches), "switched 1 thing to AM");
                        assert.deepEqual(helpers.updates(matches).length, 1);
                        assert.deepEqual(helpers.select(matches, 'thing-main-radio').value.band, 'iot-purpose:band.am');
                        done();
                    }
                    catch (x) {
                        done(x);
                    }
                });
            });
            it("band:fm", function(done) {
                const argument = "fm"

                helpers.run({
                    action: action,
                    thing: thing,
                    argument: argument,
                }, (error, matches) => {
                    try {
                        // console.log(matches);
                        assert.deepEqual(helpers.response(matches), "switched 1 thing to FM");
                        assert.deepEqual(helpers.updates(matches).length, 1);
                        assert.deepEqual(helpers.select(matches, 'thing-main-radio').value.band, 'iot-purpose:band.fm');
                        done();
                    }
                    catch (x) {
                        done(x);
                    }
                });
            });
            it("band:pandora", function(done) {
                const argument = "pandora"

                helpers.run({
                    action: action,
                    thing: thing,
                    argument: argument,
                }, (error, matches) => {
                    try {
                        // console.log(matches);
                        assert.deepEqual(helpers.updates(matches).length, 2);
                        assert.deepEqual(helpers.response(matches), "switched 2 things to Pandora");
                        assert.deepEqual(helpers.select(matches, 'thing-main-radio').value.band, 'iot-purpose:band.service.pandora');
                        assert.deepEqual(helpers.select(matches, 'thing-main-tv').value.band, 'iot-purpose:band.service.pandora');
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

