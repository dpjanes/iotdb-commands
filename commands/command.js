/*
 *  commands/command.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-09-19
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

const iotdb_commands = require('..');

const configuration = require("homestar-persist").configuration;

exports.command = "command";
exports.summary = "send a command - test human speech-like stuff";
exports.boolean = [];

exports.help = () => {
    console.log("usage: homestar command [--thing <thing text>] [--action <action text>]");
    console.log("");
};

const _die = msg => {
    if (msg) {
        console.log(msg);
        console.log()
    }
    exports.help();
    process.exit()
}

const _explain = (band, d) =>
    _.flatten(_.keys(d || {})
        .sort()
        .filter(key => !key.match(/^@/))
        .map(key => ({ key: key, value: d[key] }))
        .filter(itemd => !_.is.Dictionary(itemd.value))
        .map(itemd => ({ key: itemd.key, values: _.coerce.list(itemd.value) }))
        .map(itemd => itemd.values.map(value => `${ band }/${ itemd.key } ${ value }`)), true)


exports.run = ad => {
    if (ad.help) {
        exports.help();
        process.exit()
    }

    if (!ad.action && !ad.query) {
        return _die("error: --action or --query are required");
    }

    const cfgd = _.first(configuration());
    const transporter = require(cfgd.transporter).make(cfgd.initd);

    iotdb_commands.match({
        user: null,
        verbose: true,
        transporter: transporter,
        requestd: {
            action: ad.action || null,
            thing: ad.thing || null,
            query: ad.query || null,
            argument: ad.argument || ad.band || null,
        },
    }, (error, matches) => {
        if (error) {
            console.log("#", "error", _.error.message(error));
            return;
        }

        matches
            .forEach(matchd => {
                iotdb_commands.execute(transporter, matchd, error => {
                    if (error) {
                        console.log("#", _.error.message(error));
                        return;
                    }

                    if (matchd.action === "update") {
                        console.log("+", "updated");
                        console.log("id", matchd.id);
                        _explain(matchd.band, matchd.value).forEach(line => console.log(line));
                        _explain("meta", matchd.thing.meta).forEach(line => console.log(line));
                        console.log();
                    } else if (matchd.action === "remove") {
                        console.log("+", "removed");
                        console.log("id", matchd.id);
                        console.log();
                    } else if (matchd.response) {
                        console.log("+", matchd.response);
                    }
                });
            });
    });
};
