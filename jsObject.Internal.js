///<reference path="jsObject.IntelliSense.js"/>
//jsObject 2.0.js
//This script has no dependencies
//This script adds jsObject to the global namespace, indexOf and lastIndexOf to Array.prototype, and trim to String.prototype.


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Prerequisites

if(!Array.prototype.indexOf)
	Array.prototype.indexOf = function(v, b, s) {
		for(var i = +b || 0, l = this.length; i < l; i++)
			if(this[i] === v || s && this[i] == v) return i;
		return -1;
	};
if(!Array.prototype.lastIndexOf)
	Array.prototype.lastIndexOf = function(el, start) {
		start = start || this.length;
		if(start >= this.length) start = this.length;
		if(start < 0) start = this.length + start;
		for(var i = start; i >= 0; --i)
			if (this[i] === el)
				return i;
		return -1;
	};
if(!String.prototype.trim)
	String.prototype.trim = function() { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };
var jsObject = {
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Internal
	toDebugString			: function toDebugString(value) {
		///<summary>Returns a string that accurately describes an object</summary>
		if(value === null) return "[null]";
		if(typeof value === "undefined") return "[undefined]";
		
		if(value.hasOwnProperty("toString"))
			return value.toString();
		if(typeof value.toDebugString === "function" && value.toDebugString !== arguments.callee)
			return value.toDebugString();
			
		if(typeof value === "string")
			return '"' + value + '"';
			
		if(value instanceof RegExp)
			return value.toString();
		if(value instanceof Array)
			return "[ " + jsObject.Internal.customJoin(value, ", ", function(x) { return jsObject.toDebugString(x); }) + " ]";
			
		if(typeof value === "function") { 
			var retVal = value.toString();
			return "[" + retVal.substr(0, retVal.indexOf("{")).trim() + "]";
		}
		
		if(value.toString === Object.prototype.toString) {
			var retVal;
			for(var x in value) {
				if(retVal) retVal += ", ";
				else retVal = "{ ";
				retVal += x + ": " + jsObject.toDebugString(value[x]);
			}
			return retVal + " }";
		}
		
		return value.toString();
	},
	Internal				: {
		extend				: function extend(object, properties, includeProto) {
			///<summary>Copies (by reference) properties from one object to another.</summary>
			///<param name="object" type="object">The object to copy to.</param>
			///<param name="properties" type="object">The object to copy from.</param>
			///<aram name="includeProto" type="Boolean">True to add properties even if has OwnProperty retruns false.  The default is false.</param>
			///<returns type="object">The updated object.</returns>
		
			for(var cProp in properties)
				if(includeProto || properties.hasOwnProperty(cProp))
					object[cProp] = properties[cProp];
					
			//Work around IE bug (toString & valueOf aren't enumerated)
			if((includeProto && properties.toString !== Object.prototype.toString) || properties.hasOwnProperty("toString"))
				object.toString = properties.toString;
			if((includeProto && properties.valueOf !== Object.prototype.valueOf) || properties.hasOwnProperty("valueOf"))
				object.valueOf = properties.valueOf;

			return object;
		},
		parseDeclaration	: function parseDeclaration(input) {
			///<summary>Parses a parameter or property declaraion</summary>
			///<param name="input" type="string">The declaration
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
			var parts = jsObject.Internal.escapedSplit(input, "{([<", ">])}", "=");	//Split around the equals sign to allow for types or default values that contain equals signs (there are currently no types that can contain an =, but that can change)
			
			parts[0] = parts[0].trim();											//Trim the first part ("type name")
			var lastSpace = parts[0].lastIndexOf(" ");							//Find the last space (types can have spaces; names can't)
			if(lastSpace === -1)
				throw new jsObject.Exceptions.ArgumentException("jsObject.Internal.parseDeclaration", "input", input, "expected space");
			var retVal = {
				type		: parts[0].substr(0, lastSpace).trim(),				//The type is everything until the lst space;
				name		: parts[0].substr(lastSpace + 1).trim()				//The name is everything after it.
			};
			if(parts.length > 1) {												//If there is an equals sign, get the default value
				parts.splice(0, 1);												//Remove the first part
				retVal.defaultValue = parts.join("=").trim();					//Join the remaining parts on equals.  (escapedSplit doens't handle strings, so "string x = 'me == bad'" splits to [ "string x ", " 'me ", "", " bad'" ] and should be joined on =)
			}
			
			return retVal;
		},
		parseGenericClass	: function parseGenericClass(input) {
			///<summary>Parses a full generic class name into an object containg the class and the type.</summary>
			///<param name="input" type="string">The generic class name.
			///Examples:
			///		"Collection<int>"
			///		"jsObject.Collection<{ int id, string name }>
			///		"GenericClass<bool, Collection<function[]>>"
			///</param>
			///<returns type="object">An object containg the jsClass 
			///(the actual function, not a string) and the type args 
			///(as an array of strings, not jsObject.Types), or false
			///if the parse failed
			///Examples:
			///		{ jsClass: jsObject.Collection, genericArgs: [ "int" ] }
			///		{ jsClass: jsObject.Collection, genericArgs: [ "{ int id, string name }" ] }
			///		{ jsClass: GenericClass, genericArgs: [ "bool", "Collection<function[]>" ] }
			///</returns>
			if(input.charAt(input.length - 1) !== ">") return false;			//If the string doesn't end with ">", it isn't a generic class.
			var openArrow = input.indexOf("<");									//Find the first <.  (allow for "Collection<Collection<{ int id, Collection<string> items }>>", etc)
			if(openArrow < 0) return false;
			
			var jsClass = jsObject.classes[input.substr(0, openArrow)];			//Get the jsClass. (I want the constructor, not a jsObject.Type, so I don't call Types.parse)
			if(!jsObject.Types.jsClass.check(jsClass)) return false;
			
			return {
				jsClass		: jsClass,
				genericArgs	: jsObject.Internal.escapedSplit(input.substring(openArrow + 1, input.length - 1), "{([<", ">])}", ",")//Get the generic arguments, skipping the arrows, and split them.
			};
		},
		customJoin			: function customJoin(array, separator, callback) {
			///<summary>Joins elements in an array using a custom toString</summary>
			///<param name="array" type="array">The array (or an array-like object) to join.  If the function is called on an array, this parameter may be omitted.</param>
			///<param name="separator" type="string">A string to place between each element.</param>
			///<param name="callback" type="function">A function that takes an item and returns a string; or, a parameter to pass to toString.</param>
			///<returns type="string">The concatenated string.</returns>
			if(typeof array === "string" && arguments.length === 2) {			//If the first parameter is a string (if the array parameter was ommitted)
				callback	= separator;										//Shift parameters,
				separator	= arguments;
				array		= this;												//And use this for the array.
			}
			if(typeof callback != "function") {									//If the callback isn't a function,
				var arg = callback;												//Save a copy for the closure,
				callback = function(x) { return x.toString(arg); };				//And create a callback the gives the parameter to toString.
			}

			var retVal = "";
			for(var i = 0; i < array.length; ++i) {
				if(i > 0) retVal += separator;
				retVal += callback.call(array[i], array[i], i);
			}
			
			return retVal;
		},
		escapedSplit		: function escapedSplit(input, opening, closing, splitOn) {
			///<summary>Splits a string on the given chars except when found between opening and closing</summary>
			///<param name="input" type="string">The string to split (eg, "one, (two| two, [two| two], two), three | (four, four], five")</param>
			///<param name="opening" type="string">A string containing every opening character (eg, "([")</param>
			///<param name="closing" type="string">A string containing every closing character (eg, "])")</param>
			///<param name="splitOn" type="string">A string containing every character to split on (eg, ",|")</param>
			///<returns type="string">An array of strings (eg, [ "one", " (two| two, [two| two], two)", " three ", " (four, four]", " five" ])</returns>
			///<remarks>Openings and closings are not matched, so escapedSplit("(1,2],3,4,[5,6)", "([", ")]", ",") === [ "(1,2]", "3", "4", "[5,6)" ].
			///escapedSplit does not handle embedded strings, so there is no way to split "1,2,'3,4,5',6,\"7,8\",9" and get "'3,4,5'" in the array.</remarks>
			if(input.length === 0) return [];									//If input is empty, return an empty array (without this line, it return [ "" ])
			
			var retVal = [];													//The array of strings to return.
			var level = 0;														//The nesting level of the current character.
			var lastBreak = 0;													//The index of the last character to split on.
			
			for(var i = 0; i < input.length; i++) {								//For each character,
				var cChar = input.charAt(i);									//Get the character.  (strings are only indexable in Firefox, so I can't write input[i])
				
				if(opening.indexOf(cChar) >= 0)									//If the character opens a block,
					level++;													//Increase the level.
				else if(closing.indexOf(cChar) >= 0) { 							//If this character closes a block,
					level--;													//Decrease the level.
					if(level < 0)
						throw new jsObject.Exceptions.ArgumentException("jsObject.Internal.escapedSplit", "input", input, "extra " + cChar);
				} else if(level === 0 && splitOn.indexOf(cChar) >= 0) { 		//If this character should be split on and we're not in a block,
					retVal.push(input.substr(lastBreak, i - lastBreak));		//Add the range within the string between the last break and this character to the array.
					lastBreak = i + 1;											//Set the last break to the next character (so as not to include the splitOn itself)
				}
			}
			if(level !== 0)
				throw new jsObject.Exceptions.ArgumentException("jsObject.Internal.escapedSplit", "input", input, "unclosed block");
			retVal.push(input.substr(lastBreak));								//Add the final part to the array.
			
			return retVal;
		}
	},

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Exceptions

	Exceptions				: {
		Exception			: function Exception(message) {
			///<summary>A general exception.</summary>
			///<param name="message" type="String">The error message.</param>
			this.constructor = Error;
			Error.apply(this);
			
			this.message = message;
		},
		OverloadException	: function OverloadException(functionName, args) {
			///<summary>The exception thrown when an argument set does not match any of a function's overloads.</summary>
			///<param name="functionName" type="String">The name of the function that was given an invalid argument set.</param>
			///<param name="args" type="Array">The argument set.</param>
			this.constructor = Error;
			Error.apply(this);
			
			this.functionName = functionName;
			this.args = args;
		},
		ArgumentException	: function ArgumentException(functionName, argumentName, argumentValue, errorMessage) {
			///<summary>The exception thrown when an argument is invalid.</summary>
			///<param name="functionName" type="String">The name of the function that was given an invalid argument.</param>
			///<param name="argumentName" type="String">The name of the argument that invalid.</param>
			///<param name="argumentValue" type="String">The invalid value.</param>
			///<param name="errorMessage" type="String">The reason that the value is invalid.</param>
			this.constructor = Error;
			Error.apply(this);
			
			this.functionName = functionName;
			this.argumentName = argumentName;
			this.argumentValue = argumentValue;
			this.errorMessage = errorMessage;
		},
		ArgumentTypeException	: function ArgumentTypeException(functionName, argumentName, argumentValue, expectedType) {
			///<summary>The exception thrown when an argument is invalid.</summary>
			///<param name="functionName" type="String">The name of the function that was given an invalid argument.</param>
			///<param name="argumentName" type="String">The name of the argument that invalid.</param>
			///<param name="argumentValue" type="String">The invalid value.</param>
			///<param name="expectedType" type="String">The expected type of the argument.</param>
			this.constructor = Error;
			Error.apply(this);
			
			this.functionName = functionName;
			this.argumentName = argumentName;
			this.argumentValue = argumentValue;
			this.expectedType = expectedType;
		}
//		getStackTrace			: function() {
//			var retVal = [];

//			if (typeof(arguments.caller) !== 'undefined') { // IE, not ECMA
//				for (var a = arguments.caller; a !== null; a = a.caller) {
//					retVal.push(a.callee);
//					if (a.caller === a)
//						break;
//				}
//			} else { //Firefox
//				var testExcp;
//				try { foo.bar; }
//				catch(ex) {
//				//TODO: Implement
//	var stack = [];
//	var name;

//	if (!excp || !excp.stack) return stack;

//	var stacklist = excp.stack.split('\n');

//	for (var i = 0; i < stacklist.length - 1; i++) {
//		var framedata = stacklist[i];

//		name = framedata.match(/^(\w*)/)[1];
//		if (!name) name = 'anonymous';

//		stack[stack.length] = name;
//	}
//	// remove top level anonymous functions to match IE

//	while (stack.length && stack[stack.length - 1] === 'anonymous')
//		stack.length = stack.length - 1;
//	return stack;
//				}
//			}

//			return retVal;
//		}
	},
	classes					: {},												//Contains references to every jsClass. Used when parsing jsClasses.
	instanceCount			: 0													//Used to generate unique IDs for jsObjects (object.$.instanceID)
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Prototypes

jsObject.Exceptions.OverloadException.prototype.toString = function() { return "Arguments " + jsObject.toDebugString(Array.prototype.slice.call(this.args)) + " do not match any overloads of " + this.functionName + "."; };
jsObject.Exceptions.Exception.prototype.toString = function() { return this.message; };
jsObject.Exceptions.ArgumentException.prototype.toString = function() {
	return "Parameter " + this.argumentName + " (" + jsObject.toDebugString(this.argumentValue) + ") in function " + this.functionName + " is invalid: " + this.errorMessage;
};
jsObject.Exceptions.ArgumentTypeException.prototype.toString = function() {
	return "Parameter " + this.argumentName + " (" + jsObject.toDebugString(this.argumentValue) + ") in function " + this.functionName + " isn't of type " + this.expectedType + ".";
};
