/*
 *  execute.js
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

const iotdb = require('iotdb');
const _ = iotdb._;

const errors = require('iotdb-errors');

const logger = iotdb.logger({
    name: 'iotdb-commands',
    module: 'match',
});

const execute = (transporter, matchd, done) => {
    switch (matchd.action) {
    case "update":
        return _execute_update(transporter, matchd, done);
    case "remove":
        return _execute_remove(transporter, matchd, done);
    case "response":
        return _execute_response(transporter, matchd, done);
    default:
        return _execute_error(transporter, matchd, done);
    }
};

const _execute_update = (transporter, matchd, done) => {
    transporter.put({
        id: matchd.id,
        band: matchd.band,
        value: matchd.value,
    }).subscribe(
        ok => done(null, matchd),
        error => done(error)
    );
};

const _execute_remove = (transporter, matchd, done) => {
    transporter.remove({
        id: matchd.id,
    }).subscribe(
        () => done(null, matchd),
        error => done(error)
    );
};

const _execute_response = (transporter, matchd, done) => {
    done(null, matchd);
};

const _execute_error = (transporter, matchd, done) => {
    done(new errors.Internal(`unknown match action ${ matchd.action }`));
};

/**
 *  API
 */
exports.execute = execute;
