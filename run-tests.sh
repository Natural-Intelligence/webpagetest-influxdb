#!/bin/bash
cd "$(dirname "$0")"

if [ -z "$1" ]; then
  echo "Usage: runtests.sh [-k <apikey>] [-l <location>] [-n <label>] [-u2 <url2>] <url1>"
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
    -n | --name )
      shift
      nodeenv+=" LABEL=$1"
      ;;
    -r | --runs )
      shift
      nodeenv+=" RUNS=$1"
      ;;
    -v | --video )
      shift
      nodeenv+=" VIDEO=$1"
      ;;
    -y | --connectivity )
      shift
      nodeenv+=" CONNECTIVITY=$1"
      ;;
    -u2 | --url2 )
      shift
      nodeenv+=" TESTURL2=$1"
      ;;
    * )
      nodeenv+=" TESTURL=$1"
      break
  esac
  shift
done

env $nodeenv node ./run-speedtest.js
