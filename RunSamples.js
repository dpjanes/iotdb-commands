/*
 *  RunSamples.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-12-31
 *  "New Years Eve"
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

var fs = require('fs');
var path = require('path');
var util = require('util');
var minimist = require('minimist');

var ad = require('minimist')(process.argv.slice(2), {
    boolean: ["write", "test", "all"],
});

// --- main ---
var json_paths = [];
if (ad.all) {
    var samples_dir = "samples";

    var names = fs.readdirSync(samples_dir);
    names.map(function (name) {
        if (!name.match(/[.]json$/)) {
            return;
        }

        json_paths.push(path.join("samples", name));
    });
} else if (ad._.length) {
    json_paths = ad._;
}

var run = function (json_path, done) {
    console.log(json_path);
    return done(null, null);
};

var run_next = function () {
    if (json_paths.length === 0) {
        process.nextTick(process.exit);
        return;
    }

    var json_path = json_paths[0];
    json_paths.splice(0, 1);

    run(json_path, function(error, result) {
        run_next();
    });
};

run_next();
