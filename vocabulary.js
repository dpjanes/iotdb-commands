/*
 *  vocabulary.js
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
    module: "vocabulary",
});

var fs = require('fs');
var path = require('path');

var stemmer = require('porter-stemmer').stemmer;
var yaml = require('js-yaml');

var _normalize = function(v) {
    if (v.match(/^:/)) {
        return "iot-purpose" + v;
    } else {
        return v;
    }
};

var normalize_action = function(s) {
    return s.toLowerCase();
};

var normalize_thing = function(s) {
    return stemmer(s.toLowerCase());
};

var actiondsd = {};
var thingdsd = {};

/**
 *  This is called by '_load_vocab' many times. 
 *  It will deal  with one vocabulary dictionary
 */
var _process_vocab = function(d) {
    if (d["action"]) {
        _process_action(d);
    } else if (d["thing"]) {
        _process_thing(d);
    } else {
        logger.error({
            method: "_process_vocab",
            d: d,
            cause: "likely problem with YAML source file",
        }, "expected thing|action");
        return;
    }
};

var _process_action = function(d) {
    if (d["actuator"]) {
        d["iot:purpose"] = _normalize(d["actuator"]);
        d["iot:actuator"] = true;
    } else if (d["sensor"]) {
        d["iot:purpose"] = _normalize(d["sensor"]);
        d["iot:sensor"] = true;
        _process_sensor(d);
    } else {
        logger.error({
            method: "_process_vocab",
            d: d,
            cause: "likely problem with YAML source file",
        }, "expected acutator|sensor");
        return;
    }

    d = _.ld.compact(d);

    var action = normalize_action(d["action"]);
    var actionds = actiondsd[action];
    if (actionds === undefined) {
        actionds = [];
        actiondsd[action] = actionds;
    }

    actionds.push(d);
};

var _process_thing = function(d) {
    d = _.ld.compact(d);

    var thing = normalize_thing(d["thing"]);
    var thingds = thingdsd[thing];
    if (thingds === undefined) {
        thingds = [];
        thingdsd[thing] = thingds;
    }

    thingds.push(d);
}

var loaded = false;

/**
 *  This will load all the vocabulary YAML files
 *  in the folder "vocabulary". It is safe to
 *  call multiple times
 */
var _load_vocabulary = function() {
    if (loaded) {
        return;
    }
    loaded = true;

    var vocab_root = path.join(__dirname, "vocabulary");

    var vocab_files = fs.readdirSync(vocab_root);
    vocab_files.sort();

    vocab_files.map(function(vocab_file) {
        if (vocab_file.match(/^[.]/)) {
            return;
        } else if (!vocab_file.match(/[.]yaml$/)) {
            return;
        }

        var vocab_path = path.join(vocab_root, vocab_file);

        logger.info({
            method: "_load_vocabulary",
            path: vocab_path,
        }, "loading vocabulary");
   
        var raw = fs.readFileSync(vocab_path, 'utf8');
        yaml.safeLoadAll(raw, function(d) {
            if (!_.is.Dictionary(d)) {
                return;
            }

            d["@src"] = vocab_path;
            _process_vocab(d);
        })
    });

};

/**
 *  Return the things corresponding to the name
 */
var things = function(name) {
    if (!name || !_.is.String(name)) {
        return [];
    }

    _load_vocabulary();

    var name = normalize_thing(name);
    var thingds = thingdsd[name];
    if (thingds === undefined) {
        return [];
    } else {
        return thingds;
    }
};

/**
 *  Return the actions corresponding to the name
 */
var actions = function(name) {
    if (!name || !_.is.String(name)) {
        return [];
    }

    _load_vocabulary();

    var name = normalize_action(name);
    var actionds = actiondsd[name];
    if (actionds === undefined) {
        return [];
    } else {
        return actionds;
    }
};

/**
 *  API
 */
exports.things = things;
exports.actions = actions;
