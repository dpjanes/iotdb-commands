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

const iotdb = require('iotdb');
const _ = iotdb._;

const logger = iotdb.logger({
    name: 'iotdb-commands',
    module: 'match',
});

const format = require('iotdb-format');
const vocabulary = require('./vocabulary');
const stemmer = require('porter-stemmer').stemmer;

const _normalize_word = word => stemmer(word.toLowerCase());

/**
 *  This:
 *  - normalizes english words to make comparison possible
 */
const _prepare_item = function(item, paramd) {
    if (_.is.Empty(item)) {
        return;
    }

    item = _.d.clone.deep(item);

    /**
     *  If there's a "do" clause, then we default in an "ostate"
     *  rule that says there has to be a matching purpose
     */
    if (item.do) {
        if (!item.ostate) {
            item.ostate = {};
        }

        if (!item.ostate["iot:purpose"] && item.do["iot:purpose"]) {
            item.ostate["iot:purpose"] = item.do["iot:purpose"];
        }
    }

    /**
     *  Normalize human language words for matching purposes.
     *  We use _.d.transform as there's subdictionaries
     */
    item = _.d.transform(item, {
        pre: function(o, paramd) {
            _.flatten([ "schema:name", "iot:zone", ].forEach(word => _.ld.list(o, word, [])))
                .forEach(value => {
                    o[word] = _normalize_word(value);
                })

            /*
            words.map(function(word) {
                var values = _.ld.list(o, word, []);
                if (!values.length) {
                    return;
                }

                o[word] = _.map(values, _normalize_word);
            });
            */

            return o;
        },
    });

    return item;
};

/**
 *  This prepares all the items are turns the new list.
 *  Empty items are excluded.
 */
const _prepare_items = function(items, paramd) {
    return items
        .map(item => _prepare_item(item, paramd))
        .filter(item => item)
};

/*
    var ds = [];

    items.map(function(d) {
        d = _prepare_item(d, paramd);
        if (d) {
            ds.push(d);
        }
    });

    return ds;
};
*/

/**
 */
const _match_object = function(queryd, targetd) {
    _.keys(queryd)
        .filter(query_key => query_key.indexOf(':') !== -1)
        .find(query_key => {
            const query_values = _.ld.list(queryd, query_key, []);
            const target_values = _.ld.list(targetd, query_key, []);
            const common = _.intersection(query_values, target_values);

            return common.length > 0;
        })

    /*
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
    */
}
/**
 */
const match = function(paramd, done) {
    paramd = _.d.compose.shallow(paramd, {
        user: null,
        verbose: false,
        transport: null,
        requestd: null,
    });

    paramd.verbose = true;

    if (!paramd.transport) {
        throw new Error("param.transport expected");
    }
    if (!paramd.requestd) {
        throw new Error("param.requestd expected");
    }

    // extensions - basically an override
    const xds = _prepare_items(vocabulary.extensions(paramd.requestd));

    // thing definitions - what to match
    const tds = _prepare_items(vocabulary.things(paramd.requestd.thing));

    // action and query definitions - what to do
    const ads = 
                _prepare_items(vocabulary.actions(paramd.requestd.action))
        .concat(_prepare_items(vocabulary.querys(paramd.requestd.query)));

    if (paramd.verbose) {
        logger.info({
            requestd: paramd.requestd,
            match: {
                things: tds,
                attributes: ads,
            }
        }, "initial parameters (verbose)");
    }

    let matches = [];

    /**
     *  Level 1: extension match - note doesn't depend on Thing
     */
    const _level_1 = function() {
        matches = matches.concat(
            vocabulary.extensions(paramd.requestd)
                .map(xd => ({
                    level: 10,
                    extension: _.d.clone.shallow(xd),
                }))
            );

        /*
        xds.map(function(xd) {
            var resultd = {
                level: 10,
                extension: _.d.clone.shallow(xd),
            };
            matches.push(resultd);
        });

        var xds = vocabulary.extensions(paramd.requestd);
        xds.map(function(xd) {
            var resultd = {
                level: 10,
                extension: _.d.clone.shallow(xd),
            };
            matches.push(resultd);
        });
        */

        /*
        if (xds.length) {
            console.log("PARAMD", paramd.requestd)
            console.log("XDS", xds)
            process.exit();
        };
         */
    };

    /**
     *  Level 2: action and thing; or query and thing match
     */
    const _level_2 = function(thingd) {
        var cost = 0;

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

        // if no match, do a match by name of the thing
        if (!match_td) {
            var by_named = _prepare_item({
                "schema:name": paramd.requestd.thing,
            });

            if (_match_object(by_named, meta)) {
                console.log("NAME MATCH", by_named, meta);

                match_td = true;
                cost = 7;
            }
        }

        if (!match_td) {
            return;
        }

        /*
         *  band:istate and band:ostate match - on individual attributes
         */
        var match_attribute_code = null;
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
                        match_attribute_code = attribute_code;
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

        if (paramd.verbose) {
            logger.info({
                thing_name: _.ld.first(thingd.meta, "schema:name", ""),
                id: thingd.id,
            }, "MATCH (verbose)");
        };

        var resultd = {
            "level": 20,
            "response": "ok",
            "thing-id": thingd.id,
        };

        var ivalue = _.d.get(thingd.istate, match_attribute_code, null);
        var ovalue = null;

        if (match_ad.do) {
            /**
             *  This will REALLY be improved when we get the next-gen stuff
             *  working in IOTDB so we don't have to replicate all those rules here
             */
            var dod = match_ad.do;
            var dvalue = match_ad.do["@value"];
            if (dvalue === undefined) {
                dvalue = null;
            }
            var rule = dod["rule"] || "set";

            var amin = _.ld.first(match_attribute, "iot:minimum", null);
            var amax = _.ld.first(match_attribute, "iot:maximum", null);
            var atype = _.ld.first(match_attribute, "iot:type");
            var aunit = _.ld.first(match_attribute, "iot:unit");
            if (atype === "iot:type.boolean") {
                amin = false;
                amax = true;
            } else if (aunit === "iot-unit:math.fraction.unit") {
                amin = amin || 0;
                amax = amax || 1;
            } else if (aunit === "iot-unit:math.fraction.percent") {
                amin = amin || 0;
                amax = amax || 100;
            }

            if (rule === "set") {
                ovalue = dvalue;
            } else if (rule === "toggle") {
                if (ivalue === null) {
                } else if (amax === null) {
                } else if (amin === null) {
                } else if (ivalue === amax) {
                    ovalue = amin;
                } else {
                    ovalue = amax;
                }
            } else if (rule === "delta") {
                if ((ivalue === null) && (amin !== null)) {
                    ivalue = amin;
                }
                if (ivalue !== null) {
                    ovalue = ivalue + dvalue;
                }
            } else if (rule === "delta-percent") {
                if ((ivalue === null) && (amin !== null)) {
                    ivalue = amin;
                }
                if (amax === null) {
                } else if (amin === null) {
                } else if (ivalue !== null) {
                    ovalue = ivalue + (amax - amin) * dvalue / 100.0;
                }
            }

            if ((amin !== null) && (ovalue < amin)) {
                ovalue = amin;
            }
            if ((amax !== null) && (ovalue > amax)) {
                ovalue = amax;
            }

            resultd.ostate = {};
            resultd.ostate[match_attribute_code] = ovalue;
        }

        if (match_ad.response) {
            resultd.response = format.format(match_ad.response, { 
                name: _.ld.first(thingd.meta, "schema:name"),
                value: _.d.get(thingd.istate, match_attribute_code),
            });
        }

        matches.push(resultd);
        return true;
    };

    _level_1();

    paramd.transport
        .all({})
        .subscribe(
            thingd => {
                if (paramd.verbose) {
                    logger.info({
                        thing_name: _.ld.first(thingd.meta, "schema:name", ""),
                        id: thingd.id,
                    }, "check (verbose)");
                }

                _level_2(thingd);
            },
            error => { done(error); done = _.noop; },
            finished => done(null, matches)
        );
};

/**
 */
exports.match = match;
