# Webpagetest to InfluxDB

## Introduction

This is a small Node.js script to run automated website speedtests. It facilitates the [webpagetest tool](http://www.webpagetest.org/), either the public or your private installations. The result data is stored in [InfluxDB](https://influxdata.com/) for further analysis in [Grafana](http://grafana.org/) (templates will be provided at a later state).
The original version of that script is from [kjelloe](https://github.com/kjelloe/webpagetest).

## Setup

- Clone the repository `git clone https://github.com/siedi/webpagetest-influxdb.git`.
- If you want to use the public servers from webpagetest you have to [request](http://www.webpagetest.org/getkey.php) an API key first.
- Rename config.json.example to config.json and make your changes:
```
{
  "consoletimer" : 10,                             # how often we print out something on the console while we are waiting for the test results
  "wpt" : {
    "apikey" : "ADD_YOUR_KEY_HERE",                # your API key
    "location" : "Dulles:Chrome",                  # the default agent location, can be overwritten when running the individual test
    "timeout" : 500,                               # how long the scripts waits for reults from the agents, can sometimes take a long time, you might want to increase it
    "testruns" : 3,                                # should be odd and larger than 1, the higher the better, but keep your limit in mind
    "testserver" : "http://www.webpagetest.org/"   # change if your are running our provide instance
  },
  "influx" : {
    "host" : "INFLUX_DB_HOSTNAME_OR_IP",           # something like 127.0.0.1
    "port" : 8086,                                 # port to the InfluxDB, 8086 is the default
    "protocol" : "http",                           # protocol, http is the default
    "username" : "INFLUX_USER",                    # you should have created a user when installing your influxdb
    "password" : "INFLUX_PW",                      # you might want to md5 has it to avoid a clear text pw in here
    "database" : "INFLUX_DB"                       # create a new database in your influxdb instance first
  }
}
```
- Run npm install

Your are done with the setup.

## Run

### Via Bash script

There is a bash script provides which sets the necessary environment for the script and launches the ndoe script:

```bash
./run-tests.sh
  Usage: runtests.sh [-k <apikey>] [-l <location>] [-n <label>] <url-to-test>
```

Minimal command

```bash
./run-tests.sh http://www.google.com/
```

Command giving a label for the test (stored as a tag in InfluxDB) and a different webpagetest agent location (you should have received a list when applying for the API key)

```bash
./run-tests.sh -n Google-Homepage -l ec2-eu-west-1:Chrome http://www.google.com/
```

### Adding to your crontab

To run the test regularly, e.g. hourly, just add it to the crontab

```bash
crontab -e
  1 * * * *    /root/webpagetest-influxdb/run-tests.sh -n Google-Homepage -l ec2-eu-west-1:Chrome http://www.google.com/ > /dev/null
```

Keep the frequency in mind, there is a daily limit on the public server of max. 200 requests.
