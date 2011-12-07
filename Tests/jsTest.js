///<reference path="../jsObject.IntelliSense.js"/>
//jsTest.js
//This script depends on jsObject.
//This script adds jsTest to the global namespace

var jsTest = {
	TestResults				: jsObject.createClass(
		new jsObject.FunctionDescriptor("jsTest.TestResults", function() {
			this.successCount	= 0;
			this.failureCount	= 0;
			this.tests			= [];
		}), {
			events		: "testBegun, itemLogged, testFailed, testCompleted, testsCompleted"
		}
	),
	TestingContext			: jsObject.createClass(
		new jsObject.FunctionDescriptor("jsTest.TestingContext", "string name", function(name) {
			this.name(name);
			this.tests = new jsTest.TestCollection(this)
		}), {
			toString		: function() { return "[TestingContext " + this.name() + "]"; },
			methods			: [
				new jsObject.FunctionDescriptor("runTests", "jsTest.TestResults results = new jsTest.TestResults()", function(results) {
					results.context = this;
				
					for(var i = 0; i < this.tests.length; i++) {
						this.tests[i].run(results);
					}
					
					results.testsCompleted(results);
					
					return results;
				})
			],
			properties		: "string name"
		}
	),
	Test					: jsObject.createClass(
		new jsObject.FunctionDescriptor("jsTest.Test", "string group, string name, function testFunction, string description = ''", function(group, name, testFunction, description) {
			this.group(group);
			this.name(name);
			this.testFunction(testFunction);
			this.description(description);
		}), {
			toString		: function() { return "[Test " + (this.context ? this.context.name() + "." : "") + this.group() + "/" + this.name() + "]"; },
			methods			: [
				new jsObject.FunctionDescriptor("run", "jsTest.TestResults results = new jsTest.TestResults()", function(results) {
					var retVal = new jsTest.TestResult(this);
					retVal.itemLogged.addHandler(results.itemLogged);
					results.tests.push(retVal);
					results.testBegun(this, retVal);
					
					retVal.begun = new Date;
					try {
						this.testFunction()(retVal);
						retVal.finished = new Date;
					} catch(ex) {
						retVal.finished = new Date;
						if(ex !== jsTest.testAbort)
							retVal.log(jsTest.LogLevel.error, "Unexpected exception: " + jsObject.toDebugString(ex));
						retVal.succeeded = false;
					}
					retVal.duration = retVal.finished.valueOf() - retVal.begun.valueOf();
					
					if(retVal.succeeded)
						results.successCount++;
					else {
						results.failureCount++;
						results.testFailed(this, retVal);
					}
					results.testCompleted(this, retVal);
					
					return retVal;
				})
			],
			properties		: "string group, string name, function testFunction, string description",
			events			: "testBegun, testFailed, testCompleted"
		}
	),
	TestCollection			: jsObject.createClass(
		new jsObject.FunctionDescriptor("jsTest.TestCollection : jsObject.Collection<jsTest.Test>", "jsTest.TestingContext context", function(context, base) {
			base(context.toString() + ".tests");
			this.context = context;
		}), {
			methods			: [
				new jsObject.FunctionDescriptor("add", "string group, string name, function testFunction", function(group, name, testFunction, base) {
					var retVal = new jsTest.Test(group, name, testFunction);
					this.add(retVal);
					return retVal;
				}),
			
				new jsObject.FunctionDescriptor("onItemAdded", "$T item, int index", function(item, index, base) { 
					item.context = this.context;
					base.onItemAdded(item, index);
				}),
				new jsObject.FunctionDescriptor("onItemRemoved", "$T item, int index", function(item, index, base) { 
					delete item.context;
					base.onItemRemoved(item, index); 
				}),
				new jsObject.FunctionDescriptor("onClearing", function(base) { 
					for(var i = 0; i < this.length; i++)
						delete this[i].context;
					base.onClearing(); 
				})
			]
		}
	),
	testAbort				: { toString: function() { return "[jsTest.testAbort]"; } },
	LogLevel				: jsObject.createEnum("jsTest.LogLevel", "success, info, warning, error"),
	TestResult					: jsObject.createClass(
		new jsObject.FunctionDescriptor("jsTest.TestResult", "jsTest.Test test", function(test) {
			this.test = test;
			this.logItems = [];
			this.succeeded = true;
		}), {
			toString		: function() { return "[Result of " + this.test.toString() + " - " + (this.succeeded ? "Success" : "Failure") + "\r\n" + this.logItems.join("\r\n"); },
			methods			: [
				new jsObject.FunctionDescriptor("log", [
					[ "string message", function(message) { this.log(jsTest.LogLevel.info, message); } ],
					[ "string level, string message", function(level, message) { this.log({ level: jsTest.LogLevel[level], message: message }); } ],
					[ "jsTest.LogLevel level, string message", function(level, message) { this.log({ level: level, message: message }); } ],
					[ "{ jsTest.LogLevel level, string message } item", function(item) { 
						item.timestamp = new Date;
						item.toString = function() { return this.level.toString() + ":\t" + this.message; };
						
						this.logItems.push(item);
						this.itemLogged(item);
					} ]
				]),
				new jsObject.FunctionDescriptor("fail", "string message", function(message) {
					this.log(jsTest.LogLevel.error, message);
					throw jsTest.testAbort;
				}),
				new jsObject.FunctionDescriptor("assert", "bool assertion, string message = ''", function(assertion, message) {
					if(assertion)
						this.log(jsTest.LogLevel.success, "Assertion succeeded:\t" + message);
					else
						this.fail("Assertion failed:\t" + message);
				}),
				new jsObject.FunctionDescriptor("assertType", [
//					[ "string | Type type, *? value", function(type, value) { this.assertType(type, [ value ]) } ],
//					[ "string type, *?.. values", function(type, values) { this.assertType(jsObject.Types.parse(type), values) } ],
					[ "string | Type type, *?.. values", function(type, values) {
						type = jsObject.Types.parse(type);
					
						for(var i = 0; i < values.length; i++)
							this.assert(type.check(values[i]), type.toString() + ".check(" + jsObject.toDebugString(values[i]) + ")");
					}]
				]),
				new jsObject.FunctionDescriptor("assertNotType", [
//					[ "string | Type type, *? value", function(type, value) { this.assertNotType(type, [ value ]) } ],
//					[ "string type, *?.. values", function(type, values) { this.assertNotType(jsObject.Types.parse(type), values) } ],
					[ "string | Type type, *?.. values", function(type, values) {
						type = jsObject.Types.parse(type);
					
						for(var i = 0; i < values.length; i++)
							this.assert(!type.check(values[i]), "!" + type.toString() + ".check(" + jsObject.toDebugString(values[i]) + ")");
					}]
				]),
				new jsObject.FunctionDescriptor("assertEqual", "*? a, *? b, bool soft = false", function(a, b, soft) {
					if(soft)
						this.assert(a == b, jsObject.toDebugString(a) + " == " + jsObject.toDebugString(b));
					else
						this.assert(a === b, jsObject.toDebugString(a) + " === " + jsObject.toDebugString(b));
				}),
				new jsObject.FunctionDescriptor("assertUnequal", "*? a, *? b, bool soft = false", function(a, b, soft) {
					if(soft)
						this.assert(a != b, jsObject.toDebugString(a) + " != " + jsObject.toDebugString(b));
					else
						this.assert(a !== b, jsObject.toDebugString(a) + " !== " + jsObject.toDebugString(b));
				}),
				new jsObject.FunctionDescriptor("assertMatch", "string text, Regex expression", function(text, expression) {
					this.assert(expression.test(text), expression.toString() + '.test("' + text + '")');
				}),
				new jsObject.FunctionDescriptor("assertNull", "*? value", function(text, expression) {
					this.assert(value === null, jsObject.toDebugString(value) + " === null");
				}),
				new jsObject.FunctionDescriptor("assertUndefined", "*? value", function(text, expression) {
					this.assert(typeof value === "undefined", jsObject.toDebugString(value) + " === undefined");
				}),
				new jsObject.FunctionDescriptor("assertNotNull", "*? value", function(text, expression) {
					this.assert(value !== null, jsObject.toDebugString(value) + " !== null");
				}),
				new jsObject.FunctionDescriptor("assertDefined", "*? value", function(text, expression) {
					this.assert(typeof value !== "undefined", jsObject.toDebugString(value) + " !== undefined");
				}),
				new jsObject.FunctionDescriptor("assertArrayEqual", "Array value, *... expected", function(value, expected) {
					var message = jsObject.toDebugString(value) + " == " + jsObject.toDebugString(expected);
					if(value.length !== expected.length)
						this.fail("Assertion failed:\t" + message);
						
					for(var i = 0; i < expected.length; i++)
						if(value[i] !== expected[i])
							this.fail("Assertion failed:\t" + message);
					
					this.log(jsTest.LogLevel.success, "Assertion succeeded:\t" + message);
				}),
				new jsObject.FunctionDescriptor("assertValueEqual", "Object | Array value, Object | Array expected", function(value, expected) {
					var message = jsObject.toDebugString(value) + " == " + jsObject.toDebugString(expected);
						
					for(var cProp in expected)
						if(value[cProp] !== expected[cProp])
							this.fail("Assertion failed:\t" + message);
					
					this.log(jsTest.LogLevel.success, "Assertion succeeded:\t" + message);
				}),
				new jsObject.FunctionDescriptor("assertThrows", [
					[ "function func, *?[] args, string exception, *? context = null", function(func, args, exception, context) { 
						return this.assertThrows(func, args, function(ex) { return ex.toString() === exception; }, '"$$" === "' + exception + '"', context);
					} ],
					[ "function func, *?[] args, Regex exception, *? context = null", function(func, args, exception, context) {
						return this.assertThrows(func, args, function(ex) { return exception.test(ex.toString()); }, exception.toString() + '.test("$$")', context);
					} ],
					[ "function func, *?[] args, function validator, string message, *? context = null", function(func, args, validator, message, context) { 
						try {
							func.apply(context, args);
						} catch(ex) {
							message = message.replace("$$$", jsObject.toDebugString(ex));
							message = message.replace("$$", ex.toString());
							if(validator(ex))
								this.log(jsTest.LogLevel.success, "Exception caught:\t" + message);
							else
								this.fail("Exception mismatch:\t" + message);
							
							return;												//If we caught an exception, don't fail.
						}
						this.fail("Assertion failed:\t" + jsObject.toDebugString(func) + " didn't throw when given " + jsObject.toDebugString(args) + ".");
					} ],
					[ "function func, *?[] args, * exception, *? context = null", function(func, args, exception, context)	{ 
						return this.assertThrows(func, args, function(ex) { return ex === exception; }, "$$$ === " + jsObject.toDebugString(exception), context); 
					} ],
					[ "function func, *?[] args = [], *? context = null", function(func, args, context) { return this.assertThrows(func, args, function(ex) { return true; }, "$$$", context); } ]
				])
			],
			events		: "itemLogged"
		}
	)
};