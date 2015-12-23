#!/usr/bin/env node

var WebPageTest = require('webpagetest'); // Documentation on: https://www.npmjs.com/package/webpagetest
var influx = require('influx')

// TODO: Extract config? Serialize and fetch from environment?
var influxClient = influx({
    host : 'INFLUX_DB_HOSTNAME_OR_IP',
    port : 8086,
    protocol : 'http',
    username : 'apikey',
    password : 'MD5_HASH_TO_AVOID_PASSWORD_IN_CONFIG',
    database : 'your_db_name'
})

influxClient.getDatabaseNames( function(err, arrayDatabaseNames){
   console.log('Found influx database: ' + arrayDatabaseNames);
});

var process_testurl = (process.env.testurl? process.env.testurl : null);
var process_apikey = (process.env.apikey? process.env.apikey : null);
var process_timeout = parseInt(process.env.timeout? process.env.timeout : 500);
var process_testruns = parseInt(process.env.testruns? process.env.testruns : 2);
var process_buildnumber = parseInt(process.env.buildnumber? process.env.buildnumber : -1);
var process_speedtestserver = (process.env.speedtestserver? process.env.speedtestserver : 'http://www.webpagetest.org/'); // Default public server, or use your local webpagetest installation by replacing with your ip here
var process_consoletimer = parseInt(process.env.consoletimer? process.env.consoletimer : 10);

// Parameter checks
if(process_testurl==null) throw new Error('Missing ENV parameter TESTURL');
if(process_apikey==null) throw new Error('Missing ENV parameter APIKEY')
if(process_buildnumber==-1) throw new Error('Missing ENV parameter BUILDNUMBER. Needs to be set to track trend over time.')

var timerId = startConsoleTimer(process_consoletimer); // Define and run a console timer to give feedback

var wpt = new WebPageTest(process_speedtestserver, process_apikey);
console.log('Running pagespeedtest on url "'+process_testurl+'" using server "'+process_speedtestserver+'". Requiring results within: '+process_timeout+' seconds');
var runStart = new Date().getTime()

wpt.runTest(process_testurl, {pollResults: 10, timeout: process_timeout, runs: process_testruns, pageSpeed: true}, function(err, response) {

	var testDurationMs = (new Date().getTime()-runStart)
	console.log('Test run time: ' + (testDurationMs>1? (testDurationMs/1000) + ' seconds' : 'NA'))

	if(err) throw new Error("Could not run webpagetest for url: '" + process_testurl + "', ERROR: " + JSON.stringify(err))

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
            influxClient.writePoint('webpagetest', {value: firstView.SpeedIndex, value2: repeatView.SpeedIndex} , { 'buildnumber': process_buildnumber, 'testurl': escapeInfluxDbWrite(process_testurl), 'repeatruns': process_testruns}, function(done) {
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
