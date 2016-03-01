/*
 *  match.js
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
    module: 'match',
});

var format = require('iotdb-format');
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
        transport: null,
        actiond: null,
    });

    paramd.verbose = true;

    if (!paramd.transport) {
        throw new Error("param.transport expected");
    }
    if (!paramd.actiond) {
        throw new Error("param.actiond expected");
    }

    var xds = _prepare_items(vocabulary.things(paramd.actiond));
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
        }, "initial parameters (verbose)");
    }

    var matches = [];

    /**
     *  Level 1: extension match - note doesn't depend on Thing
     */
    var _level_1 = function() {
        var xds = vocabulary.extensions(paramd.actiond);
        xds.map(function(xd) {
            var resultd = {
                level: 1,
                extension: _.d.clone.shallow(xd),
            };
            matches.push(resultd);
        });

        /*
        if (xds.length) {
            console.log("PARAMD", paramd.actiond)
            console.log("XDS", xds)
            process.exit();
        };
         */
    };

    /**
     *  Level 2: action and thing; or query and thing match
     */
    var _level_2 = function(thingd) {
        /*
         *  band:meta match
         */
        var meta = _prepare_item(thingd.meta, paramd);

        var match_td = null;
        _.find(tds, function(td) {
            if (_match_object(td.meta, meta)) {
                match_td = td;
                return true;
            }
        });
        if (!match_td) {
            return;
        }

        /*
         *  band:istate and band:ostate match - on individual attributes
         */
        var match_attribute = null;
        var match_ad = null;

        var bands = [ "istate", "ostate" ];
        bands.map(function(band) {
            if (match_ad) {
                return;
            }

            _.find(ads, function(ad) {
                var attributes = _.ld.list(thingd.model, "iot:attribute", []);
                for (var ai = 0; ai < attributes.length; ai++) {
                    var attribute = _prepare_item(attributes[ai], paramd);

                    var attribute_code = attribute['@id'].replace(/^.*#/, '');
                    var attribute_value = _.d.get(thingd[band] || {}, attribute_code);
                    if (attribute_value) {
                        attribute["@value"] = attribute_value;
                    }
                    
                    if (_match_object(ad[band], attribute)) {
                        match_attribute = attributes[ai];
                        match_ad = ad;
                        return true;
                    }
                }
            });
        });

        if (!match_ad) {
            return;
        }

        console.log("HERE:XXX", 2, match_ad, match_attribute);
        if (paramd.verbose) {
            logger.info({
                thing_name: _.ld.first(thingd.meta, "schema:name", ""),
                id: thingd.id,
            }, "MATCH (verbose)");
        };

        var code = match_attribute['@id'].replace(/^.*#/, '');
        var value = _.d.get(thingd.istate, code);
        var resultd = {
            level: 2,
            id: thingd.id,
            score: {
                thing: 1,
                query: 0,
                action: 0,
            },
            value: {
                code: code,
                current: value,
            },
        };

        if (match_ad.query) {
            _.d.set(resultd, "/score/query", 1);
            _.d.set(resultd, "/value/compare", value);
        } else if (match_ad.action) {
            _.d.set(resultd, "/score/action", 1);
            _.d.set(resultd, "/value/update", _.d.get(match_ad, "value", null));

            resultd.ostate = {};
            _.d.set(resultd.ostate, code, _.d.get(match_ad, "value", null));
        }

        if (match_ad.response) {
            resultd.response = format.format(match_ad.response, { 
                value: value
            });
        } else {
            resultd.response = "ok";
        }

        matches.push(resultd);
        return true;
    };

    /**
     *  Action and name match; Query and Name match
     */
    var _level_3 = function(thingd) {
    };

    var _process_thing = function(error, thingd) {
        if (paramd.verbose) {
            if (thingd) {
                logger.info({
                    thing_name: _.ld.first(thingd.meta, "schema:name", ""),
                    id: thingd.id,
                }, "check (verbose)");
            }

            logger.debug({
                thing: thingd,
            }, "full thing description (verbose)");
        };

        if (error) {
            return done(error);
        } else if (!thingd) {
            return done(null, matches);
        }

        // look for matches
        _level_2(thingd);
        _level_3(thingd);
    };

    _level_1();

    paramd.transport.all({
        bands: [ "meta", "model", "istate", ],
        user: paramd.user,
    }, _process_thing);
};

/**
 */
exports.match = match;
