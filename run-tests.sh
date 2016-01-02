#!/bin/bash
cd "$(dirname "$0")"

if [ -z "$1" ]; then
  echo "Usage: runtests.sh [-k <apikey>] [-l <location>] <url-to-test>"
  exit 1;
fi;

nodeenv=""

while [ "$1" != "" ]; do
  case $1 in
    -k | --key | --apikey )
      shift
      nodeenv+=" APIKEY=$1"
      ;;
    -l | --location )
      shift
      nodeenv+=" LOCATION=$1"
      ;;
    * )
      nodeenv+=" TESTURL=$1"
      break
  esac
  shift
done

env $nodeenv node ./run-speedtest.js

