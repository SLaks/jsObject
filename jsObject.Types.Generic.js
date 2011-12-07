///<reference path="jsObject.IntelliSense.js"/>
//jsObject 2.0.js
//This script has no dependencies
//This script adds jsObject to the global namespace, indexOf and lastIndexOf to Array.prototype, and trim to String.prototype.

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Generic types
//Generic types (which are not related to generic classes) are functions
//that create jsObject.Types based on their arguments.
//They have special toStrings that expand generic type arguments (from 
//generic classes) if given a genericContext. (eg, "$TValue[]")

jsObject.Types.Generic = {
	//An array of a specific type
	Array			: jsObject.createFunction("jsObject.Types.Generic.Array", [ [ "string elementType", function(elementType) { return jsObject.Types.Generic.Array(jsObject.Types.parse(elementType)); } ],
		[ "Type elementType", 
		function(elementType) {
			return new jsObject.Type(elementType.toString() + "[]", "Array", function(x, genericContext) {
				if(!(x instanceof Array)) return false;							//If x isn't an array, stop.
				
				for(var i = 0; i < x.length; i++)								//For each element in the array,
					if(!elementType.check(x[i], genericContext)) return false;	//If the element doesn't match the type, stop
					
				return true;
			}, { elementType: elementType, toString: function(genericContext) { return elementType.toString(genericContext) + "[]"; } } );
		} ] ]
	), 
	Nullable		: jsObject.createFunction("jsObject.Types.Generic.Nullable", [ [ "string type", function(type) { return jsObject.Types.Generic.Nullable(jsObject.Types.parse(type)); } ], 
		[ "Type type", function(type) {
			return new jsObject.Type(type.toString() + "?", "Intrinsic", function(x) { 
				if(typeof x === "undefined" || x === null) return true;
				return type.check(x);
			}, { toString: function(genericContext) { return type.toString(genericContext) + "?"; }, type: type });
		} ]
	])
};
//An object containing specific properties of specific types.
jsObject.Types.Generic.Object = jsObject.createFunction("jsObject.Types.Generic.Object", [ 
	[ "object... properties", function(properties) {							//This overload is called by the other overloads and creates the type.
		var buildString = function(genericContext) {							//Create a toString function.
			if(!genericContext && this.name) return this.name;					//If there aren't any generics and we already have a name, return it.  (genericContext usually won't be supplied, so we can usually skip the rest of this function
			
			return "{ " + jsObject.Internal.customJoin(properties, ", ", function(cProp) {
				var retVal = "";
				if(cProp.optional) retVal += "[";								//If the property is optional, wrap it in square brackets.
				retVal += cProp.type.toString(genericContext) + " " + cProp.name;	//Add the property's name and type
				if(cProp.optional) retVal += "]";								//If the property is optional, wrap it in square brackets.
				return retVal;
			}) + " }";
		};
		
		return new jsObject.Type(buildString(), "Object", function(x, genericContext) {
			if(x === null || typeof x === "undefined") return false;			//A function that has the right properties will still pass, even though typeof x !== "object".
			
			for(var i = 0; i < properties.length; i++) {						//For each property,
				if(typeof x[properties[i].name] === "undefined") {				//If the property is not defined (I don't call hasOwnProperty because it might be in a prototype)
					if(properties[i].optional)									//If it's optional,
						continue;												//Go to the next property.
					else														//If it's mandatory,
						return false;											//The object doesn't match (there is no mechanism for giving an error message, and I can't throw because it would break overload resolution)
				}
				if(!properties[i].type.check(x[properties[i].name], genericContext))	//If the property is defined, but is of the wrong type,
					return false;												//Fail.
			}
			return true;
		}, { toString: buildString, properties: properties });
	} ], 
	//If we get a single string, split it.  This overload is before 
	//the string... overload so that a single string containing multiple
	//properties will be sent to this overload.
	//A single string with one property will be sent here, then put in
	//an array and sent to the string... overload.
	[ "string properties", function(properties) {
		return jsObject.Types.Generic.Object(jsObject.Internal.escapedSplit(properties, "{([<", ">])}", ","));
	} ], [ "string... properties", function(properties) {						//If we get multiple strings, parse them into descriptor objects.
		var result = [];
		
		for(var i = 0; i < properties.length; i++) {							//For each property,
			properties[i] = properties[i].trim();								//Remove spaces (most likely a space following a comma from escapedSplit)
			var optional = false;
			if(properties[i].charAt(0) === "[" && properties[i].charAt(properties[i].length - 1) === "]") {	//If the property is wrapped in square brackets,
				properties[i] = properties[i].substr(1, properties[i].length - 2);	//Remove the brackets,
				optional = true;												//And set optional.  (There is no way I could support default values and survive overload resolution).
			}
			var divider = properties[i].lastIndexOf(" ");						//Find the last space (Name cannot contain spaces; type can and often will)
			
			result.push({														//Create and add a property descriptor
				type: jsObject.Types.parse(properties[i].substr(0, divider)),	//Parse the type,
				name: properties[i].substr(divider + 1), optional: optional		//And get the name.
			});
		}
		
		return jsObject.Types.Generic.Object(result);
	} ]
]);
//An ordered array, containing types in a specific order
//The mechanics of this function's overloads are similar
//to the previous one.
//Elements can be optional, even if followed by mandatory
//elements.  The implementation is not 
//perfect -- the type "[ string, [int], int, bool ]" will
//not accept the array [ "hi", 1, true ], because the 1 is
//consumed by the first (optional) int, and the true is 
//matched against the second (mandatory) int.
jsObject.Types.Generic.OrderedArray = jsObject.createFunction("jsObject.Types.Generic.OrderedArray", [
	[ "{ Type type, [bool optional] }... elements", function(elements) {
		if(typeof elements.minLength !== "number") {							//If the array doesn't have a minimum length (which is set by the string parser)
			elements.minLength = 0;												//The minimum number of elements (excluding every optional element)
			for(var i = 0; i < elements.length; i++)							//For each element,
				if(!elements[i].optional)										//If the element is mandatory,
					elements.minLength++;										//Increment the minimum length.
		}
				
		var buildString = function(genericContext) {							//Create a toString function
			if(!genericContext && this.name) return this.name;					//If there aren't any generics and we already have a name, return it.  (genericContext usually won't be supplied, so we can usually skip the rest of this function
			
			return "[ " + jsObject.Internal.customJoin(elements, ", ", function(cElem) {
				var retVal = "";
				if(cElem.optional) retVal += "[";								//If the element is optional, wrap it in square brackets.
				retVal += cElem.type.toString(genericContext);					//Add the element's type.
				if(cElem.optional) retVal += "]";								//If the element is optional, wrap it in square brackets.
				return retVal;
			}) + " ]";
		};
		
		return new jsObject.Type(buildString(), "Array", function(x, genericContext) {
			if(!(x instanceof Array)) return false;
			if(x.length < elements.minLength || x.length > elements.length) return false;	//If the array has too many or too few elements, fail.
			
			var cElem = 0;														//The index of the current element in the array.  Used for optional parameters in the middle.
			for(var i = 0; i < elements.length; i++) {							//For each expected element.
				if(!elements[i].type.check(x[cElem], genericContext)) {			//If the element doesn't match the expected type,
					if(elements[i].optional)									//If the expected element is optional,
						continue;												//Skip it (without incrementing cProp, so that the current element in the array gets matched against the next type)
					else														//If it isn't optional,
						return false;											//Fail.
				}
				cElem++;														//Advance to the next element in the array.
			}
			return cElem === x.length;											//If there are other elements in the array that we haven't processed, fail (the array is too long, and skipped some optional parameters).
		}, { toString: buildString, elements: elements });
	} ], 
	[ "string elements", function(elements) { return jsObject.Types.Generic.OrderedArray(jsObject.Internal.escapedSplit(elements, "{([<", ">])}", ",")); } ],
	[ "string... elements", function(elements) {
		var result = [], foundOptional = false;
		
		result.minLength = 0;
		for(var i = 0; i < elements.length; i++) {								//For each string
			elements[i] = elements[i].trim();									//Remove spaces.
			var optional = false;
			if(elements[i].charAt(0) === "[" && elements[i].charAt(elements[i].length - 1) === "]") {	//If this element is wrapped in square brackets,
				elements[i] = elements[i].substr(1, elements[i].length - 2);	//Remove the brackets,
				optional = true;												//And set optional.
			} else																//If it isn't optional,
				result.minLength++;												//Increment the minimum number of args.
			result.push({ type: jsObject.Types.parse(elements[i]), optional: optional });	//Parse the type and add it to the array.
		}
		
		return jsObject.Types.Generic.OrderedArray(result);
	} ]
]);
//A type that matches any of the given types.
jsObject.Types.Generic.Any = jsObject.createFunction("jsObject.Types.Generic.Any", [
	[ "Type... types", function(types) {
		var buildString = function(genericContext) {							//Create a toString
			if(!genericContext && this.name) return this.name;					//If there aren't any generics and we already have a name, return it.  (genericContext usually won't be supplied, so we can usually skip the rest of this function
			
			return "(" + jsObject.Internal.customJoin(types, " | ", genericContext) + ")";
		};
		
		return new jsObject.Type(buildString(), "Intrinsic", function(x, genericContext) {
			for(var i = 0; i < types.length; i++)								//For each type,
				if(types[i].check(x, genericContext))							//If the argument matches this type,
					return true;												//Succeed.
					
			return false;														//If it didn't match any types, fail.
		}, { toString: buildString, types: types });
	} ], [ "string types", function(types) {
		return jsObject.Types.Generic.Any(jsObject.Internal.escapedSplit(types, "{([<", ">])}", "|"));
	} ], [ "string... types", function(types) {
		var parsedTypes = [];
		for(var i = 0; i < types.length; i++)									//For each type,
			parsedTypes.push(jsObject.Types.parse(types[i].trim()));			//Parse the type and add it to the array.
			
		return jsObject.Types.Generic.Any(parsedTypes);
	} ]
]);
