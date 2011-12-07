var jsObject = {
	toDebugString			: function(value) {
		///<summary>Returns a string that accurately describes an object</summary>
		return "";
	},
	Internal		: {
		ConstructorFlags	: {
			protoOnly		: { }
		},
		extend				: function(object, properties, includeProto) {
			///<summary>Copies (by reference) properties from one object to another.</summary>
			///<param name="object" type="object">The object to copy to.</param>
			///<param name="properties" type="object">The object to copy from.</param>
			///<aram name="includeProto" type="Boolean">True to add properties even if has OwnProperty retruns false.  The default is false.</param>
			///<returns type="object">The updated object.</returns>
			return object;
		},
		parseDeclaration	: function(input) {
			///<summary>Parses a parameter or property declaraion</summary>
			///<param name="input" type="string">The declaration (
			///Examples:
			///		"int a"
			///		"{ int id, string name, Date[] dates } holiday"
			///		"string type = 'object'"
			///		"function validator = function(){}"
			///</param>
			///<returns type="object">An object containg the parsed information
			///Examples:
			///		{ type: "int", name: "a" }
			///		{ type: "{ int id, string name, Date[] dates }", name: "holiday" }
			///		{ type: "string", name: "type", defaultValue: "'object'" }
			///		{ type: "function", name: "validator", defaultValue: "function(){}" }
			///types are not parsed and default values are not evaluated.
			///</returns>
			return { types: "", name: "", defaultValue: "" };
		},
		parseGenericClass	: function(input) {
			///<summary>Parses a full generic class name into an object containg the class and the type.</summary>
			///<param name="input" type="string">The generic class name.
			///Examples:
			///		"Collection<int>"
			///		"jsObject.Collection<{ int id, string name }>
			///		"GenericClass<bool, Collection<function[]>>"
			///</param>
			///<returns type="object">An object containg the jsClass (the actual function, not a string) and the type args (as an array of strings, not jsObject.Types)
			///Examples:
			///		{ jsClass: jsObject.Collection, genericArgs: [ "int" ] }
			///		{ jsClass: jsObject.Collection, genericArgs: [ "{ int id, string name }" ] }
			///		{ jsClass: GenericClass, genericArgs: [ "bool", "Collection<function[]>" ] }
			///</returns>
			return { jsClass: function() { }, genericArgs: [ "" ] };
		},
		customJoin			: function(array, separator, callback) {
			///<summary>Joins elements in an array using a custom toString</summary>
			///<param name="array" type="array">The array to join.  The arguments object also qualifies.  If the functionis invoked on an array, this parameter may be omitted.</param>
			///<param name="separator" type="string">A string to place between each element.</param>
			///<param name="callback" type="function">A function that takes an item and returns a string; or, a parameter to pass to toString.</param>
			///<returns type="string">The concatenated string.</returns>
			return "";
		},
		escapedSplit		: function(input, opening, closing, splitOn) {
			///<summary>Splits a string on the given chars except when found between opening and closing</summary>
			///<param name="input" type="string">The string to split (eg, "one, (two| two, [two| two], two), three | (four, four], five")</param>
			///<param name="opening" type="string">A string containing every opening character (eg, "([")</param>
			///<param name="closing" type="string">A string containing every closing character (eg, "])")</param>
			///<param name="splitOn" type="string">A string containing every character to split on (eg, ",|")</param>
			///<returns type="array" elementType="string">An array of strings (eg, [ "one", " (two| two, [two| two], two)", " three ", " (four, four]", " five" ])</returns>
			///<remarks>Openings and closings are not matched, so escapedSplit("(1,2],3,4,[5,6)", "([", ")]", ",") === [ "(1,2]", "3", "4", "[5,6)" ].
			///escapedSplit does not handle embedded strings, so there is no way to split "1,2,'3,4,5',6,\"7,8\",9" and get "'3,4,5'" in the array.</remarks>
			return [ "" ];
		},
		paramToString		: function() {
			///<summary>toString for parameter objects in FunctionDescriptors</summary>
			///<returns type="string">"type name", "[type name = default]", "type... name", "[type... name = default]"</returns>
			return "";
		},
		checkOverload		: function(overload, args, genericContext) {
			///<summary>Checks whether the given arguments match the given overload</summary>
			///<returns>false if the arguments don't match; an array of correct args (with default values and paramArrays) if they do.</returns>
			return [];
		},
		$Object				: function(instance, jsClass) {
			///<summary>This object is instantiated as the $ property on every jsObject.  It contains property values and event handlers</summary>
			this.instance		= instance;
			this.jsClass		= jsClass;

			this.eventHandlers	= { };
			this.propertyValues	= { };
			this.baseObjects	= { };
		},
		createClassProperty	: function(propertyName, type, onChange) {
			///<summary>Creates a property function to add to the prototype of a jsClass or a BaseObject.</summary>
			///<param name="propertyName" type="string">The name of the property.</param>
			///<param name="type" type="jsObject.Type">The type of the property.</param>
			///<param name="onChange" type="function">A function to call with the old and new values, which returns a new value.</param>
			///<returns type="functiopn">A property function.</param>
			return function(newVal) {};
		}
	},
	Exceptions				: {
		Exception			: function(message) {
			///<summary>A general exception.</summary>
			///<param name="message" type="String">The error message.</param>
		},
		OverloadException	: function(functionName, args) {
			///<summary>The exception thrown when an argument set does not match any of a function's overloads.</summary>
			///<param name="functionName" type="String">The name of the function that was given an invalid argument set.</param>
			///<param name="args" type="Array">The argument set.</param>
		},
		ArgumentException	: function(functionName, argumentName, argumentValue, errorMessage) {
			///<summary>The exception thrown when an argument is invalid.</summary>
			///<param name="functionName" type="String">The name of the function that was given an invalid argument.</param>
			///<param name="argumentName" type="String">The name of the argument that invalid.</param>
			///<param name="argumentValue" type="String">The invalid value.</param>
			///<param name="errorMessage" type="String">The reason that the value is invalid.</param>
		},
		ArgumentTypeException	: function(functionName, argumentName, argumentValue, expectedType) {
			///<summary>The exception thrown when an argument is invalid.</summary>
			///<param name="functionName" type="String">The name of the function that was given an invalid argument.</param>
			///<param name="argumentName" type="String">The name of the argument that invalid.</param>
			///<param name="argumentValue" type="String">The invalid value.</param>
			///<param name="expectedType" type="String">The expected type of the argument.</param>
		}
	},
	FunctionDescriptor			: function(name, params, body) {
		///<summary>Stores information about a type-safe function.</summary>
		///<param name="name" type="string">The name of the function</param>
		///<param name="params" type="string">A string containing the function's parameters</param>
		///<param name="body" type="function">The function body</param>
	},
	createFunction			: function(name, params, body) {
		///<summary>Creates a type-safe function.</summary>
		///<param name="name">The name of the function</param>
		///<param name="params" type="string">A string containing the function's parameters</param>
		///<param name="body" type="function>The function body</param>
		///<returns type="function">A type-safe wrapper around the function</returns>
		return function() {};
	},
	Type					: function (name, type, validate, properties) {
		///<summary>An intrinsic type (not a jsClass).  Used for properties and parameters</summary>
		///<param name="name" type="string">The name of the type.</param>
		///<param name="type" type="string">The classification of the type (eg, "Array", "Intrinsic", "jsClass", ...).</param>
		///<param name="validate" type="function">A function that checks whether a value is of the type.</param>
		///<param name="properties" type="object>An object containing preoperties to add the the Type object (eg, a custom toString that uses genericContext)</param>
	},
	Types					: {
		parsers				: [ function() {} ],
		parse				: function(input) {
			///<summary>Parses a string into a jsObject.Type</summary>
			///<param name="input" type="string">The string to parse</param>
			///<returns > type="jsObject.Type" A jsObject.Type</returns>
			return new jsObject.Type();
		},
		addParser				: function(parser) {
			///<summary>Adds a parser to the parsers array.</summary>
			///<param name="parser" type="Function">A function that takes a string and returns false or a jsObject.Type.</param>
		},
		
		cache					: {},
		Generic					: {
			Array				: function(type) {
				///<summary>Returns a type that matches an array of the given type.</summary>
				///<param name="type" type="string">The type in the array</param>
				///<returns> type="jsObject.Type"A new jsObject.Type.</returns>
				return new jsObject.Type();
			},
			Nullable			: function(type) {
				///<summary>Returns a type that matches null or the given type.</summary>
				///<param name="type" type="string">The type</param>
				///<returns> type="jsObject.Type"A new jsObject.Type.</returns>
				return new jsObject.Type();
			},
			Object				: function(properties) {
				///<summary>Returns a type that matches an object with the given properties of the given types.</summary>
				///<param name="properties" type="string">The properties of the object (eg, "int id, string name, function[] items")</param>
				///<returns> type="jsObject.Type"A new jsObject.Type.</returns>
				return new jsObject.Type();
			},
			OrderedArray		: function(elements) {
				///<summary>Returns a type that matches an array of the given types in the given order.</summary>
				///<param name="elements" type="string">The types in the array (eg, int, [string], function[])</param>
				///<returns> type="jsObject.Type"A new jsObject.Type.</returns>
				return new jsObject.Type();
			},
			Any					: function(types) {
				///<summary>Returns a type that matches any of the given types.</summary>
				///<param name="types" type="string">The types to match (eg, int, string, function[])</param>
				///<returns> type="jsObject.Type"A new jsObject.Type.</returns>
				return new jsObject.Type();
			},
			Collection			: function(type) {
				///<summary>Returns a type that matches a jsObject.Collection of the given type.</summary>
				///<param name="type" type="string">The type in the collection.</param>
				///<returns> type="jsObject.Type"A new jsObject.Type.</returns>
				return new jsObject.Type();
			}
		}
		
//		Boolean					: new jsObject.Type(),
//		Function				: new jsObject.Type(),
//		Number					: new jsObject.Type(),
//		Object					: new jsObject.Type(),
//		String					: new jsObject.Type(),
//		
//		Array					: new jsObject.Type(),
//		Date					: new jsObject.Type(),
//		RegExp					: new jsObject.Type(),
//		
//		Integer					: new jsObject.Type(),
//		
//		Type					: new jsObject.Type(),
//		FunctionDescriptor		: new jsObject.Type(),
//		EventInfo				: new jsObject.Type(),
//		PropertyInfo			: new jsObject.Type(),
//		
//		jsObject				: new jsObject.Type(),
//		jsClass					: new jsObject.Type(),
//		
//		Any						: new jsObject.Type(),
		
	},
	createEvent					: function(eventName,handlers) {
		///<summary>Creates an event.</summary>
		///<param name="eventName" type="string">The name of the event.</param>
		///<param name="handler" type="function">The handlers (if any) to add to the event.</param>
		///<returns type="function">The event function.</returns>
		var retVal = function() {};
		retVal.addHandler = function(handler) {
			///<summary>Adds a handler to the event.</summary>
			///<param name="handler" type="function">The handler to add.</param>
		};
		retVal.removeHandler = function(handler) {
			///<summary>Removes a handler to the event.</summary>
			///<param name="handler" type="function">The handler to remove.</param>
		};
		return retVal;
	},
	createProperty				: function(declaration, onChange) {
		///<summary>Creates a type-safe property.</summary>
		///<param name="declaration" type="string">THe proeprty declaration (eg, "string myName = ''")</param>
		///<param name="onChange" type="function">A function that takes the old and new values and optionally returns a new value that is called when the property is set. (Optional)</param>
		///<returns type="function">The property function.  To get the value, call the function with no parameters.  To set the property, give it the new value.</returns>
		return function(newVal) {};
	},
	createEnum					: function(name, items) {
		///<summary>Creates an enumeration.</summary>
		///<param name="name" type="string">The name of the enumeration.</param>
		///<param name="items" type="string">A comma-separated string containing the names of the enumeration's items.</param>
		///<returns>The enum object.</returns>
		return { name: "", type: new jsObject.Type(), items: [ { name: "" } ] };
	},
	createClass					: function(constructor, members) {
		///<summary>Creates a jsClass</summary>
		///<param name="constructor" type="jsObject.FunctionDescriptor">The class' constructor.  The class name and base class is parsed from this FunctionDescriptor's name (eg, "MyCollection<T>: Collection<$T>")</param>
		///<param name="members" type="object">An object containing the class' members, with properties methods, properties, eventNames, toString</param>
		///<returns type="function">A wrapped constructor</returns>
		var retVal = function() {}
		
		retVal.prototype = {
			$					: new jsObject.Internal.$Object(),
			jsClass				: retVal
		};
		retVal.addMethod = function(name, params, body) {
			///<summary>Adds a type-safe function to the class.</summary>
			///<param name="name">The name of the function</param>
			///<param name="params" type="string">A string containing the function's parameters</param>
			///<param name="body" type="function>The function body</param>
		};
		retVal.addProperty = function(declaration, onChange) {
			///<summary>Adds a type-safe property to the class.</summary>
			///<param name="declaration" type="string">THe proeprty declaration (eg, "string myName = ''")</param>
			///<param name="onChange" type="function">A function that takes the old and new values and optionally returns a new value that is called when the property is set. (Optional)</param>
		};
		retVal.addEvent = function(eventName, staticHandlers) {
			///<summary>Adds an event to the class.</summary>
			///<param name="eventName" type="string">The name of the event.</param>
			///<param name="handler" type="function">The ststic handlers (if any) to add to the event.</param>
		};
		
		return retVal;
	}
};

jsObject.Type.prototype = {
	name						: "",
	type						: "",
	isGenericParam				: false,
	check						: function(x) {
		///<summary>Checks whether the given value matches this type.</summary>
		///<param name="x">The value to check.</param>
		///<returns tpye="Boolean">true if the value matches the type.</returns>
		return true;
	}
};
