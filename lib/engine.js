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
 *  - normalizes english words to make comparison possible
 */
var _prepare_item = function(item, paramd) {
    if (_.is.Empty(item)) {
        return;
    }

    item = _.d.compose.shallow(item);

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
        d = _prepare_item(d, paramd);
        if (d) {
            ds.push(d);
        }
    });

    return ds;
};

/**
 */
var _match_object = function(queryd, targetd) {
    var match = null;

    for (var query_key in queryd) {
        if (query_key.indexOf(':') === -1) {
            continue;
        }

        var query_values = _.ld.list(queryd, query_key, []);
        var target_values = _.ld.list(targetd, query_key, []);
        var common = _.intersection(query_values, target_values);

        if (common.length === 0) {
            match = false;
            break;
        }

        match = true;
    }

    return match;
}
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

    var _process_thing = function(error, thingd) {
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


        // look for a matching thing
        var meta = _prepare_item(thingd.meta, paramd);

        var match_td = null;
        _.find(tds, function(td) {
            if (_match_object(td, meta)) {
                match_td = td;
                return true;
            }
        });
        if (!match_td) {
            return;
        }

        // look for a matching model attribute with a purpose
        var match_attribute = null;
        var match_ad = null;

        _.find(ads, function(ad) {
            var attributes = _.ld.list(thingd.model, "iot:attribute", []);
            for (var ai = 0; ai < attributes.length; ai++) {
                var attribute = _prepare_item(attributes[ai], paramd);
                if (_match_object(ad, attribute)) {
                    match_attribute = attributes[ai];
                    match_ad = ad;
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

        var code = match_attribute['@id'].replace(/^.*#/, '');
        var resultd = {
            id: thingd.id,
            score: {
                thing: 1,
                query: 0,
                action: 0,
            },
            code: code,
            value: {
                current: _.d.get(thingd.istate, code),
            },
        };

        if (match_ad.query) {
            _.d.set(resultd, "/score/query", 1);
            _.d.set(resultd, "/value/compare", _.ld.first(match_ad, "value", null));
        } else if (match_ad.action) {
            _.d.set(resultd, "/score/action", 1);
            _.d.set(resultd, "/value/set", _.ld.first(match_ad, "value", null));
        }

        matches.push(resultd);
    };

    paramd.transporter.all({
        bands: [ "meta", "model", "istate", ],
        user: paramd.user,
    }, _process_thing);
};

/**
 */
exports.match = match;
