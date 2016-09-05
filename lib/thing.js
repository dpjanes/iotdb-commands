/*
 *  thing.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-01-08
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

const iotdb = require('iotdb');
const _ = iotdb._;
const logger = iotdb.logger({
    name: "iotdb-commands",
    module: "thing",
});

const normalize = require('./normalize');

const thingdsd = {};

const add = function(d) {
    var thing = normalize.thing(d["thing"]);
    var thingds = thingdsd[thing];
    if (thingds === undefined) {
        thingds = [];
        thingdsd[thing] = thingds;
    }

    thingds.push(d);
}

/**
 *  Return the things corresponding to the name
 */
const things = function(name) {
    if (!name || !_.is.String(name)) {
        return [];
    }

    var name = normalize.thing(name);
    var thingds = thingdsd[name];
    if (thingds === undefined) {
        return [];
    } else {
        return thingds;
    }
};

/**
 *  API
 */
exports.things = things;
exports.add = add;
