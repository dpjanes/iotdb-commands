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
var logger = iotdb.logger({
    name: "iotdb-commands",
    module: "RunSamples",
});

var FSTransport = require('iotdb-transport-fs').Transport;

var fs = require('fs');
var path = require('path');
var util = require('util');

var minimist = require('minimist');
var async = require('async');
var recursiveReaddirSync = require('recursive-readdir-sync')

var iotdb_commands = require('../index');

var ad = require('minimist')(process.argv.slice(2), {
    boolean: ["write", "test", "all", "verbose", ],
});

// --- main ---
var load_transporter = function(contextd, done) {
    done(null, _.d.compose.shallow({
        transport: new FSTransport({
            prefix: "samples/things",
        }),
    }, contextd));
};

var run_one = function (contextd, done) {
    var in_json_path = contextd.json_path;
    if (!path.isAbsolute(in_json_path)) {
        in_json_path = "./" + in_json_path;
    }

    var out_json_path_parent = path.join(path.dirname(in_json_path), "Output");
    var out_json_path_file = path.basename(in_json_path);
    var out_json_path = path.join(out_json_path_parent, out_json_path_file);

    var requestd = require(in_json_path);

    iotdb_commands.match(_.d.compose.shallow({
        requestd: requestd,
    }, contextd), function(error, matchs) {
        if (error) {
            return done(error);
        } 

        if (contextd.ad.write || contextd.ad.test) {
            try {
                fs.mkdirSync(out_json_path_parent);
            } catch (x) {
            }
        }

        logger.info({
            // ids: _.map(ids, function(d) { return d.id }),
            matchs: matchs,
            request: requestd,
        }, "MATCHES");

        matchs.map(function(match) {
            match.request = requestd;
        });

        if (contextd.ad.write) {
            fs.writeFileSync(out_json_path, JSON.stringify(matchs, null, 2));
            logger.info({
                path: out_json_path,
            }, "saved matches for testing");
        }
        
        done(null, null);
    });
};

var main = function() {
    var json_paths = [];
    if (ad.all) {
        var samples_dir = path.join(__dirname, "..", "samples", "tests");

        var names = recursiveReaddirSync(samples_dir);
        names.map(function (name) {
            if (!name.match(/[.]json$/)) {
                return;
            }

            json_paths.push(name);
        });
    } else if (ad._.length) {
        json_paths = _.map(ad._, function(json_path) {
            return path.resolve(json_path);
        });
    }

    if (ad.extensions) {
        iotdb_commands.load(ad.extensions);
    }

    var _after_transporter = function(error, contextd) {
        var _on_each = function(json_path, callback) {
            run_one(
                _.d.compose.shallow({ json_path: json_path, }, contextd), 
                callback
            );
        };
        var _on_done = function(error) {
            process.nextTick(process.exit);
        };

        async.eachSeries(contextd.json_paths, _on_each, _on_done);
    };

    load_transporter({
        json_paths: json_paths,
        ad: ad,
        verbose: ad.verbose,
    }, _after_transporter);
};

main();
