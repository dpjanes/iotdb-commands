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

const assert = require('assert');

const iotdb_thing = require('iotdb-thing');
const iotdb_format = require('iotdb-format');

const vocabulary = require('./vocabulary');
const normalize = require('./normalize');

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
                    o[word] = normalize.word(value);
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
const match = function(_paramd, done) {
    const paramd = _.d.compose.shallow(_paramd, {
        user: null,
        verbose: false,
        transporter: null,

        // the query
        thing: null,
        action: null,
        query: null,
        argument: null,
        zone: null,
    });

    assert.ok(paramd.transporter, "param.transporter expected");

    [ "thing", "action", "query", "argument", "zone" ]
        .map(key => { paramd["_" + key] = paramd[key]; return key })
        .filter(key => paramd[key] !== null)
        .forEach(key => paramd[key] = normalize[key](paramd[key]));


    const match_header = {
        "action": "header",
        "header": {
            "thing": {
                "thing": "thing",
                "things": "things",
            }
        },
    }

    let matches = [
        match_header,
    ];

    const _format_header = () => {
        let template = "";
        const count = matches.length - 1;
        const header_action = match_header.header.action;
        if (header_action) {
            template = header_action.response;

            if ((count === 0) && header_action.zero) {
                template = header_action.zero;
            } else if ((count === 1) && header_action.one) {
                template = header_action.one;
            }
        } else if (count === 0) {
            template = "{{ doer }} found no {{ things }}";
        } else if (count === 1) {
            template = "{{ doer }} found {{ count }} {{ thing }}";
        } else {
            template = "{{ doer }} found {{ count }} {{ things }}";
        }

        assert.ok(template);

        const templated = {
            count: count,
            thing: match_header.header.thing.thing,
            things: match_header.header.thing.things,
            argument: paramd._argument,
            doer: "HomeStar",
            doer_is: "HomeStar is",
        }

        match_header.response = iotdb_format.format(template, templated);
        match_header.count = count;
    };

    // extensions - basically an override
    const xds = _prepare_items(vocabulary.extensions(paramd));

    // thing definitions - what to match - if present, required
    const tds = _prepare_items(vocabulary.things(paramd.thing));

    if (paramd.thing && _.is.Empty(tds)) {
        logger.info({
            thing: paramd.thing,
        }, "no matching thing");

        match_header.header.action = match_header.header.action || {
            zero: "{{ doer }} didn't find this type of thing",
        }

        _format_header();
        return done(null, matches);
    }

    // action and query definitions - what to do
    const ads = 
                _prepare_items(vocabulary.actions(paramd.action))
        .concat(_prepare_items(vocabulary.querys(paramd.query)))
        .filter(ad => !ad.argument || 
                      (ad.argument === paramd.argument) || 
                      (ad.argument === "*") || 
                      (_.is.Array(ad.argument) && ad.argument.indexOf(paramd.argument) > -1)
            );

    if (paramd.verbose) {
        logger.info({
            method: "match",
            request: {
                thing: paramd.thing,
                action: paramd.action,
                query: paramd.query,
                argument: paramd.argument,
            },
            match: {
                things: tds,
                attributes: ads,
            }
        }, "initial parameters (verbose)");
    }

    /**
     *  Level 1: extension match - note doesn't depend on Thing
     */
    const _level_1 = function() {
        matches = matches.concat(
            vocabulary.extensions(paramd)
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

            const match_td = tds.find(td => _match_object(td.meta, meta) ? td.meta : null);
            if (!match_td) {
                return;
            }

            if (match_td.header) {
                match_header.header.thing = _.d.compose.shallow(match_td.header, match_header.header.thing);
            }
        }

        // zone must be present if present
        if (paramd.zone) {
            const zones = _.ld.list(thingd.meta, "iot:zone", []).map(normalize.zone);
            if (zones.indexOf(paramd.zone) === -1) {
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

        const is_read = _.ld.first(match_ad._attribute, "iot:read");

        let ivalue = thing.get(match_ad._code);  
        if (!is_read) {
            ivalue = undefined;
        }

        if ((match_ad.match.value !== undefined) && (ivalue !== match_ad.match.value)) {
            return;
        }

        match_header.header.action = match_header.header.action || match_ad.header || null;

        if (match_ad.do) {
            do {
                const rule = match_ad.do.rule || "set";
                if (rule === "remove") {
                    resultd.action = "remove"
                    break;
                }

                let amin = _.ld.first(match_ad._attribute, "iot:minimum", null);
                let amax = _.ld.first(match_ad._attribute, "iot:maximum", null);
                const ainstantaneous = _.ld.first(match_ad._attribute, "iot:instantaneous");
                const atype = _.ld.first(match_ad._attribute, "iot:type");
                const aunit = _.ld.first(match_ad._attribute, "iot:unit");
                const munit = _.ld.first(match_ad.do, "iot:unit");

                let ovalue = null;
                let dvalue = match_ad.do.value;
                if ((match_ad.argument === "*") || _.is.Array(match_ad.argument)) {
                    dvalue = paramd._argument;  // note not the normalized one!
                    dvalue = _.coerce.coerce(dvalue, _.ld.list(match_ad._attribute, "iot:type"));
                } else if (dvalue === undefined) {
                    dvalue = _.timestamp.make();
                }

                if (atype === "iot:type.boolean") {
                    amin = false;
                    amax = true;
                } else if (aunit === "iot-unit:math.fraction.unit") {
                    amin = amin || 0;
                    amax = amax || 1;
                } else if (aunit === "iot-unit:math.fraction.percent") {
                    amin = amin || 0;
                    amax = amax || 100;
                } else if (aunit && munit && (aunit !== munit)) {
                    ivalue = _.convert.convert({
                        from: aunit,
                        to: munit,
                        value: ivalue,
                    });
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

                // convert units back to original
                if (aunit && munit && (aunit !== munit)) {
                    ovalue = _.convert.convert({
                        from: munit,
                        to: aunit,
                        value: ovalue,
                    });
                }

                // make sure the correct type
                if (!ainstantaneous) {
                    ovalue = _.coerce.coerce(ovalue, _.ld.list(match_ad._attribute, "iot:type"));
                }

                let enums = _.d.get(match_ad._attribute, "iot:enumeration");
                if (enums) {
                    if (_.is.Dictionary(enums)) {
                        const match = _.pairs(enums).find(kv => kv[0] === ovalue);
                        if (!match) {
                            return;
                        }

                        ovalue = match[1]; 
                    } else {
                        if (!_.coerce.list(enums).find(key => key === ovalue)) {
                            return;
                        }
                    }

                }

                resultd.action = "update"
                resultd.band = "ostate"
                resultd.value = {};
                resultd.value[match_ad._code] = ovalue;
            } while (false);
        }

        if (match_ad.response) {
            resultd.action = resultd.action || "response";
            resultd.response = iotdb_format.format(match_ad.response, { 
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
            finished => {
                _format_header();
                done(null, matches)
            }
        );
};

/**
 */
exports.match = match;
