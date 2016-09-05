# iotdb-commands
Apply Human-Like commands to Things

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

# Vocabulary

See the folder [vocabulary](vocabulary). 
Everything is written in YAML.

# Use

Try it out using

    $ node tools/RunSamples samples/tests/action-lights-turn-up.json | bunyan
    $ node tools/RunSamples samples/tests/query-tv-channel.json | bunyan

The `samples` folder is where all the sample data is stored. Eventually we'll
have sample results, so `RunSamples` will work to run test caes

## Folders

The folders

    samples/tests

Have input Requests to test against

The folder

    samples/things

are the "Things" we test with


# Code

Input Requests look like this:

    {
        "thing": "TV",
        "action": "turn on"
    }

I.e. we assume there's something doing some parsing beforehand, and we're down to the core data.

You use the `match` function with a `transporter` which holds all your Things. The 
`match` function will return an array of matches.

Each match has a level, always numerically sorted from lowest to highest. The thinking is 
code executing only use the first level they see. This sounds like nonsense and we'll probably
just trim the list the right way.
