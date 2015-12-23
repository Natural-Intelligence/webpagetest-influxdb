#!/usr/bin/env node

if(process.argv.length<4) { throw Error('Missing parameters. \nUsage: ./read-json-config <filename.json> <parameter-to-extract>'); }

var fs = require('fs')
var jsonString = fs.readFileSync(process.argv[2], 'utf8');
var jsonObject = JSON.parse(jsonString.substr(jsonString.indexOf('{'))); // NOTE: Stripping any form of preamble
var data = jsonObject[process.argv[3]]; // NOTE: Currently only supports property on first level object. Expand to use i.e. lodash-deep for xpath-style lookup in json tree
process.stdout.write(data);
