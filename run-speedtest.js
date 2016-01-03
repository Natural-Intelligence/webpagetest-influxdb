#!/usr/bin/env node

var fs = require("fs");
if(!fs.existsSync(__dirname + '/config.json')) {
  console.error("Configuration file is missing! ('config.json')");
  process.exit(100);
}

var WebPageTest = require('webpagetest'); // Documentation on: https://www.npmjs.com/package/webpagetest
var influx = require('influx')
var config = require(__dirname + '/config.json');

var testurl = process.env.TESTURL || null;
var testlabel = process.env.LABEL || null;
config.wpt.apikey = process.env.APIKEY || config.wpt.apikey;
config.wpt.location = process.env.LOCATION || config.wpt.location;
config.wpt.timeout = parseInt(process.env.TIMEOUT) || config.wpt.timeout;
config.wpt.testruns = parseInt(process.env.TESTRUNS) || config.wpt.testruns;
var buildnumber = parseInt(process.env.BUILDNUMBER) || 0;
config.wpt.testserver = process.env.TESTSERVER || config.wpt.testserver;
config.consoletimer = parseInt(process.env.consoletimer) || config.consoletimer;

// Parameter checks
if(testurl==null) throw new Error('Missing ENV parameter TESTURL');

var influxClient = influx(config.influx);

influxClient.getDatabaseNames( function(err, arrayDatabaseNames){
  console.log('Found influx database: ' + arrayDatabaseNames);
});

var influxTags = { 
  'testurl': escapeInfluxDbWrite(testurl),
  'location': escapeInfluxDbWrite(config.wpt.location),
  'repeatruns': config.wpt.testruns
};

if(buildnumber) influxTags.buildnumber = buildnumber;
if(testlabel) influxTags.label = testlabel;

var timerId = startConsoleTimer(config.consoletimer);

var wpt = new WebPageTest(config.wpt.testserver, config.wpt.apikey);
console.log('Running pagespeedtest on url "'+testurl+'" using server "'+config.wpt.testserver+'" with location "'+config.wpt.location+'". Requiring results within: '+config.wpt.timeout+' seconds');
var runStart = new Date().getTime()

wpt.runTest(testurl, {location: config.wpt.location, pollResults: 10, timeout: config.wpt.timeout, runs: config.wpt.testruns, pageSpeed: true}, function(err, response) {

	var testDurationMs = (new Date().getTime()-runStart)
	console.log('Test run time: ' + (testDurationMs>1? (testDurationMs/1000) + ' seconds' : 'NA'))

	if(err) throw new Error("Could not run webpagetest for url: '" + testurl + "', ERROR: " + JSON.stringify(err))

	var testId = response.data.id

	wpt.getTestStatus(testId, function(err, response) {

		if(err || response.data.statusText!='Test Complete') throw new Error('WebPageTest was not completed. Status: ' + (err || response.data.statusText))

		wpt.getTestResults(testId, function(err, testData) {

			if(err) throw new Error("Could not get test results for testId: " + testId)

			console.log('Test highlights:')
			
			console.log('TestUrl: ' + testData.data.url)
			console.log('TestSummary: ' + testData.data.summary)

			console.log('Test timings:')
			console.log('SpeedIndex', 'firstPaint', 'visualComplete', 'waterfall')
			var firstView = testData.data.median.firstView;
			console.log( firstView.SpeedIndex, firstView.firstPaint, firstView.visualComplete, firstView.images.waterfall)
			var repeatView = testData.data.median.repeatView;
			console.log( repeatView.SpeedIndex, repeatView.firstPaint, repeatView.visualComplete, repeatView.images.waterfall)

            // Post speed indexes to results db, tag with build number and url for reference
            influxClient.writePoint('webpagetest', {value: firstView.SpeedIndex, value2: repeatView.SpeedIndex} , influxTags, function(done) {
               console.log('Influx db response: '); console.log( (done==null? 'OK' : done) );
               stopConsoleTimer();
            });
		});
	});
});

// Need to escape space and equals in https://influxdb.com/docs/v0.9/write_protocols/write_syntax.html
function escapeInfluxDbWrite(str) {
  return str.replace(/[ =,]/g, "\\$&");
}
// Basic console time to give user a sense of feedback by waiting for test
function startConsoleTimer(waitIntervalSeconds) {
    if(waitIntervalSeconds===undefined || waitIntervalSeconds==0) return;
    var timerSeconds = 0
    return setInterval( function() {
        timerSeconds += waitIntervalSeconds
        console.log(timerSeconds + ' seconds passed');
    }, (waitIntervalSeconds*1000));
};

function stopConsoleTimer() {
    clearInterval(timerId); // Stopping timer after ending test
};
