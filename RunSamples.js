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

var FSTransport = require('iotdb-transport-fs').Transport;

var fs = require('fs');
var path = require('path');
var util = require('util');
var minimist = require('minimist');

var ad = require('minimist')(process.argv.slice(2), {
    boolean: ["write", "test", "all"],
});

// --- main ---
var load_transporter = function(contextd, done) {
    contextd.transporter = new FSTransport({
        prefix: "samples/things",
    });

    done(null, null);
};

/**
 *  This will callback with all the metas, then null
 */
var metas = function(contextd, callback) {
    // console.log("HERE:XXX", contextd.transporter);
    var count = 0;
    var _increment = function() {
        count++;
    };
    var _decrement = function() {
        if (--count === 0) {
            callback(null, null);
            callback = function() {};
        }
    }

    _increment();
    contextd.transporter.list(function(ld) {
        if (ld.id) {
            _increment();
            contextd.transporter.get({
                id: ld.id,
                band: "meta",
            }, function(gd) {
                if (gd.value) {
                    callback(null, gd);
                }
                _decrement();
            });
        } else if (ld.end) {
            _decrement();
            // return callback(null, null);
        }
    });
};

var run_one = function (contextd, done) {
    var json = require("./" + contextd.json_path);
    console.log("PATH", contextd.json_path);
    metas(contextd, function(error, metad) {
        if (metad === null) {
            return done(null, null);
        }
        console.log("META", json, metad);
    });
};

var run_next = function (contextd, done) {
    if (contextd.json_paths.length === 0) {
        return done(null, null);
    }

    contextd.json_path = contextd.json_paths[0];
    contextd.json_paths.splice(0, 1);

    run_one(contextd, function(error, result) {
        run_next(contextd, done);
    });
};

var main = function() {
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

    var contextd = {
        json_paths: json_paths,
        ad: ad,
    };

    load_transporter(contextd, function(error, result) {
        run_next(contextd, function(error, result) {
            process.nextTick(process.exit);
        });
    });

};

main();
