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

const iotdb_thing = require('iotdb-thing');
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
        if (!item.match) {
            item.match = {};
        }

        if (!item.match["iot:purpose"] && item.do["iot:purpose"]) {
            item.match["iot:purpose"] = item.do["iot:purpose"];
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

/**
 */
const _match_object = (queryd, targetd) => 
    _.keys(queryd)
        .filter(query_key => query_key.indexOf(':') !== -1)
        .find(query_key => {
            const query_values = _.ld.list(queryd, query_key, []);
            const target_values = _.ld.list(targetd, query_key, []);
            const common = _.intersection(query_values, target_values);

            return common.length > 0;
        })

// remove all keys that don't have a ":"
const _strip_non_colon = d => _.d.transform(d, {
    key: (key) => key.indexOf(":") > -1 ? key : undefined,
})


/**
 */
const match = function(paramd, done) {
    paramd = _.d.compose.shallow(paramd, {
        user: null,
        verbose: false,
        transporter: null,
        requestd: null,
    });

    if (!paramd.transporter) {
        throw new Error("param.transporter expected");
    }
    if (!paramd.requestd) {
        throw new Error("param.requestd expected");
    }

    if (paramd.requestd.argument) {
        paramd.requestd.argument = _normalize_word(paramd.requestd.argument);
    }

    // extensions - basically an override
    const xds = _prepare_items(vocabulary.extensions(paramd.requestd));

    // thing definitions - what to match - if present, required
    const tds = _prepare_items(vocabulary.things(paramd.requestd.thing));

    if (paramd.requestd.thing && _.is.Empty(tds)) {
        logger.info({
            thing: paramd.requestd.thing,
        }, "no matching thing");

        return done(null, []);
    }

    // action and query definitions - what to do
    const ads = 
                _prepare_items(vocabulary.actions(paramd.requestd.action))
        .concat(_prepare_items(vocabulary.querys(paramd.requestd.query)))
        .filter(ad => !ad.argument || (ad.argument === paramd.requestd.argument));

    if (paramd.verbose) {
        logger.info({
            method: "match",
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

    };

    /**
     *  Level 2: action and thing; or query and thing match
     */
    const _level_2 = function(thingd) {
        var cost = 0;

        if (!_.is.Empty(tds)) {
            // band:meta match
            const meta = _prepare_item(thingd.meta, paramd);

            let match_td = tds.find(td => _match_object(td.meta, meta) ? td.meta : null);

            // if no match, do a match by name of the thing
            if (!match_td) {
                var by_named = _prepare_item({
                    "schema:name": paramd.requestd.thing,
                });

                if (_match_object(by_named, meta)) {
                    // console.log("NAME MATCH", by_named, meta);

                    match_td = true;
                    cost = 7;
                }
            }

            if (!match_td) {
                return;
            }
        }

        // band:istate and band:ostate match - on individual attributes
        let thing;
        try {
            thing = iotdb_thing.make(thingd);
        } catch (x) {
            return;
        }

        let match_ad = ads.find(ad => thing.attribute(_strip_non_colon(ad.match)));
        if (!match_ad) {
            return;
        }

        match_ad = _.d.clone.shallow(match_ad);
        match_ad._attribute = thing.attribute(_strip_non_colon(match_ad.match));
        match_ad._code = _.id.code.from.attribute(match_ad._attribute);

        if (paramd.verbose) {
            logger.info({
                method: "match",
                thing_name: _.ld.first(thingd.meta, "schema:name", ""),
                id: thingd.id,
            }, "MATCH (verbose)");
        };

        const resultd = {
            "level": 20,
            "response": "ok",
            "id": thingd.id,
            "thing": thingd,
        };

        let ivalue = thing.get(match_ad._code);  

        if ((match_ad.match.value !== undefined) && (ivalue !== match_ad.match.value)) {
            return;
        }

        if (match_ad.do) {
            do {
                const rule = match_ad.do["rule"] || "set";
                if (rule === "remove") {
                    resultd.action = "remove"
                    break;
                }

                let ovalue = null;
                let dvalue = match_ad.do.value;
                if (dvalue === undefined) {
                    dvalue = _.timestamp.make();
                }

                let amin = _.ld.first(match_ad._attribute, "iot:minimum", null);
                let amax = _.ld.first(match_ad._attribute, "iot:maximum", null);
                const atype = _.ld.first(match_ad._attribute, "iot:type");
                const aunit = _.ld.first(match_ad._attribute, "iot:unit");
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

                let enums = _.d.get(match_ad._attribute, "iot:enumeration");
                if (enums) {
                    if (_.is.Dictionary(enums)) {
                        enums = _.keys(enums);
                    } else {
                        enums = _.coerce.list(enums);
                    }

                    if (enums.indexOf(ovalue) === -1) {
                        return;
                    }

                }

                resultd.action = "update"
                resultd.band = "ostate"
                resultd.value = {};
                resultd.value[match_ad._code] = ovalue;
            } while (false);
        }

        if (match_ad.response) {
            resultd.response = format.format(match_ad.response, { 
                name: thing.name(), 
                value: thing.get(match_ad._code), 
            });
        }

        matches.push(resultd);
        return true;
    };

    _level_1();

    paramd.transporter
        .all({})
        .subscribe(
            thingd => {
                if (paramd.verbose) {
                    logger.info({
                        method: "match",
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
