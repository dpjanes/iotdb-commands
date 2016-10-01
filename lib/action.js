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

const iotdb = require('iotdb');
const _ = iotdb._;
const logger = iotdb.logger({
    name: "iotdb-commands",
    module: "action",
});

const normalize = require('./normalize');

const actiondsd = {};
const headerd = {}

const add = function(d) {
    _.d.list(d, "action", [])
        .map(action_name => normalize.action(action_name))
        .map(action_name_normalized => {
            let actionds = actiondsd[action_name_normalized];
            if (actionds === undefined) {
                actionds = [];
                actiondsd[action_name_normalized] = actionds;
            }

            d = _.d.clone.deep(d);
            d.match = d.match || {};
            if (d.action !== "forget") {
                d.match["iot:actuator"] = true;
            }

            if (d.header) {
                headerd[action_name_normalized] = d.header
            } else if (headerd[action_name_normalized]) {
                d.header = _.d.clone.shallow(headerd[action_name_normalized]);
            }

            actionds.push(d);
        })
};

/**
 *  Return the actions corresponding to the name
 */
const actions = function(action_name_normalized) {
    if (!action_name_normalized || !_.is.String(action_name_normalized)) {
        return [];
    }

    const actionds = actiondsd[action_name_normalized];
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
