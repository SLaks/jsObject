///<reference path="../jsObject.IntelliSense.js"/>

var runFirebug = jsObject.createFunction("runFirebug", "jsTest.TestingContext context", function(context) {
	var cGroup = false;
	var lastSuccesses = 0, lastFailures = 0;
	//context.tests.sortBy("group");
	
	var results = new jsTest.TestResults();
	
	results.testBegun.addHandler(function(test, result) {
		if(cGroup !== test.group()) {
			if(cGroup) {
				var s = this.successCount - lastSuccesses, f = this.failureCount - lastFailures;
				console.info(" %i success" + (s === 1 ? "" : "es") + ", %i failure" + (f === 1 ? "" : "s"), s, f);
				lastSuccesses = this.successCount;
				lastFailures = this.failureCount;
				console.groupEnd();
			}
			cGroup = test.group();
			console.group(cGroup);
		}
		
		console.group(" %s - %o", test.name(), test);
	});
	results.itemLogged.addHandler(function(item) {
		switch(item.level) {
			case jsTest.LogLevel.success:
				console.log(item.message);
				break;
			case jsTest.LogLevel.info:
				console.info(item.message);
				break;
			case jsTest.LogLevel.warning:
				console.warn(item.message);
				break;
			case jsTest.LogLevel.error:
				console.error(item.message);
				break;
		}
	});
	results.testFailed.addHandler(function(test, result) {
		console.warn("Test FAILED");
	});
	results.testCompleted.addHandler(function(test, result) {
		console.info("Test completed in %i ms", result.duration);
		console.groupEnd();
	});
	results.testsCompleted.addHandler(function(result) {
		console.profileEnd();
		var s = result.successCount - lastSuccesses, f = result.failureCount - lastFailures;
		console.info(" %i success" + (s === 1 ? "" : "es") + ", %i failure" + (f === 1 ? "" : "s"), s, f);
		console.groupEnd();
		console.info("All tests completed - %i success" + (result.successCount === 1 ? "" : "es") + ", %i failure" + (result.successCount === 1 ? "" : "s"), result.successCount, result.failureCount);
	});
	
	//console.profile(context);
	return context.runTests(results);
});