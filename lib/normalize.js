/*
 *  normalize.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-01-09
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
    module: "normalize",
});

var stemmer = require('porter-stemmer').stemmer;

var _normalize = function(v) {
    if (v.match(/^:/)) {
        return "iot-purpose" + v;
    } else {
        return v;
    }
};

var normalize_action = function(s) {
    return s.toLowerCase();
};

var normalize_thing = function(s) {
    return stemmer(s.toLowerCase());
};

var normalize_query = function(s) {
    return stemmer(s.toLowerCase());
};

var normalize_word = function(s) {
    return stemmer(s.toLowerCase());
};

var normalize_d = function(d) {
    d = _.d.clone.deep(d);

    _.mapObject(d, function(dvalue, dkey) {
        if (!_.is.Dictionary(dvalue)) {
            return;
        }

        _.mapObject(dvalue, function(svalue, skey) {
            if (skey === "iot:purpose") {
                dvalue[skey] = _.ld.expand(svalue, "iot-purpose:");
            } else if (skey === "iot:unit") {
                dvalue[skey] = _.ld.expand(svalue, "iot-unit:");
            } else if (skey === "iot:facet") {
                dvalue[skey] = _.ld.expand(svalue, "iot-facet:");
            }
        });

        if (dvalue.value !== undefined) {
            dvalue["@value"] = dvalue.value;
            delete dvalue.value;
        }
    });

    return _.ld.compact(d);
};

/**
 *  API
 */
exports.query = normalize_query;
exports.action = normalize_action;
exports.thing = normalize_thing;
exports.word = normalize_word;
exports.d = normalize_d;
