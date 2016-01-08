/*
 *  action.js
 *
 *  David Janes
 *  IOTDB.org
 *  206-01-08
 *  "Betelgeuse exploded" (no really)
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

var iotdb = require('iotdb');
var _ = iotdb._;
var logger = iotdb.logger({
    name: "iotdb-commands",
    module: "action",
});

var normalize = require('./normalize');

var actiondsd = {};

var add = function(d) {
    if (d["actuator"]) {
        d["iot:purpose"] = _.ld.expand(d["actuator"], "iot-purpose:");
        d["iot:actuator"] = true;
    } else if (d["sensor"]) {
        d["iot:purpose"] = _.ld.expand(d["sensor"], "iot-purpose:");
        d["iot:sensor"] = true;
    } else {
        logger.error({
            method: "add",
            d: d,
            cause: "likely problem with YAML source file",
        }, "expected acutator|sensor");
        return;
    }

    d = _.ld.compact(d);

    var action = normalize.action(d["action"]);
    var actionds = actiondsd[action];
    if (actionds === undefined) {
        actionds = [];
        actiondsd[action] = actionds;
    }

    actionds.push(d);
};

/**
 *  Return the actions corresponding to the name
 */
var actions = function(name) {
    if (!name || !_.is.String(name)) {
        return [];
    }

    var name = normalize.action(name);
    var actionds = actiondsd[name];
    if (actionds === undefined) {
        return [];
    } else {
        return actionds;
    }
};

/**
 *  API
 */
exports.add = add;
exports.actions = actions;
