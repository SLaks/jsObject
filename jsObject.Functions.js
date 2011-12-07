///<reference path="jsObject.IntelliSense.js"/>
//jsObject 2.0.js
//This script has no dependencies
//This script adds jsObject to the global namespace, indexOf and lastIndexOf to Array.prototype, and trim to String.prototype.

jsObject.Internal.paramToString = function paramToString() {
	///<summary>toString for parameter objects in FunctionDescriptors</summary>
	///<returns type="string">"type name", "[type name = default]", "type... name", "[type... name = default]"</returns>
	var retVal = "";

	if(this.optional) retVal += "[";
	retVal += (this.paramArray ? this.type.elementType + "..." : this.coalesceParam ? this.type.elementType + ".." : this.type) + " " + this.name;
	if(this.optional) retVal += " = " + jsObject.toDebugString(this.defaultValue) + "]";
	
	return retVal;
};
jsObject.Internal.functionToString = function functionToString() {
	///<summary>toString for type-safe functions (with descriptor fields)</summary>
	///<returns type="string">"functionName()", "functionName(type1 param1, type2 param2) (+ 1 overload)"</returns>
	var retVal = this.descriptor.overloads[0].fullName;							//Start with the first overload.

	if(this.descriptor.overloads.length > 1) {									//If there are other overload(s),
		retVal += " (+ " + (this.descriptor.overloads.length - 1) + " overload";//Add the number of other overloads
		if(this.descriptor.overloads.length > 2)								//If there are more than one other overload,
			retVal += "s";														//Make it plural.
		retVal += ")";
	}
	return retVal;
};
jsObject.Internal.checkOverload = function checkOverload(overload, args, genericContext) {
	///<summary>Checks whether the given arguments match the given overload</summary>
	///<returns>false if the arguments don't match; an array of correct args (with default values and paramArrays) if they do.</returns>
	
	if(	args.length < overload.parameters.minLength						//If there are too few arguments,
	|| (args.length > overload.parameters.length && !overload.parameters.isExpandable)) return false;	//Or if there are too many arguments (unless the last one is a paramArray), it doesn't match.
	
	args = Array.prototype.slice.call(args);							//Make a copy of the arguments to work with.  (this makes it into a "true" array, and ensures that we don't change the original)

	for(var i = 0; i < overload.parameters.length; i++) {				//For each parameter,
		var cParam = overload.parameters[i];
		
		if(args.length <= i) {											//If we ran out of passed args,
			if(cParam.optional)											//If the parameter is optional,
				args.push(cParam.defaultValue.call(genericContext));	//Call the defaultValue function to get a value, and add it to the args array.
			else														//If it isn't,
				return false;											//The overload doesn't match (this should be prevented by the check against minLength; better safe than sorry)
		} else {														//If we have an arg,
			if(cParam.optional && (args[i] === null || typeof args[i] === "undefined"))	//If an optional parameter was null,
				args[i] = cParam.defaultValue.call(genericContext);		//Call the defaultValue function to get a value.
			else if(cParam.coalesceParam) {
				var array = args.splice(i, args.length - i);			//Collapse it into an array,
				if(!cParam.type.check(array, genericContext)) return false;	//Check the elements of the array
				args.push(array);										//And add the array to the arg list.
			} else if(!cParam.type.check(args[i], genericContext)) {	//If there is an arg, but it doesn't match,
				if(cParam.paramArray) {									//If it's a paramArray, (if a paramArray is passed as an array, it will not be collapsed)
					var array = args.splice(i, args.length - i);		//Collapse it into an array,
					if(!cParam.type.check(array, genericContext)) return false;	//Check the elements of the array
					args.push(array);									//And add the array to the arg list,
				} else													//If it isn't a paramArray,
					return false;										//The overload doesn't match.
			}
		}
	}
	
	return args;														//If the overload matches, return the fixed args array.  (pass this to Function.apply)
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Type-safe Functions

//This function needs a name, a set of overloads (each with arguments and body), and, optionally, a context.
//The first parameter is always the name, as a string.
//The overloads can be put in an array.  However, if there is only one overload, it does not need to be in an array.
//Each overload has a set of parameters and a body.
//An overload can be specified as an object with parameters and body properties, an array with the parameters followed by the body, or (if there is only one overload) as two parameters to this constructor
//The parameters can be specified as a comma-separated string, an array of strings, or an array of objects.
//An argument string should be of the format "type name[=default]"
//type is passed to Types.parse
//Therefore, the following calls should be equivalent:
//
//new jsObject.FunctionDescriptor("doIt", "jsObject.Types.Integer a, jsObject.Types.String b='default'", function(a,b) { ... });
//new jsObject.FunctionDescriptor("doIt", ["jsObject.Types.Integer a", "jsObject.Types.String b='default'"], function(a,b) { ... });
//new jsObject.FunctionDescriptor("doIt", [["jsObject.Types.Integer a, jsObject.Types.String b='default'", function(a,b) { ... }]]);
//new jsObject.FunctionDescriptor("doIt", { parameters: "jsObject.Types.Integer a, jsObject.Types.String b='default'", body: function(a,b) { ... } });
//new jsObject.FunctionDescriptor("doIt", [{ parameters: "jsObject.Types.Integer a, jsObject.Types.String b='default'", body: function(a,b) { ... } }]);
//new jsObject.FunctionDescriptor("doIt", [{ parameters: ["jsObject.Types.Integer a", "jsObject.Types.String b='default'"], body: function(a,b) { ... } }]);
//new jsObject.FunctionDescriptor("doIt", [{ parameters: "a", type: jsObject.Types.Integer }, {name: "b", type: jsObject.Types.String, defaultValue: function() { return "default"; }}], function(a,b) { ... });
//new jsObject.FunctionDescriptor("doIt", { parameters: [{ name: "a", type: jsObject.Types.Integer }, {name: "b", type: jsObject.Types.String, defaultValue: function() { return "default"; }}], body: function(a,b) { ... } });
//new jsObject.FunctionDescriptor("doIt", [{ parameters: [{ name: "a", type: jsObject.Types.Integer }, {name: "b", type: jsObject.Types.String, defaultValue: function() { return "default"; }}], body: function(a,b) { ... } }]);
jsObject.FunctionDescriptor = function FunctionDescriptor(name) {
	///<summary>Stores information about a type-safe function.</summary>
	//When this constructor is chain called (from createFunction or jsClass.addMethod), it is given arguments in a single array because FunctionDescriptor.apply wouldn't get the prototype.
	if(arguments.length === 1 && typeof arguments[0] === "object" && typeof arguments[0].length === "number") {			//If our arguments are wrapped in an array (or arguments object),
		arguments = arguments[0];											//Read the arguments from the array
		name = arguments[0];												//Extract the name from the array.
	}
	var overloads;
			
	if(typeof name !== "string")
		throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "name", name, "String");
	this.name = name;
	
	if(typeof arguments[1] === "function") {
		//function body only (parameterless).
		//new jsObject.FunctionDescriptor("doIt", function() { ... });
		overloads = [ { parameters: [], body: arguments[1] } ];
		if(arguments.length === 3)
			this.context = arguments[2];
	} else if(typeof arguments[1] === "string") {
		//Param string and function body.
		//new jsObject.FunctionDescriptor("doIt", "jsObject.Types.Integer a, jsObject.Types.String b='default'", function(a,b) { ... });
		if(typeof arguments[2] !== "function")
			throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "body", arguments[2], "Function");
		overloads = [{ parameters: arguments[1], body: arguments[2] }];
		if(arguments.length === 4)
			this.context = arguments[3];
	} else if(arguments[1] instanceof Array) {
		if(typeof arguments[2] === "function" && (arguments[1].length === 0 || typeof arguments[1] === "string" || typeof arguments[1][0] === "string" || typeof arguments[1][0].name === "string")) {
			//Array of param strings or objects and body (as opposed to array of overloads followed function context)
			//new jsObject.FunctionDescriptor("doIt", ["jsObject.Types.Integer a", "jsObject.Types.String b='default'"], function(a,b) { ... });
			//new jsObject.FunctionDescriptor("doIt", [{ name: "a", type: jsObject.Types.Integer }, {name: "b", type: jsObject.Types.String, defaultValue: function() { return "default"; }}], function(a,b) { ... });
			overloads = [ { parameters: arguments[1], body: arguments[2] } ];
			if(arguments.length === 4)
				this.context = arguments[3];
		} else {
			//Array of overloads, only
			//new jsObject.FunctionDescriptor("doIt", [["jsObject.Types.Integer a, jsObject.Types.String b='default'", function(a,b) { ... }]]);
			//new jsObject.FunctionDescriptor("doIt", [{ parameters: "jsObject.Types.Integer a, jsObject.Types.String b='default'", body: function(a,b) { ... } }]);
			//new jsObject.FunctionDescriptor("doIt", [{ parameters: ["jsObject.Types.Integer a", "jsObject.Types.String b='default'"], body: function(a,b) { ... } }]);
			//new jsObject.FunctionDescriptor("doIt", [{ parameters: [{ name: "a", type: jsObject.Types.Integer }, {name: "b", type: jsObject.Types.String, defaultValue: function() { return "default"; }}], body: function(a,b) { ... } }]);
			overloads = arguments[1];
			if(arguments.length === 3)
				this.context = arguments[2];
		}
	} else if(typeof arguments[1] === "object") {
		//Single overload object
		//new jsObject.FunctionDescriptor("doIt", { parameters: "jsObject.Types.Integer a, jsObject.Types.String b='default'", body: function(a,b) { ... } });
		//new jsObject.FunctionDescriptor("doIt", { parameters: [{ name: "a", type: jsObject.Types.Integer }, {name: "b", type: jsObject.Types.String, defaultValue: function() { return "default"; }}], body: function(a,b) { ... } });
		overloads = [ arguments[1] ];
		if(arguments.length === 3)
			this.context = arguments[2];
	}
	if(!(overloads instanceof Array))
		throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "overloads", overloads, "Object[]");
	if(overloads.length === 0)
		throw new jsObject.Exceptions.ArgumentException("jsObject.FunctionDescriptor", "overloads", overloads, "A function must have at least one overload.");
	
	this.overloads = overloads;
	
	//At this point, overloads is an array.
	//Each overload is either an array (see intro) or an overload object (see intro).
	for(var n = 0; n < overloads.length; n++) {								//For each overload,
		if(overloads[n] instanceof Array) {									//If the overload is an array, 
			if(overloads[n].length === 1)									//If there aren't any parameters,
				overloads[n] = { parameters: [], body: overloads[n][0] };	//Use an empty array.
			else if(overloads[n].length === 2)								//If there are parameters,
				overloads[n] = { parameters: overloads[n][0], body: overloads[n][1] };	//Use them.
			else
				throw new jsObject.Exceptions.ArgumentException("jsObject.FunctionDescriptor", "overloads[" + n + "]", overloads[n], "Expected optional parameters array and function body");
		}
		
		if(typeof overloads[n] !== "object")
			throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "overloads[" + n + "]", overloads[n], "Object");
		if(typeof overloads[n].parameters === "string")								//If the parameters are a single string,
			overloads[n].parameters = jsObject.Internal.escapedSplit(overloads[n].parameters, "{([<", ">])}", ",");	//Split them.
		
		var parameters = overloads[n].parameters;
		var body = overloads[n].body;
		
		if(!(parameters instanceof Array))
			throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "overloads[" + n + "].parameters", parameters, "Object[]");
		if(typeof body !== "function")
			throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "overloads[" + n + "].body", body, "Function");
		
		var foundOptional = false;
		parameters.minLength = 0;
		parameters.isExpandable = false;
		
		for(var i = 0; i < parameters.length; i++) {								//For each parameter,
			if(typeof parameters[i] === "string") {									//If the parameter is a string,
				parameters[i] = jsObject.Internal.parseDeclaration(parameters[i]);	//Parse the string
				if(parameters[i].type.substr(parameters[i].type.length - 3) === "...") {	//If the type is a paramArray,
					parameters.isExpandable = parameters[i].paramArray = true;		//Flag this overload (used by an optimization in checkOverload)
					parameters[i].type = parameters[i].type.substr(0, parameters[i].type.length - 3);	//Remove the ... from the type.
				} else if(parameters[i].type.substr(parameters[i].type.length - 2) === "..") {	//If the type is a coalescence,
					parameters.isExpandable = parameters[i].coalesceParam = true;	//Flag this overload (used by an optimization in checkOverload)
					parameters[i].type = parameters[i].type.substr(0, parameters[i].type.length - 2);	//Remove the .. from the type.
				}
					
				if(parameters[i].hasOwnProperty("defaultValue"))					//If this parameter has a default value,
					parameters[i].defaultValue = eval("[ function() { return " + parameters[i].defaultValue + "; } ]")[0];	//Create a function that returns the default value.  It is wrapped in an array to work around an IE bug.
			}
			
			if(typeof parameters[i] !== "object")
				throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "overloads[" + n + "].parameters[" + i + "]", parameters[i], "Object");
				
			if(typeof parameters[i].type === "string")								//If the type is a string,
				parameters[i].type = jsObject.Types.parse(parameters[i].type);		//Parse it
				
			parameters[i].optional = parameters[i].hasOwnProperty("defaultValue");	//Set optional.
			
			if(!parameters[i].hasOwnProperty("paramArray"))							//If paramArray wasn't set,
				parameters[i].paramArray = false;									//Set it to false
				
			if(!parameters[i].hasOwnProperty("coalesceParam"))						//If coalesceParam wasn't set,
				parameters[i].coalesceParam = false;								//Set it to false
			if(parameters[i].paramArray || parameters[i].coalesceParam)				//If the parameter is a paramArray,
				parameters[i].type = jsObject.Types.Generic.Array(parameters[i].type);	//Make the type an array.
			
			if(foundOptional && !parameters[i].optional)
				throw new jsObject.Exceptions.ArgumentException("jsObject.FunctionDescriptor", "parameters[" + i + "]", parameters[i], "A mandatory parameter cannot follow an optional parameter.");
				
			if(parameters[i].optional)												//If the parameter is optional,
				foundOptional = true;												//Set foundOptional (to check for a mandatory parameter following an optional one)
			else																	//If it isn't optional,
				parameters.minLength = i;											//Set the minimum number of args (used by an optimization in checkOverload)
			
			if(typeof parameters[i].name !== "string")
				throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "overloads[" + n + "].parameters[" + i + "].name", parameters[i].name, "String");
			if(typeof parameters[i].paramArray !== "boolean")
				throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "overloads[" + n + "].parameters[" + i + "].paramArray", parameters[i].paramArray, "Boolean");
			if(typeof parameters[i].coalesceParam !== "boolean")
				throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "overloads[" + n + "].parameters[" + i + "].coalesceParam", parameters[i].coalesceParam, "Boolean");
			if(parameters[i].paramArray && i !== parameters.length - 1)
				throw new jsObject.Exceptions.ArgumentException("jsObject.FunctionDescriptor", "overloads[" + n + "].parameters[" + i + "].paramArray", parameters[i].paramArray, "only the last parameter can be a paramArray.");
			if(parameters[i].coalesceParam && i !== parameters.length - 1)
				throw new jsObject.Exceptions.ArgumentException("jsObject.FunctionDescriptor", "overloads[" + n + "].parameters[" + i + "].coalesceParam", parameters[i].coalesceParam, "only the last parameter can be a coalesced.");
			if(!(parameters[i].type instanceof jsObject.Type))
				throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "overloads[" + n + "].parameters[" + i + "].type", parameters[i].type, "jsObject.Type");
			if(parameters[i].optional && parameters[i].defaultValue !== null && typeof parameters[i].defaultValue !== "function")
				throw new jsObject.Exceptions.ArgumentTypeException("jsObject.FunctionDescriptor", "overloads[" + n + "].parameters[" + i + "].defaultValue", parameters[i].defaultValue, "function");
			parameters[i].toString = jsObject.Internal.paramToString;
		}
		
		overloads[n].fullName = name + "(" + overloads[n].parameters.join(", ") + ")";	//Set the overload's full name,
		overloads[n].toString = function() { return this.fullName; };				//Give the overload a toString
	}
};
jsObject.createFunction = function createFunction(functionDescriptor, context) {
	///<summary>Creates a type-safe function.</summary>
	///<param name="functionDescriptor" type="jsObject.FunctionDescriptor">A FunctionDescriptor object containg information about the function.</param>
	///<param name="context" optional="true">The object that the function will be run in.</param>
	///<returns type="Function">A type-safe wrapper around the function.</returns>
	
	if(!(functionDescriptor instanceof jsObject.FunctionDescriptor)) {		//If we weren't given a FunctionDescriptor, create one from our arguments.  I can't call jsObject.FunctionDescriptor.apply because I want the prototype.
		if(arguments.length === 1)
			throw new jsObject.Exceptions.ArgumentTypeException("jsObject.createFunction", "functionDescriptor", functionDescriptor, "jsObject.FunctionDescriptor");
		else
			functionDescriptor = new jsObject.FunctionDescriptor(arguments);//Pass the arguments object to the FunctionDescriptor constructor.  The constructor will check for this and read its arguments from this object.
		
		context = functionDescriptor.context;
	}
	
	var wrapper = function functionWrapper() {								//Create a wrapper function to validate arguments
		var overload = null;
		
		for(var i = 0; i < functionDescriptor.overloads.length; i++) {		//For each overload,
			var args = jsObject.Internal.checkOverload(functionDescriptor.overloads[i], arguments, this);	//Check whether the arguments match the overload.
			
			if(args)														//If they do,
				return functionDescriptor.overloads[i].body.apply(context || functionDescriptor.context || this, args);	//Call this overload.
		}
		throw new jsObject.Exceptions.OverloadException(functionDescriptor.name, arguments);	//If we haven't found an overload, throw
	};
	
	wrapper.descriptor = functionDescriptor;								//Set the wrapper's descriptor property
	wrapper.toString = jsObject.Internal.functionToString;
	
	return wrapper;
};
//FunctionDescriptor.prototype is set in jsObject.Types.js so it can parse parameter types
