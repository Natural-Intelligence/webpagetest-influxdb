var WebPageTest = require('webpagetest'); // Documentation on: https://www.npmjs.com/package/webpagetest

var process_testurl = (process.env.testurl? process.env.testurl : null);
var process_apikey = (process.env.apikey? process.env.apikey : null);
var process_timeout = parseInt(process.env.timeout? process.env.timeout : 500);
var process_testruns = parseInt(process.env.testruns? process.env.testruns : 2);
var process_speedtestserver = (process.env.speedtestserver? process.env.speedtestserver : 'http://www.webpagetest.org/'); // Default public server available is: http://www.webpagetest.org/

// Parameter checks
if(process_testurl==null) throw new Error('Missing ENV parameter TESTURL');
if(process_apikey==null) throw new Error('Missing ENV parameter APIKEY')

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
			
		});
	});
});
