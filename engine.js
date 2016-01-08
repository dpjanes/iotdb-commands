/*
 *  engine.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-01-07
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
    name: 'iotdb-commands',
    module: 'engine',
});

var vocabulary = require('./vocabulary');
var stemmer = require('porter-stemmer').stemmer;

var _normalize_word = function(word) {
    return stemmer(word.toLowerCase());
};

/**
 *  This:
 *  - uses only JSON-LD-like data
 *  - normalizes english words to make comparison possible
 */
var _prepare_item = function(item, compact, paramd) {
    if (compact) {
        item = _.ld.compact(item, { scrub: true });
    }

    if (_.is.Empty(item)) {
        return;
    }

    var words = [
        "schema:name",
        "iot:facet",
        "iot:zone",
    ];
    words.map(function(word) {
        var values = _.ld.list(item, word, []);
        if (!values.length) {
            return;
        }

        item[word] = _.map(values, _normalize_word);
    });

    return item;
};

/**
 *  This prepares all the items are turns the new list.
 *  Empty items are excluded.
 */
var _prepare_items = function(items, paramd) {
    var ds = [];

    items.map(function(d) {
        d = _prepare_item(d, true);
        if (d) {
            ds.push(d);
        }
    });

    return ds;
};

/**
 */
var match = function(paramd, done) {
    var transporter = paramd.transporter;
    var actiond = paramd.actiond;

    var tds = _prepare_items(vocabulary.things(actiond.thing));
    var ads = _prepare_items(vocabulary.actions(actiond.action));

    console.log(ads);
    console.log(tds);
    
    var matches = [];

    transporter.all({
        bands: [ "meta", "model", ],
        user: null,         // for future improvement
    }, function(error, d) {
        console.log("-----");
        console.log("d", d);

        if (error) {
            return done(error);
        } else if (!d) {
            return done(null, matches);
        }

        d.meta = _prepare_item(d.meta);

        // look for a matching thing
        if (!tds.some(function(td) {
            var match = null;
            for (var key in td) {
                var want_values = _.ld.list(td, key, []);
                var have_values = _.ld.list(d.meta, key, []);
                var common = _.intersection(want_values, have_values);
                if (common.length === 0) {
                    match = false;
                    break;
                } else {
                    match = true;
                }
            }

            return match;
            // console.log("td", td);
        })) {
            return;
        }


        // look for a matching model attribute with a purpose
        if (!ads.some(function(ad) {
            var attributes = _.ld.list(d.model, "iot:attribute", []);
            for (var ai = 0; ai < attributes.length; ai++) {
                var attribute = _prepare_item(attributes[ai]);
                var match = null;
                for (var key in ad) {
                    var want_values = _.ld.list(ad, key, []);
                    var have_values = _.ld.list(attribute, key, []);
                    var common = _.intersection(want_values, have_values);
                    if (common.length === 0) {
                        match = false;
                        break;
                    } else {
                        match = true;
                    }
                }

                if (match) {
                    return true;
                }
            }
        })) {
            return;
        }

        matches.push(d.id);
        // console.log("HERE - A MATCH", d);
    });
};


/*
var run_one = function (contextd, done) {
    var json_path = contextd.json_path;
    if (!path.isAbsolute(json_path)) {
        json_path = "./" + json_path;
    }

    var json = require(json_path);
    console.log("PATH", contextd.json_path, json);

    var tds = vocabulary.things(json.thing);
    var ads = vocabulary.actions(json.action);

    var meta_ors = [];
    tds.map(function(td) {
        var meta_ands = [];

        var facets = _.ld.list(td, "facet", []);
        if (facets.length) {
            meta_ands.push("meta:iot:facet & " + JSON.stringify(facets));
        }

        _.mapObject(td, function(value, key) {
            if (key.indexOf(':') === -1) {
                return;
            }

            meta_ands.push("meta:" + key + " = " + JSON.stringify(value));
        });

        meta_ors.push("( " + meta_ands.join(" AND ") + " )");
    });

    var model_ors = [];
    ads.map(function(ad) {
        var model_ands = [];

        _.mapObject(ad, function(value, key) {
            if (key.indexOf(':') === -1) {
                return;
            }

            model_ands.push("model:" + key + " = " + JSON.stringify(value));
        });

        model_ors.push("( " + model_ands.join(" AND ") + " )");
    });

    var query = [];
    if (meta_ors.length) {
        query.push("(" + meta_ors.join(" OR ") + ")");
    }
    if (model_ors.length) {
        query.push("(" + model_ors.join(" OR ") + ")");
    }

    query = query.join(" AND ");

    logger.info({
        json: json,
        things: tds,
        actions: ads,
        path: contextd.json_path, 
        meta_ors: meta_ors,
        model_ors: model_ors,
        query: query,
    });

    done();
};

*/

/**
 */
exports.match = match;
