# iotdb-commands
Apply human-like commands to [IOTDB](https://github.com/dpjanes/node-iotdb) Things

<img src="https://raw.githubusercontent.com/dpjanes/iotdb-homestar/master/docs/HomeStar.png" align="right" />

# About

This applies "human like" commands to things. For example, "turn up" the "lights".
Note that this does _not_ do NLP processing, we assume requests are 
already structured as so:

    {
        "thing": "TV",
        "action": "turn on"
    }

This then will look through any [transporter]() you provide to file matching things,
based on the their current state, metadata, etc.

## Vocabulary

See the folder [vocabulary](vocabulary). 
Everything is written in YAML.

# Use

## Request Object

We assume there's something doing some parsing beforehand, and we're down to the core data.
This doesn't do any clever NLP stuff. That's what your Amazon Echo (etc) are for.

### Actions

Input Requests look like this:

    {
        "thing": "TV",
        "action": "turn on"
    }


A special action is `forget`, which will delete the Thing from the Transporter.
If the Transporter is IOTDB, it will disconnect the Thing.

### Query

List all the Things that are on

    {
        "thing": "TV",
        "action": "on"
    }

A special action is `list`, which will list everything

## Zones

Requests can be specifically restricted to a Zone

    {
        "thing": "TV",
        "action": "off",
        "zone": "Second Floor",
    }

## Code

Here's a basic example to directly manipulate a WeMo Socket. 
There's a fair bit of setup, but we hope it's worth it.

    const iotdb = require("iotdb")
    const _ = iotdb._;

    const iotdb_commands = require("iotdb-commands")

    iotdb.use("homestar-wemo")
    iotdb.connect("WeMoSocket")

    const iotdb_transport_iotdb = require("iotdb-transport-iotdb")
    const iotdb_transporter = iotdb_transport_iotdb.make({}, iotdb.things())

    iotdb_commands.match({
        transporter: iotdb_transporter,
        requestd: {
            action: "turn on",   // or try: query: "on"
            thing: "lights",
        }
    }, ( error, matches ) => {
        matches.forEach(matchd => iotdb_commands.execute(iotdb_transporter, matchd, error => {
            …
        });
    })

## Command Line

If you [installed Home☆Star](https://github.com/dpjanes/node-iotdb/blob/master/docs/homestar.md) 
youll be able to try it from the command line

    $ homestar --thing "tv" --action "turn on"
    
Note that this assumes you're in an environment set up by
[homestar-persist](https://github.com/dpjanes/homestar-persist), so don't 
tear your hair out if this doesn't work for you immediately.

# Development

## Examples
Try it out using

    $ node tools/RunSamples samples/tests/action-lights-turn-up.json | bunyan
    $ node tools/RunSamples samples/tests/query-tv-channel.json | bunyan

The `samples` folder is where all the sample data is stored. Eventually we'll
have sample results, so `RunSamples` will work to run test caes

## Test Cases

There are numerous test cases in [test](test). These
are independent of the samples (next sction).

## More Test Cases

The folders `samples/tests` Have input Requests to test against
The folder `samples/things` are the "Things" to test with

