/*
 *  extension.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-01-30
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
    module: "extension",
});

var normalize = require('./normalize');

var extensionds = [];

var add = function(xd) {
    xd = _.ld.compact(xd);

    if (xd.thing) {
        xd.thing = normalize.thing(xd.thing);
    }
    if (xd.action) {
        xd.action = normalize.action(xd.action);
    }
    if (xd.query) {
        xd.query = normalize.query(xd.query);
    }

    extensionds.push(xd);
}

/**
 */
var extensions = function(qd) {
    if (qd.thing) {
        qd.thing = normalize.thing(qd.thing);
    }
    if (qd.action) {
        qd.action = normalize.action(qd.action);
    }
    if (qd.query) {
        qd.query = normalize.query(qd.query);
    }

    var xds = [];
    for (var xi in extensionds) {
        var xd = extensionds[xi];
        if (qd.thing && (qd.thing !== xd.thing)) {
            continue;
        }
        if (qd.action && (qd.action !== xd.action)) {
            continue;
        }
        if (qd.query && (qd.query !== xd.query)) {
            continue;
        }

        xds.push(xd);
    }

    return xds;
};

/**
 *  API
 */
exports.extensions = extensions;
exports.add = add;
