///<reference path="jsObject.IntelliSense.js"/>
//jsObject 2.0.js
//This script has no dependencies
//This script adds jsObject to the global namespace, indexOf and lastIndexOf to Array.prototype, and trim to String.prototype.

jsObject.Type = function Type(name, type, validate, properties) {
	///<summary>An intrinsic type (not a jsClass).  Used for properties and parameters</summary>
	///<param name="name" type="string">The name of the type.</param>
	///<param name="type" type="string">The classification of the type (eg, "Array", "Intrinsic", "jsClass", ...).</param>
	///<param name="validate" type="function">A function that checks whether a value is of the type.</param>
	///<param name="properties" type="object>An object containing properties to add the the Type object (eg, a custom toString that uses genericContext)</param>
	
	if(typeof name !== "string") throw new jsObject.Exceptions.ArgumentTypeException("jsObject.Type", "name", name, "String");
	if(typeof type !== "string") throw new jsObject.Exceptions.ArgumentTypeException("jsObject.Type", "type", type, "String");
	if(arguments.length > 2 && typeof validate !== "function") throw new jsObject.Exceptions.ArgumentTypeException("jsObject.Type", "validate", validate, "Function");
	if(arguments.length > 3 && typeof properties !== "object") throw new jsObject.Exceptions.ArgumentTypeException("jsObject.Type", "properties", properties, "Object");
	
	this.name = name;
	this.type = type;
	
	this.isGenericParam = arguments.length === 2;							//If a validator wasn't provided, this is a generic parameter.
	this.check = validate || function check(item, genericContext) {			//The validator for a generic parameter checks genericContext for the type of the parameter.
		if(!genericContext || !(genericContext["$" + name] instanceof jsObject.Type))	
			throw new jsObject.Exceptions.Exception("Generic type parameter " + name + " used out of context: " + jsObject.toDebugString(genericContext)); 
		return genericContext["$" + name].check(item, genericContext);
	};
	
	if(properties)
		jsObject.Internal.extend(this, properties);
};
jsObject.Type.prototype.toString = function(genericContext) {					//If this type is generic, and we have a generic context with a type for the generic parameter, use it.
	return (genericContext && this.isGenericParam && (genericContext["$" + this.name] instanceof jsObject.Type)) ? genericContext["$" + this.name].toString(genericContext) : this.name; 
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Types
jsObject.Types = {
	//Parsers is an array of functions used to parse a string into a jsObject.Type.
	//jsObject.Types.parse will call the functions in this array until one of them 
	//returns a jsObject.Type.
	//The order of these parsers is extremely important.
	parsers	: [
		//createClass & createEnum automatically add their types to Types.cache, so I don't need to check them here
		function(input) {														//Or clause (eg, "int | bool[] | (Date | Regex[])[]")
			var parts = jsObject.Internal.escapedSplit(input, "{([<", ">])}", "|");
			if(parts.length === 1) return false;
			
			return jsObject.Types.Generic.Any(parts);
		},
		function(input) {														//Nullable type (eg, "int?", "{ int id, string name }?"
			if(input.length < 2 || input.charAt(input.length - 1) !== "?") return false;
			return jsObject.Types.Generic.Nullable(input.substr(0, input.length - 1));
		},
		function(input) {														//Typed array (eg, "Type[]")
			if(input.length < 3 || input.substr(input.length - 2, 2) !== "[]") return false;
			return jsObject.Types.Generic.Array(jsObject.Types.parse(input.substring(0, input.length - 2)));
		},
		function(input) {														//Generic type arg (used when defining generic functions and properties) (eg, "$T")
			if(input.charAt(0) !== '$') return false;
			return new jsObject.Type(input.substr(1), "Generic");
		},
		function(input) {														//Ordered array (eg, "[ int, [string], function[] ]")
			if(input.charAt(0) !== '[' || input.charAt(input.length - 1) !== ']') return false;
			return jsObject.Types.Generic.OrderedArray(input.substr(1, input.length - 2));
		},
		function(input) {														//Object definition (eg, "{ int id, string name, function[] items }")
			if(input.charAt(0) !== '{' || input.charAt(input.length - 1) !== '}') return false;
			return jsObject.Types.Generic.Object(input.substr(1, input.length - 2));
		},
		function(input) {														//Generic class (accepts instances with specific generic args) (eg, "Collection<function>")
			var parsed = jsObject.Internal.parseGenericClass(input);			//Parse the class
			if(!parsed) return false;											//If it didn't parse, stop.
			return parsed.jsClass.genericType.apply(parsed.jsClass, parsed.genericArgs);	//Give the jsClass' genericType function the parsed arguments.
		}
//		function(input) {														//Expression (eg, "jsObject.Types.Generic.Array(jsObject.Types.Integer)")
//			try {
//				var retVal = eval(input);
//				if(retVal instanceof jsObject.Type) 
//					return retVal;
//				if(typeof retVal.type === "object" && retVal.type instanceof jsObject.Type)	//If it evaluated to a jsClass or an Enum (or anything with a type field), return its type field.
//					return retVal.type;
//			} catch(ex) { }
//			return false;
//		}
	],
	
	Boolean					: new jsObject.Type("Boolean",						"Intrinsic",	function(x) { return x instanceof Boolean || typeof x === "boolean";	}),
	Function				: new jsObject.Type("Function",						"Function",		function(x) { return typeof x === "function" && !(x instanceof RegExp);	}),
	Number					: new jsObject.Type("Number",						"Intrinsic",	function(x) { return x instanceof Number || typeof x === "number";		}),
	Object					: new jsObject.Type("Object",						"Object",		function(x) { return (typeof x === "object" || x instanceof RegExp) && x !== null && !(x instanceof Array); }),
	String					: new jsObject.Type("String",						"Intrinsic",	function(x) { return x instanceof String || typeof x === "string";		}),
	
	Array					: new jsObject.Type("Array",						"Array",		function(x) { return x instanceof Array;						}),
	Date					: new jsObject.Type("Date",							"Intrinsic",	function(x) { return x instanceof Date;							}),
	RegExp					: new jsObject.Type("RegExp",						"Object",		function(x) { return x instanceof RegExp;						}),
	
	Integer					: new jsObject.Type("Integer",						"Intrinsic",	function(x) { return typeof x === "number" && isFinite(x) && x === Math.round(x); }),
	
	Type					: new jsObject.Type("jsObject.Type",				"Object",		function(x) { return x instanceof jsObject.Type;				}),
	FunctionDescriptor		: new jsObject.Type("jsObject.FunctionDescriptor",	"Object",		function(x) { return x instanceof jsObject.FunctionDescriptor;	}),
	EventInfo				: new jsObject.Type("jsObject.EventInfo",			"Object",		function(x) { return x instanceof jsObject.EventInfo;			}),
	PropertyInfo			: new jsObject.Type("jsObject.PropertyInfo",		"Object",		function(x) { return x instanceof jsObject.PropertyInfo;		}),
	
	Property				: new jsObject.Type("Property",						"Function",		function(x) { return typeof x === "function" && x.isProperty;	}),
	Event					: new jsObject.Type("Event",						"Function",		function(x) { return typeof x === "function" && typeof x.addHandler === "function" && typeof x.removeHandler === "function";	}),
	
	jsObject				: new jsObject.Type("jsObject",						"Object",		function(x) { return typeof x === "object" && typeof x.jsClass === "function" && x instanceof x.jsClass && x.$ instanceof jsObject.Internal.$Object; }),
	jsClass					: new jsObject.Type("jsClass",						"Function",		function(x) { return typeof x === "function" && x.prototype.jsClass === x; }),
	
	Any						: new jsObject.Type("Any",							"Intrinsic",	function(x) { return x !== null && typeof x !== "undefined"; })
};
jsObject.Types.cache = {														//Holds succesfully parsed types, in case they get parsed again.  This is pre-loaded with built-in aliases.
	'*'			: jsObject.Types.Any,
	any			: jsObject.Types.Any,
	Any			: jsObject.Types.Any,

	array		: jsObject.Types.Array,
	Array		: jsObject.Types.Array,

	bool		: jsObject.Types.Boolean,
	'boolean'	: jsObject.Types.Boolean,
	Boolean		: jsObject.Types.Boolean,
	
	date		: jsObject.Types.Date,
	Date		: jsObject.Types.Date,
	
	Event		: jsObject.Types.Event,
	
	'function'	: jsObject.Types.Function,
	Function	: jsObject.Types.Function,
	
	FunctionDescriptor				: jsObject.Types.FunctionDescriptor,
	'jsObject.FunctionDescriptor'	: jsObject.Types.FunctionDescriptor,
	
	'int'		: jsObject.Types.Integer,
	integer		: jsObject.Types.Integer,
	Integer		: jsObject.Types.Integer,
	
	jsClass		: jsObject.Types.jsClass,
	jsObject	: jsObject.Types.jsObject,
	
	'jsObject.EventInfo'			: jsObject.Types.EventInfo,
	'jsObject.PropertyInfo'			: jsObject.Types.PropertyInfo,
	
	'float'		: jsObject.Types.Number,
	number		: jsObject.Types.Number,
	Number		: jsObject.Types.Number,
	
	object		: jsObject.Types.Object,
	Object		: jsObject.Types.Object,
	
	Property	: jsObject.Types.Property,
	
	regex		: jsObject.Types.RegExp,
	Regex		: jsObject.Types.RegExp,
	RegExp		: jsObject.Types.RegExp,
	
	string		: jsObject.Types.String,
	String		: jsObject.Types.String,
	
	type		: jsObject.Types.Type,
	Type		: jsObject.Types.Type,
	'jsObject.Type'					: jsObject.Types.Type
};
//Since Types.parse doesn't exist yet, I cannot use createFunction's string parsing here.
jsObject.Types.parse = jsObject.createFunction("jsObject.Types.parse", [
	[ [ { name: "input", type: jsObject.Types.String }], function(input) {
		if (input.charAt(0) === '(' && input.charAt(input.length - 1) === ')')				//Parentheses can be used to force types to parse correctly (eg, "int | bool[] | (Date | Regex[])[]")
			input = input.substr(1, input.length - 2);
		
		if(jsObject.Types.cache[input] instanceof jsObject.Type) return jsObject.Types.cache[input];
		
		for(var i = 0; i < jsObject.Types.parsers.length; i++) {
			var retVal = jsObject.Types.parsers[i](input);
			if(retVal instanceof jsObject.Type) {
				jsObject.Types.cache[input] = retVal;
				return retVal;
			}
		}
		
		throw new jsObject.Exceptions.ArgumentException("jsObject.Types.parse", "input", input, "could not parse type.");
	}],
	[ [ { name: "input", type: jsObject.Types.Type }], function(input) { return input; } ]
]);
jsObject.Types.addParser = jsObject.createFunction("jsObject.Types.addParser", "function parser", function(parser) { jsObject.Types.parsers.push(parser); });

jsObject.FunctionDescriptor.prototype = {
	toString	: function() { 
		var retVal = "[FunctionDescriptor " + this.overloads[0].fullName; 
		
		if(this.overloads.length > 1)
			retVal += " (+ " + (this.overloads.length - 1) + " overload";
		if(this.overloads.length > 2)
			retVal += "s";
		if(this.overloads.length > 1)
			retVal += ")";
		retVal += "]";
			
		return retVal;
	},
	setName		: jsObject.createFunction("jsObject.FunctionDescriptor.setName", "string name", function(name) {
		if(this.name === name) return;
		this.name = name;
		for(var i = 0; i < this.overloads.length; i++)
			this.overloads[i].fullName = name + "(" + this.overloads[i].parameters.join(", ") + ")";
	})
};
