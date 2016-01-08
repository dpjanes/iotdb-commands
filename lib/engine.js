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
var _prepare_item = function(item, paramd) {
    if (paramd.compact) {
        item = _.ld.compact(item, { scrub: true });
    } else {
        item = _.d.compose.shallow(item);
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

    paramd = _.d.compose.shallow({
        compact: true,
    }, paramd);

    items.map(function(d) {
        d = _prepare_item(d, paramd);
        if (d) {
            ds.push(d);
        }
    });

    return ds;
};

/**
 */
var match = function(paramd, done) {
    paramd = _.d.compose.shallow(paramd, {
        user: null,
        verbose: false,
    });

    var tds = _prepare_items(vocabulary.things(paramd.actiond.thing));
    var ads = _prepare_items(vocabulary.actions(paramd.actiond.action));
    var qds = _prepare_items(vocabulary.querys(paramd.actiond.query));

    ads = ads.concat(qds);

    if (paramd.verbose) {
        logger.info({
            actiond: paramd.actiond,
            match: {
                things: tds,
                attributes: ads,
                // querys: qds,
            }
        });
    }

    var matches = [];

    paramd.transporter.all({
        bands: [ "meta", "model", ],
        user: paramd.user,
    }, function(error, thingd) {
        if (paramd.verbose) {
            if (thingd) {
                logger.info({
                    thing_name: _.ld.first(thingd.meta, "schema:name", ""),
                    id: thingd.id,
                }, "check");
            }

            logger.debug({
                thing: thingd,
            });
        };

        if (error) {
            return done(error);
        } else if (!thingd) {
            return done(null, matches);
        }

        var meta = _prepare_item(thingd.meta, paramd);

        // look for a matching thing
        var match_td = _.find(tds, function(td) {
            var match = null;
            for (var key in td) {
                var want_values = _.ld.list(td, key, []);
                var have_values = _.ld.list(meta, key, []);
                var common = _.intersection(want_values, have_values);
                if (common.length === 0) {
                    match = false;
                    break;
                } else {
                    match = true;
                }
            }

            return match ? td : null;
        });
        if (!match_td) {
            return;
        }

        // look for a matching model attribute with a purpose
        var match_ad = _.find(ads, function(ad) {
            var attributes = _.ld.list(thingd.model, "iot:attribute", []);
            for (var ai = 0; ai < attributes.length; ai++) {
                var attribute = _prepare_item(attributes[ai], paramd);
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
        });
        if (!match_ad) {
            return;
        }

        if (paramd.verbose) {
            logger.info({
                thing_name: _.ld.first(thingd.meta, "schema:name", ""),
                id: thingd.id,
            }, "MATCH");
        };

        matches.push({
            id: thingd.id,
            score: {
                thing: 1,
                attribute: 1,
            }
        });
    });
};

/**
 */
exports.match = match;
