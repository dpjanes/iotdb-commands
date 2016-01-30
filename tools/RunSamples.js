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
    var json_path = contextd.json_path;
    if (!path.isAbsolute(json_path)) {
        json_path = "./" + json_path;
    }

    var actiond = require(json_path);

    iotdb_commands.match(_.d.compose.shallow({
        actiond: actiond,
    }, contextd), function(error, matches) {
        if (error) {
            return done(error);
        } 

        logger.info({
            // ids: _.map(ids, function(d) { return d.id }),
            matches: matches,
            action: actiond,
        }, "MATCHES");
        
        done(null, null);
    });
};

var main = function() {
    var json_paths = [];
    if (ad.all) {
        var samples_dir = path.join(__dirname, "..", "samples");

        var names = fs.readdirSync(samples_dir);
        names.map(function (name) {
            if (!name.match(/[.]json$/)) {
                return;
            }

            json_paths.push(path.join(samples_dir, name));
        });
    } else if (ad._.length) {
        json_paths = _.map(ad._, function(json_path) {
            return path.resolve(json_path);
        });
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
