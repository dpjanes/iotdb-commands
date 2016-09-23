/*
 *  query.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-01-08
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
    module: "query",
});

const normalize = require('./normalize');

const querydsd = {};

const add = function(d) {
    /*
    const query = normalize.query(d["query"]);
    let queryds = querydsd[query];
    if (queryds === undefined) {
        queryds = [];
        querydsd[query] = queryds;
    }

    queryds.push(d);
    */
    _.d.list(d, "query", [])
        .map(query_name => normalize.query(query_name))
        .map(query_name_normalized => {
            let queryds = querydsd[query_name_normalized];
            if (queryds === undefined) {
                queryds = [];
                querydsd[query_name_normalized] = queryds;
            }

            queryds.push(_.d.clone.shallow(d));
        })
};

/**
 *  Return the querys corresponding to the name
 */
const querys = function(normalized_name) {
    if (!normalized_name || !_.is.String(normalized_name)) {
        return [];
    }

    // normalized_name = normalize.query(normalized_name);
    const queryds = querydsd[normalized_name];
    if (queryds === undefined) {
        return [];
    } else {
        return queryds;
    }
};

/**
 *  API
 */
exports.add = add;
exports.querys = querys;
