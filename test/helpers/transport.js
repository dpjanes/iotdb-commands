/*
 *  transporter.js
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

const path = require("path");

const iotdb_transport_fs = require("iotdb-transport-fs");
const iotdb_transport_memory = require("iotdb-transport-memory");

let transporter_fs;

const create = (done) => {
    if (!transporter_fs) {
        transporter_fs = iotdb_transport_fs.make({
            "prefix": path.join(__dirname, "..", "things"),
        })
    }

    const transporter_memory = iotdb_transport_memory.make();
    transporter_memory
        .copy(transporter_fs)
        .then(() => done(null, transporter_memory))
        .catch(error => done(error));
};

/**
 *  API
 */
exports.create = create;
