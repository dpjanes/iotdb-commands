/*
 *  index.js
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

const iotdb = require("iotdb")
const _ = iotdb._;

const iotdb_thing = require("../..");
const transport = require("./transport");

const run = ( requestd, done ) => {
    transport.create((error, transporter) => {
        if (error) {
            return done(error);
        }

        iotdb_thing.match(_.d.compose.shallow(requestd, {
            verbose: false,
            transporter: transporter,
        }), done);
    });
};

const select = ( matches, id ) => matches.find(d => d.id === id)
const ids = ( matches ) => matches.map(d => d.id).sort()

/*
 *  API
 */
exports.transport = transport;
exports.run = run;
exports.select = select;
exports.ids = ids;
