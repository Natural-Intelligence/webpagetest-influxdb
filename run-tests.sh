#!/bin/bash
cd "$(dirname "$0")"

if [ -z "$2" ]; then
	echo "Usage: runtests.sh <url-to-test> <apikey> [location]"
	exit 1;
fi;

# OLD: ./node_modules/webpagetest/bin/webpagetest test $1 --key $2
export TESTURL=$1
export APIKEY=$2
if [ -z "$3" ]; then
	export LOCATION=$3
fi;
export TIMEOUT=300
export TESTRUNS=3

node ./run-speedtest.js

