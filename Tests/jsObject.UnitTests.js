///<reference path="../jsObject.IntelliSense.js"/>
///<reference path="../jsTest.js"/>

var jsObjectTests = new jsTest.TestingContext("jsObject");

jsObjectTests.tests.add("Internal", "escapedSplit", function($) {
	$.assertValueEqual(jsObject.Internal.escapedSplit("", "([", "])", "|,"), [ ]);
	$.assertValueEqual(jsObject.Internal.escapedSplit("one, (two| two, [two| two], two), three | (four, four], five", "([", "])", "|,"), [ "one", " (two| two, [two| two], two)", " three ", " (four, four]", " five" ]);
	$.assertValueEqual(jsObject.Internal.escapedSplit("(1,2],3,4,[5,6)", "([", "])", "|,"), [ "(1,2]", "3", "4", "[5,6)" ]);
	$.assertThrows(jsObject.Internal.escapedSplit, [ "a, (b,c), d)", "(", ")", "," ], /extra \)/);
	$.assertThrows(jsObject.Internal.escapedSplit, [ "a, (b,c), (d", "(", ")", "," ], /unclosed block/);
});
jsObjectTests.tests.add("Internal", "parseDeclaration", function($) {
	$.assertValueEqual(jsObject.Internal.parseDeclaration("int a"), { type: "int", name: "a" });
	$.assertValueEqual(jsObject.Internal.parseDeclaration("{ int id, string name, Date[] dates } holiday"), { type: "{ int id, string name, Date[] dates }", name: "holiday" });
	$.assertValueEqual(jsObject.Internal.parseDeclaration("string type='object'"), { type: "string", name: "type", defaultValue: "'object'" });
	$.assertValueEqual(jsObject.Internal.parseDeclaration("function validator = function(){}"), { type: "function", name: "validator", defaultValue: "function(){}" });
	$.assertThrows(jsObject.Internal.parseDeclaration, [ "garble" ], /expected space/);
});
jsObjectTests.tests.add("Internal", "customJoin", function($) {
	$.assertEqual(jsObject.Internal.customJoin([], ",", function() { return "a" }), "");
	$.assertEqual(jsObject.Internal.customJoin([1,2,3], ",", function() { return "a" }), "a,a,a");
	$.assertEqual(jsObject.Internal.customJoin([16,"30",32,"64",128], ",", function(x) { return parseInt(x,10).toString(16) }), "10,1e,20,40,80");
	
	var context = { 
		$A: jsObject.Types.parse("int"),
		$B: jsObject.Types.parse("Collection<$C>"),
		$C: jsObject.Types.parse("[ int, $T, bool ]"),
		$D: jsObject.Types.parse("Property"),
		$T: jsObject.Types.parse("*")
	};
	var p = jsObject.Types.parse;
	$.assertEqual(jsObject.Internal.customJoin([p("$A"), p("Date"), p("$B"), p("$C"), p("$D")], "\t", context), "Integer\tDate\tjsObject.Collection<[ Integer, Any, Boolean ]>\t[ Integer, Any, Boolean ]\tProperty");
});
jsObjectTests.tests.add("Internal", "extend", function($) {
	$.assertValueEqual(jsObject.Internal.extend({ a: -1, d: 4 }, { a: 1, b: 2, c: 3 }), { a: 1, b: 2, c: 3, d: 4 });
	$.assertEqual(jsObject.Internal.extend({ a: 1 }, { toString: function() { return "a: " + this.a; } }).toString(), "a: 1");
	$.assertEqual(jsObject.Internal.extend({ a: 1 }, { toString: "b" }).toString, "b");
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

jsObjectTests.tests.add("Types", "Boolean", function($) {
	$.assertType("bool", 
		true, Object(true), new Boolean(), Boolean(), 
		new Boolean(false), new Boolean(4), false);
		
	$.assertNotType("bool", 0, 1, null);
});
jsObjectTests.tests.add("Types", "Function", function($) {
	$.assertType("Function", 
		function(){}, jsObject.createClass, Object.constructor, Object, 
		Object.prototype.valueOf, Object.prototype.toString, "".replace);
		
	$.assertNotType("Function", 0, /a/, null);
});
jsObjectTests.tests.add("Types", "Number", function($) {
	$.assertType("Number", 
		12, Object(12), new Number(12), new Number(), 
		Number(12), 3e7, 6e77, 6e777, 6e-77, 6e-777, -6e777);
		
	$.assertNotType("Number", "1", [ 12 ], null );
});
jsObjectTests.tests.add("Types", "Object", function($) {
	$.assertType("Object", { }, jsObject, Object.prototype, Object(), /a/ );
	
	$.assertNotType("Object", [], jsObject.undefined, null, "" );
});
jsObjectTests.tests.add("Types", "String", function($) {
	$.assertType("String", 
		"a", 'abcdef', "\"", Object(""), Object("A"), String(), 
		String(34), String(""), String("A"), new String("A"));
	
	$.assertNotType("String", ['a']);
});
jsObjectTests.tests.add("Types", "Array", function($) {
	$.assertType("Array", [], [ 1, 2, 3 ], "".split(), new Array, Array())
	$.assertNotType("Array", arguments);
});
jsObjectTests.tests.add("Types", "Date", function($) {
	$.assertType("Date", new Date, new Date("11/111/11111"), new Date(""))
});
jsObjectTests.tests.add("Types", "RegExp", function($) {
	$.assertType("RegExp", new RegExp, /a/, RegExp("a"))
});
jsObjectTests.tests.add("Types", "Integer", function($) {
	$.assertType("Integer", 0, 1, -5e123, 1234)
	$.assertNotType("Integer", "1", "1/2", "1.5", 1/0, 1e1000, 5e-123, 1.5, 2/3);
});
jsObjectTests.tests.add("Types", "Property", function($) {
	if(typeof PTT === "undefined") {
		PTT = jsObject.createClass(new jsObject.FunctionDescriptor("PropertyTypeTest<A, B, C>", function() {}), { properties: "int a = 0, $A b, [$B?]?[]? c = null, Collection<$C> d" });
		PTTD = jsObject.createClass(new jsObject.FunctionDescriptor("PropertyTypeTestD: PropertyTypeTest<function, int[], object>", function() {}), { properties: "string f" });
		$.log("Classes created");
		$.assertType("jsObject.PropertyInfo", PTT.addProperty("bool[] e"));
	}
	
	var instance = new PTT("int, bool, Date");
	var dinstance = new PTTD();
	$.log("Class instatiated");
	
	$.assertType("Property", jsObject.createProperty("int a"), instance.a, instance.b, PTT.prototype.c, PTT.$.BaseObject.prototype.d, dinstance.$.baseObjects.PropertyTypeTest.e, dinstance.f);
	$.assertNotType("Property",function() {}, jsObject.createClass, PTT.actualConstructor, instance.eChanged);
});
jsObjectTests.tests.add("Types", "Event", function($) {
	if(typeof ETT === "undefined") {
		ETT = jsObject.createClass(new jsObject.FunctionDescriptor("EventTypeTest", function() {}), { events: "a, b, c", properties: "int prop" });
		$.log("Class created");
		
		$.assertType("jsObject.EventInfo", ETT.addEvent("d"));
	}
	var instance = new ETT();
	$.log("Class instatiated");
	
	$.assertType("Event", jsObject.createEvent("a"), instance.a, instance.b, instance.c, instance.d, instance.propChanged);
	$.assertNotType("Event",function() {}, jsObject.createClass, ETT.actualConstructor, instance.prop);
});
jsObjectTests.tests.add("Types", "Any", function($) {
	$.assertType("*", 0, true, Object(3), "hi!", {}, [], /a/, function() {})
	$.assertNotType("*", null, jsObject.undefined);
});
//	Type					: new jsObject.Type("jsObject.Type",				"Object",		function(x) { return x instanceof jsObject.Type;				}),
//	FunctionDescriptor		: new jsObject.Type("jsObject.FunctionDescriptor",	"Object",		function(x) { return x instanceof jsObject.FunctionDescriptor;	}),
//	EventInfo				: new jsObject.Type("jsObject.EventInfo",			"Object",		function(x) { return x instanceof jsObject.EventInfo;			}),
//	PropertyInfo			: new jsObject.Type("jsObject.PropertyInfo",		"Object",		function(x) { return x instanceof jsObject.PropertyInfo;		}),
//	
//	jsObject				: new jsObject.Type("jsObject",						"Object",		function(x) { return typeof x === "object" && typeof x.jsClass === "function" && x instanceof x.jsClass && x.$ instanceof jsObject.Internal.$Object; }),
//	jsClass					: new jsObject.Type("jsClass",						"Function",		function(x) { return typeof x === "function" && x.prototype.jsClass === x; }),

jsObjectTests.tests.add("Types.Generic", "Any", function($) {
	//TODO: Implement
});
