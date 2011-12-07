///<reference path="jsObject.IntelliSense.js"/>
//jsObject 2.0
//This script has no dependencies
//This script adds jsObject to the global namespace, indexOf and lastIndexOf to Array.prototype, and trim to String.prototype.

jsObject.Internal.Flags = {											//Flags passed to jsClass construcotrs for internal purposes.
	protoOnly	: { toString: function() { return "[jsObject Flag: protoOnly]"; }  }	//Do nothing (this is used to get an object with the class' prototype)
};
		

jsObject.Internal.$Object = function $Object(instance, jsClass) {
	///<summary>This object is instantiated as the $ property on every jsObject.  It contains property values and event handlers</summary>
	this.instance		= instance;
	this.jsClass		= jsClass;
	
	this.eventHandlers	= { };
	this.propertyValues	= new jsClass.$.PropertyValues(instance);
	this.baseObjects	= { };
	
	var cBaseLevel = jsClass;
	
	while(cBaseLevel.base && (cBaseLevel = cBaseLevel.base.jsClass))
		this.baseObjects[cBaseLevel.className] = new cBaseLevel.$.BaseObject(this);
}
jsObject.Internal.$Object.prototype.toString = function() { return "[" + this.instance.toString() + ".$]"; };

//Creates a property function to add to the prototype of a jsClass or a BaseObject.
//The returned function must operate from either a BaseObject or an instance.
//this.$.instance will always return the actual instance.
jsObject.Internal.createClassProperty = jsObject.createFunction("jsObject.Internal.createClassProperty", "string propertyName, Type type, function onChange", function(propertyName, type, onChange) {
	var retVal = function classProperty(newVal) {
		var oldVal = this.$.propertyValues[propertyName];						//Get the current value (BaseObjects also have $Objects)
		if(arguments.length === 0)												//If we didn't get any arguments,
			return oldVal;														//Return the current value.
		
		if(!type.check(newVal, this.$.instance))								//If the returned newVal doesn't match the type,
			throw new jsObject.Exceptions.ArgumentTypeException(this.$.fullName + "." + propertyName, "newVal", newVal, type.toString(this.$.instance));
			
		var realNewVal = onChange.call(this.$.instance, oldVal, newVal);		//Call the supplied callback (which should call the user's callback)
		if(typeof realNewVal !== "undefined") {									//If it returned a value,
			if(!type.check(newVal, this.$.instance))							//Make sure the value matches the type.
				throw new jsObject.Exceptions.ArgumentTypeException(this.$.fullName + "." + propertyName, "generated newVal", newVal, type.toString(this.$.instance));
			newVal = realNewVal;												//Use the returned value.
		}
		this.$.propertyValues[propertyName] = newVal;							//Update the property's value.
		
		this.$.instance[propertyName + "Changed"](oldVal, newVal);				//Raise the changed event.
	};
	retVal.isProperty = true;
	retVal.type = type;
	
	return retVal;
});
//Creates an event function to add to an instance of a jsClass.
//An event function can be invoked on any context, allowing events to be "chained" (ie, event1.addHandler(event2);)
jsObject.Internal.createClassEvent = jsObject.createFunction("jsObject.Internal.createClassEvent", "jsObject instance, jsObject.EventInfo event", function(instance, event) {
	var retVal				= function classEvent() {							//Build the event function (which raises the event with its args)
		var handlers = event.staticHandlers.concat(instance.$.eventHandlers[event.name] || []);	//Get the event handlers, starting with static handlers (which is always defined, even as an empty array) and ending with this instance's handlers (if any)
		for(var i = 0; i < handlers.length; i++)								//For each handler,
			if(typeof handlers[i] === 'function')								//If the handler is a function,
				handlers[i].apply(instance, arguments);							//Call the handler.
	};
	
	retVal.event			= event;											//Give the event function its event (see above)
	retVal.toString			= function() { return "[Event " + instance.$.fullName + "." + event.name + "]"; };		//Give it a toString.
	retVal.addHandler		= jsObject.createFunction(instance.$.fullName + "." + event.name + ".addHandler", "function... handler", function(handlers) {	//addHandler needs this.$, but its context is the event function. 
		var eventHandlers	= instance.$.eventHandlers;							//Get the instance's $Object's event handlers.
		if(!eventHandlers[event.name])											//If this event doesn't have handlers,
			eventHandlers[event.name] = handlers;								//Start with the our handlers array.
		else																	//If it does,
			Array.prototype.push.apply(eventHandlers[event.name], handlers);	//Append our array.  [ 1, 2 ].push([ 3, 4, 5 ]) makes [ 1, 2, [ 3, 4, 5 ] ], so I use apply (because [ 1, 2 ].push(3, 4, 5) makes [ 1, 2, 3, 4, 5 ]
	});
	retVal.removeHandler	= jsObject.createFunction(instance.$.fullName + "." + event.name + ".removeHandler", "function... handler", function(handlers) {	//removeHandler needs this.$, but its context is the event function. 
		var eventHandlers	= instance.$.eventHandlers;							//Get the instance's $Object's event handlers.
		if(!eventHandlers[event.name]) return;									//If we don't have any handlers, there is nothing to remove.
		
		var myHandlers = eventHandlers[event.name];								//Get the handlers for this event.
		for(var i = myHandlers.length - 1; i >= 0; i--)							//For each handler in the event (backwards to allow multiple removals),
			for(var j = 0; j < handlers.length; j++)							//For each handler we are to remove,
				if(myHandlers[i] === handlers[j])								//If the handlers are equal,
					myHandlers.splice(i, 1);									//Remove this handler from the event.
	});
	
	return retVal;
});
//															//
//jsObject.EventInfo
//This class describes an event that is part of a jsClass and
//stores static handlers.  It is returned by jsClass.addEvent
//It is not used by stand-alone events
jsObject.EventInfo = jsObject.createFunction("jsObject.EventInfo", "jsClass jsClass, string eventName", function(jsClass, eventName) {
	this.jsClass		= jsClass; 
	this.name			= eventName; 
	this.staticHandlers	= []; 
});
jsObject.EventInfo.prototype = {
	addStaticHandler	: jsObject.createFunction("jsObject.Event.addStaticHandler", "function... handler", function(handlers) {
		this.staticHandlers.push.apply(this.staticHandlers, handlers);
	}),
	removeStaticHandler	: jsObject.createFunction("jsObject.Event.removeStaticHandler", "function... handler", function(handlers) {
		for(var i = event.handlers.length - 1; i >= 0; i--)						//For each handler in the event,
			for(var j = 0; j < handlers.length; j++)							//For each handler we were given (in case the client wants to remove two different handlers),
				if(event.handlers[i] === handlers[j])							//If the handlers are equal (if we found a handler that we were given),
					event.handlers.splice(i, 1);								//Remove it.  If the handler was added twice, both copies will be removed.
	}),
	toString			: function() { return "[EventInfo " + this.jsClass.fullName + "." + this.name + "]"; }
};
//															//
//jsObject.PropertyInfo
//This class describes a property that is part of a jsClass.
//It is returned by jsClass.addProperty
//It is not used by stand-alone properties
jsObject.PropertyInfo = jsObject.createFunction("jsObject.PropertyInfo", "jsClass jsClass, string propertyName, Type type, function? onChange", function(jsClass, propertyName, type, onChange) { 
	this.jsClass		= jsClass; 
	this.name			= propertyName; 
	this.type			= type;
	this.onChange		= onChange;
});
jsObject.PropertyInfo.prototype = {
	toString			: function() { return "[PropertyInfo " + this.type.toString() + " " + this.jsClass.fullName + "." + this.name + "]"; }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//jsClass

jsObject.Types.cache["jsClass-members-arg"] = jsObject.Types.parse("{ [(FunctionDescriptor | Array)[] methods], [string | string[] events], [(string | [ string, [function] ])[] | string properties], [function toString] }");

jsObject.createClass = jsObject.createFunction(
	"jsObject.createClass",	[ [
		"FunctionDescriptor ctor, jsClass-members-arg members",
		function(ctor, members) { 
			var colon = ctor.name.indexOf(":");
			return jsObject.createClass(
				colon === -1 ? ctor.name : ctor.name.substr(0, colon).trim(), 
				[], 
				colon === -1 ? null : ctor.name.substr(colon + 1).trim(), 
				ctor, 
				members
			); 
		}
	], [
		"string className, FunctionDescriptor ctor, jsClass-members-arg members",
		function(className, ctor, members) { return jsObject.createClass(className, [], null, ctor, members); }
	], [
		"string className, (string | jsClass | { jsClass jsClass, (string | Type)[] genericArgs })? baseClass, FunctionDescriptor ctor, jsClass-members-arg members",
		function(className, baseClass, ctor, members) { return jsObject.createClass(className, [], baseClass, ctor, members); }
	], [
		"string className, string[] genericParams, FunctionDescriptor ctor, jsClass-members-arg members",
		function(className, genericParams, ctor, members) { return jsObject.createClass(className, genericParams, null, ctor, members); }
	], [
		"string className, string[] genericParams, (string | jsClass | { jsClass jsClass, (string | Type)[] genericArgs })? baseClass, FunctionDescriptor ctor, jsClass-members-arg members",
		function(className, genericParams, baseClass, ctor, members) {
			if(className.charAt(className.length - 1) === ">") {				//If the class name ends with >, parse out the generic parameters.
				if(genericParams.length > 0)
					throw new jsObject.Exceptions.ArgumentException("jsObject.createClass", "genericParams", genericParams, "generic type parameters cannot be specified twice");
				var openArrow = className.indexOf("<");							//Find the <.
				if(openArrow === -1)											//If there is a > but not a <, throw
					throw new jsObject.Exceptions.ArgumentException("jsObject.createClass", "className", className, "syntax error");
				
				genericParams = className.substring(openArrow + 1, className.length - 1).replace(/\s/g, "").split(",");	//Extract the generic param names and strip whitespace.
				className = className.substr(0, openArrow);						//Extract the class name
			}
			if(jsObject.classes.hasOwnProperty(className))
				throw new jsObject.Exceptions.ArgumentException("jsObject.createClass", "className", className, "class already exists");
			if(jsObject.Types.cache.hasOwnProperty(className))
				throw new jsObject.Exceptions.ArgumentException("jsObject.createClass", "className", className, "type already exists");
				
			if(baseClass) {														//If we were given a base class, normalize the parameter.  Inheritance is implemented later.
				if(typeof baseClass === "string") {								//If it's a string, parse it.
					if(baseClass.charAt(baseClass.length - 1) !== ">") {		//If it's a simple string (as opposed to a generic class),
						baseClass = jsObject.classes[baseClass];				//Get the corresponding class.
						if(!jsObject.Types.jsClass.check(baseClass))			//If we didn't get a jsClass,
							throw new jsObject.Exceptions.ArgumentException("jsObject.createClass", "baseClass", arguments[2], "couldn't resolve classname.");
					} else {													//If it is a generic class (with parameters)
						baseClass = jsObject.Internal.parseGenericClass(baseClass);	//Parse the string.
						if(!baseClass)											//If the string didn't parse,
							throw new jsObject.Exceptions.ArgumentException("jsObject.createClass", "baseClass", arguments[2], "syntax error");
					}
				}
				if(jsObject.Types.jsClass.check(baseClass))						//If it is a jsClass, (this is not an else because a string can parse to a jsClass)
					baseClass = { jsClass: baseClass, genericArgs: [] };		//Wrap it an the expected object.
				//At this point, baseClass is an object matching { jsClass jsClass, (string | Type)[] genericArgs }
				if(baseClass.genericArgs.length !== baseClass.jsClass.genericParams.length)
					throw new jsObject.Exceptions.ArgumentException("jsObject.createClass", "baseClass", arguments[2], "Generic parameters must be specified");
					
				for(var i = 0; i < baseClass.genericArgs.length; i++) {			//For each generic parameter given to the base class,
					if(typeof baseClass.genericArgs[i] === "string")			//If it is a string,
						baseClass.genericArgs[i] = jsObject.Types.parse(baseClass.genericArgs[i].trim());	//Parse it.
				}
			}
			ctor.setName(className);											//Rename the constructor. (In case its name has generic params and/or a base class)
			var actualConstructor;												//The inner wrapper around the constructor.  This can be called by a derived class.
			if(baseClass) {														//If we have a base class, build a special wrapper that gives the client's constructor a base function.
				actualConstructor = function actualConstructor() {
					var context = this;
					
					for(var i = 0; i < ctor.overloads.length; i++) {			//For each overload,
						var args = jsObject.Internal.checkOverload(ctor.overloads[i], arguments, this);	//Check whether the arguments match the overload.
						
						if(args)												//If they do,
							return ctor.overloads[i].body.apply(				//Call this overload,
								this,											//on the class instance,
								args.concat(jsObject.Internal.extend(function() {	//with our arguments, plus a base function.
									baseClass.jsClass.actualConstructor.apply(context, arguments)//The base function should call the base class' constructor,
								}, this.$.baseObjects[baseClass.jsClass.className], true)));	//and should have the base class' methods (to allow base.method())
					}
					throw new jsObject.Exceptions.OverloadException(ctor.name, arguments);	//If we haven't found an overload, throw
				}
				actualConstructor.descriptor = ctor;
				actualConstructor.toString = jsObject.Internal.functionToString;
			} else																//If we don't have a base class,
				actualConstructor = jsObject.createFunction(ctor);				//A regular type-safe function will do.
			
			var wrapper = function classWrapper(flags) {						//Create the actual class constructor, which wraps the original and handles generic args, property values, events, etc.
				if(flags === jsObject.Internal.Flags.protoOnly && arguments.length === 1)	//If we got the protoOnly flag (only),
					return;														//Do nothing.  This gives the caller an uninitialized object with our prototype and is used for derived class prototypes (see below)

				//We need to parse generic parameters before
				//creating the $Object, in case any property
				//initializers call generic methods.
				var fullName;
				if(genericParams.length > 0) {									//If this is a generic class, read the types from our args.
					var typeParams = false;
					if(genericParams.length > 1) {								//If there are multiple generic params, see whether they were all given in one string.
						typeParams = jsObject.Internal.escapedSplit(arguments[0], "{([<", ">])}", ",");	//Split the first arg by commas.
						
						if(typeParams.length === genericParams.length)			//If we got the right number of type args,
							Array.prototype.splice.call(arguments, 0, 1);		//Remove our first arg (so that the client's constructor doesn't get it)
						else													//Otherwise,
							typeParams = false;									//We don't have them yet.
					}
					if(!typeParams)												//If we haven't gotten type args yet,
						typeParams = Array.prototype.splice.call(arguments, 0, genericParams.length);	//Get them from the beginning for our args. (& remove them so that the client constructor doesn't get it)

					for(var i = 0; i < genericParams.length; i++) {				//For each generic arg,
						if(typeof typeParams[i] === "string")					//If this arg is a string
							typeParams[i] = jsObject.Types.parse(typeParams[i].trim());	//Parse the string.
						if(!(typeParams[i] instanceof jsObject.Type))			//If it isn't a type,
							throw new jsObject.Exceptions.ArgumentTypeException(className, "$" + genericParams[i], typeParams[i], "jsObject.Type");
						
						this["$" + genericParams[i]] = typeParams[i];			//Add the type arg to the object.
					}
					fullName = className + "<" + jsObject.Internal.customJoin(typeParams, ", ", this) + ">";	//Build fullName.
				} else fullName = className;									//If this isn't a generic class, use the class' name.  (fullName is used by the default toString)
				
				this.$ = new jsObject.Internal.$Object(this, wrapper);			//Create the $Object.
				
				this.$.instanceId = jsObject.instanceCount++;					//Assign an instanceID.
				this.$.fullName = fullName;										//Give the $Object our fullName.  Property initializers (which are called by $Object) may require generic types (If they call generic methods), so we can't parse generic types later and assign this directly.
				var cBaseLevel = { base: { jsClass: wrapper } };				//Start with our class, not our base class.
				while(cBaseLevel.base && (cBaseLevel = cBaseLevel.base.jsClass)) {		//For each base class,
					for(var i = 0; i < cBaseLevel.events.length; i++) {			//For each event, build an event function.  addHandler and removeHandler need to get the instance's $Object, so events cannot be built in the prototype.
						this[cBaseLevel.events[i].name] = jsObject.Internal.createClassEvent(this, cBaseLevel.events[i]);
					}
				}
				
				//The class has been initialized; time to call the client's constructor.
				actualConstructor.apply(this, arguments);
			};
				
			wrapper.className			= className;
			wrapper.fullName			= className + (genericParams.length === 0 ? "" : "<" + genericParams.join(", ") + ">");
			wrapper.actualConstructor	= actualConstructor;
			wrapper.constructorDescriptor = ctor;
			wrapper.genericParams		= genericParams;
			wrapper.$					= {										//This $ object contains protoypes used by the $Object constructor.
				PropertyValues			: function PropertyValues(instance) {	//Stores default values for properties
					if(instance === jsObject.Internal.Flags.protoOnly)
						return;
					//This code is called per-instance from the $Object constructor
					for(var i in this)											//For each default property value generator,
						this[i] = this[i].call(instance);						//Execute the function to get a value.
				},
				BaseObject				: function BaseObject($) {				//Contains non-virtual versions of every function.  Given to functions in any class directly derived from this one as the base parameter.
					if($ === jsObject.Internal.Flags.protoOnly)
						return;
					this.$ = $; 
				}
			};

			//At this point, baseClass is either null or an object matching { jsClass jsClass, Type[] genericArgs }
			if (baseClass) {														//If we have a base class,
				wrapper.base			= baseClass;
				wrapper.prototype		= new baseClass.jsClass(jsObject.Internal.Flags.protoOnly);	//Initialize our prototype.
				wrapper.$.PropertyValues.prototype	= new baseClass.jsClass.$.PropertyValues(jsObject.Internal.Flags.protoOnly);	//Copy the base class' default property value generators.
				wrapper.$.BaseObject.prototype		= new baseClass.jsClass.$.BaseObject(jsObject.Internal.Flags.protoOnly);	//Copy the base class' base object.
			}
			
			wrapper.prototype.jsClass	= wrapper;
			
			if(members.hasOwnProperty("toString"))								//If we were given a toString,
				wrapper.prototype.toString	= members.toString;					//Use it.
			else if(!baseClass)													//If we weren't, and we don't have a base class,
				wrapper.prototype.toString	= function() { return "[" + this.$.fullName + "]"; };	//Use the default toString.
			//If we have a baseClass, but we weren't given a toString, we 
			//will automatically inherit toString from the base class' prototype.
			//As the default toString is the same for every class (it doesn't use closured variables), this is never a problem.
			
			wrapper.toString			= function() { return "[jsClass " + wrapper.fullName + "]"; };
			wrapper.type				= new jsObject.Type(className, "jsClass", function(x) { return x instanceof wrapper; }, { jsClass: wrapper });	//instanceof works for base classes too.
			
			jsObject.classes[className]	= wrapper;								//Add this class to the class list.
			jsObject.Types.cache[className] = wrapper.type;						//Add the class' type to the type cache (allows jsObject.Types.parse(className))
				
			if(genericParams.length > 0) {										//If this is a generic class, create a generic type for it.
				wrapper.genericType = jsObject.createFunction(wrapper.fullName, [ 
					[ "Type $" + genericParams.join(", Type $"), function() {	//This function creates and returns the actual Type (read jsObject.Types.Generic.js for details on the pattern)
						var types = arguments;									//Save a copy of our arguments for the closure.
						var retVal = new jsObject.Type(className + "<" + Array.prototype.join.call(arguments, ", ") + ">", "jsClass", function(x, genericContext) {
							if(!(x instanceof wrapper)) return false;			//If the value isn't an instance of this class, fail. instanceof works for base classes too.
							for(var i = 0; i < genericParams.length; i++)		//For each generic param,
								if(	types[i] !== jsObject.Types.Any &&			//Types.Any matches anything.
									x["$" + genericParams[i]].toString(x) !== types[i].toString(genericContext))	//Allow for derived class generic parameter renaming (x.$Q = Types.parse("$T"))
									return false;								//If the type doesn't match, fail.
							return true;										//If every type arg matched, succeed.
						}, { jsClass: wrapper, toString: function(genericContext) { 
							return className + "<" + jsObject.Internal.customJoin(types, ", ", genericContext) + ">"; 
						}});
						
						for(var i = 0; i < genericParams.length; i++)
							retVal[genericParams[i]] = types[i];
						
						return retVal;
					} ],
					[ "string $" + genericParams.join(", string $"), function() {
						var args = [];
						for(var i = 0; i < genericParams.length; i++)			//For each arg,
							args.push(jsObject.Types.parse(arguments[i].trim()));//Parse the type.
						return wrapper.genericType.apply(this, args);
					} ],
					//If there is only one generic arg, this overload is the same as the previous one and will never be called.
					[ "string types", function(types) { return wrapper.genericType.apply(this, jsObject.Internal.escapedSplit(types, "{([<", ">)]}", ",")); } ]
				]);
			}
			
			wrapper.methods = [];
			wrapper.addMethod = function addMethod(functionDescriptor) {
				if(!(functionDescriptor instanceof jsObject.FunctionDescriptor)) {
					if (arguments.length === 1) {
						if (jsObject.Types.Array.check(functionDescriptor))
							functionDescriptor = new jsObject.FunctionDescriptor(functionDescriptor); //Pass the arguments object to the FunctionDescriptor constructor.  The constructor will check for this and read its arguments from this object.
						else
							throw new jsObject.Exceptions.ArgumentTypeException(className + ".addMethod", "functionDescriptor", functionDescriptor, "jsObject.functionDescriptor");
					} else
						functionDescriptor = new jsObject.FunctionDescriptor(arguments);
				}
				if(typeof wrapper.prototype[functionDescriptor.name] !== "undefined" && typeof wrapper.prototype[functionDescriptor.name] !== "function")	//If the prototype already has a member of this name, complain (unless it's a function, in which case we'll override it)
					throw new jsObject.Exceptions.ArgumentException(className + ".addMethod", "functionDescriptor", functionDescriptor, className + ".prototype already has a member named " + functionDescriptor.name + " (" + jsObject.toDebugString(wrapper.prototype[functionDescriptor.name]) + ").");
					
				if(baseClass) {													//If we have a base class,
					wrapper.prototype[functionDescriptor.name] = function virtualFunction() {	//Generate a wrapper that checks for base overloads and provides a base object.
						//Within this function, we cannot use the wrapper variable,
						//as we may be running in a derived class.
						var cBaseLevel = { base: { jsClass: this.$.jsClass } };					//Start with the instance's class, not its base class.
						while(cBaseLevel.base && (cBaseLevel = cBaseLevel.base.jsClass)) {		//For each base class,
							var cDescriptor = cBaseLevel.methods[functionDescriptor.name];		//Get the FunctionDescriptor for this method from this base class.
							if(!(cDescriptor instanceof jsObject.FunctionDescriptor))			//If this base class doesn't have any methods of this name,
								continue;														//Skip it.
							
							for(var i = 0; i < cDescriptor.overloads.length; i++) {				//For each overload in this base class,
								var args = jsObject.Internal.checkOverload(cDescriptor.overloads[i], arguments, this);	//Check whether the arguments match the overload.
								
								if(args)														//If they do,
									return cDescriptor.overloads[i].body.apply(					//Call this overload,
										this,													//on the class instance,
										cBaseLevel.base ?										//And, if this function's class has a base,
											args.concat(this.$.baseObjects[cBaseLevel.base.jsClass.className])//with the baseObject for the base class of this function' class (not the base class of whatever derived type the instance is; not our base class)
										: args													//or, if this function's class doesn't have a base class, without any BaseObject
									);
							}
						}
						throw new jsObject.Exceptions.OverloadException(functionDescriptor.name, arguments);	//If we haven't found an overload, throw
					};
					wrapper.prototype[functionDescriptor.name].descriptor = functionDescriptor;
					wrapper.prototype[functionDescriptor.name].toString = jsObject.Internal.functionToString;
				} else															//If we don't have a base class,
					wrapper.prototype[functionDescriptor.name] = jsObject.createFunction(functionDescriptor);	//A normal type-safe function will do.  If the method is overridden, this function will be replaced by the code above.
				wrapper.methods[functionDescriptor.name] = functionDescriptor;
				wrapper.methods.push(functionDescriptor);

				wrapper.$.BaseObject.prototype[functionDescriptor.name] = function baseWrapper() {	//Generate a wrapper for BaseObject that searches downward from our base class.
					//This function is given to derived classes in the BaseObject
				
					//Within this function, we should use the wrapper variable,
					//since we want to do everything from the POV of our own class.
					//This function is run in the context of the BaseObject instance
					var cBaseLevel = { base: { jsClass: wrapper } };						//Start with our class, not our base class.
					while(cBaseLevel.base && (cBaseLevel = cBaseLevel.base.jsClass)) {		//For each base class,
						var cDescriptor = cBaseLevel.methods[functionDescriptor.name];		//Get the FunctionDescriptor for this method from this base class.
						if(!(cDescriptor instanceof jsObject.FunctionDescriptor))			//If this base class doesn't have any methods of this name,
							continue;														//Skip it.
						
						for(var i = 0; i < cDescriptor.overloads.length; i++) {				//For each overload in this base class,,
							var args = jsObject.Internal.checkOverload(cDescriptor.overloads[i], arguments, this.$.instance);	//Check whether the arguments match the overload.
							
							if(args)														//If they do,
								return cDescriptor.overloads[i].body.apply(					//Call this overload,
									this.$.instance,										//on the class instance,
									cBaseLevel.base ?										//And, if this function's class has a base,
										args.concat(this.$.baseObjects[cBaseLevel.base.jsClass.className])//with the baseObject for the base class of this function' class (not the base class of whatever derived type the instance is; not our base class; not our base class' base class)
									: args													//or, if this function's class doesn't have a base class, without any BaseObject
								);
						}
					}
					throw new jsObject.Exceptions.OverloadException(functionDescriptor.name, arguments);	//If we haven't found an overload, throw
				};
				wrapper.$.BaseObject.prototype[functionDescriptor.name].descriptor = functionDescriptor;
				wrapper.$.BaseObject.prototype[functionDescriptor.name].toString = jsObject.Internal.functionToString;
								
				return wrapper.prototype[functionDescriptor.name];
			};
				
			if(members.methods) 
				for(var i = 0; i < members.methods.length; i++) 
					wrapper.addMethod(members.methods[i]);
			
			wrapper.events = [];
			wrapper.addEvent = jsObject.createFunction(className + ".addEvent", "string eventName, function... staticHandlers = []", function(eventName, staticHandlers) {
				if(wrapper.prototype.hasOwnProperty(eventName))
					throw new jsObject.Exceptions.ArgumentException(className + ".addEvent", "eventName", eventName, className + ".prototype already has a member named " + eventName + " (" + jsObject.toDebugString(wrapper.prototype[eventName]) + ").");
				if(wrapper.events.hasOwnProperty(eventName))
					throw new jsObject.Exceptions.ArgumentException(className + ".addEvent", "eventName", eventName, "an event named " + eventName + " already exists.");
				var newEvent = new jsObject.EventInfo(wrapper, eventName);
				
				for(var i = 0; i < staticHandlers.length; i++)
					newEvent.addStaticHandler(staticHandlers[i]);
				
				wrapper.events.push(newEvent);
				wrapper.events[eventName] = newEvent;
				
				return newEvent;
			});
			if(members.events) {
				if(typeof members.events === "string")
					members.events = members.events.split(",");
				for(var i = 0; i < members.events.length; i++) 
					wrapper.addEvent(members.events[i].trim());
			}
			
			wrapper.properties = [];
			wrapper.addProperty = jsObject.createFunction(className + ".addProperty", [
				[ "string declaration, function onChange = null", function(declaration, onChange) {
					var parsed = jsObject.Internal.parseDeclaration(declaration);
					
					return wrapper.addProperty(parsed.name, parsed.type, onChange, eval("[ function() { return " + parsed.defaultValue + "; } ]")[0]);	//The default value is put into a function to prevent instances from sharing objects.  IE cannot eval functions, so I wrap it in an array.
				} ], [ "string propertyName, string type, function onChange = null, function defaultValue = null", function(propertyName, type, onChange, defaultValue) { 
					return wrapper.addProperty(propertyName, jsObject.Types.parse(type), onChange, defaultValue);
				} ], [ "string propertyName, Type type, function onChange = null, function defaultValue = null", function(propertyName, type, onChange, defaultValue) { 
					var info = new jsObject.PropertyInfo(wrapper, propertyName, type, onChange);
					
					info.changed = wrapper.addEvent(propertyName + "Changed");
					
					wrapper.prototype[propertyName] = info.property = jsObject.Internal.createClassProperty(propertyName, type, function(oldVal, newVal) {
						//Within this function, we cannot use the wrapper variable,
						//as we may be running in a derived class.
						var cBaseLevel = { base: { jsClass: this.$.jsClass } };	//Start with the instance's class, not its base class.
						while(cBaseLevel.base && (cBaseLevel = cBaseLevel.base.jsClass)) {	//For each base class,
							var cProperty = cBaseLevel.properties[propertyName];//Get the PropertyInfo for this method from this base class.
							
							if(!(cProperty instanceof jsObject.PropertyInfo))	//If this base class doesn't have a property of this name,
								continue;										//Skip it.
							if(typeof cProperty.onChange !== "function")		//If this property doesn't have an onChange (this allows a derived class to change the default value or type of an inherited property without having to override its onChange)
								continue;										//Skip it.
								
							if(cBaseLevel.base)									//If this onChange was defined on a derived class,
								return cProperty.onChange.call(this, oldVal, newVal,	//Call it
									this.$.baseObjects[cBaseLevel.base.jsClass.className]);//With its baseObject.
							else												//If it wasn't defined on a derived class,
								return cProperty.onChange.call(this, oldVal, newVal);	//Call it without a baseObject.
						}
					});
					wrapper.$.BaseObject.prototype[propertyName] = info.baseProperty = jsObject.Internal.createClassProperty(propertyName, type, function(oldVal, newVal) {
						//This function is given to derived classes in the BaseObject
						
						//Within this function, we should use the wrapper variable,
						//since we want to do everything from the POV of our own class.
						//This function is run in the context of the BaseObject instance
						var cBaseLevel = { base: { jsClass: wrapper } };		//Start with our class.
						while(cBaseLevel.base && (cBaseLevel = cBaseLevel.base.jsClass)) {	//For each base class,
							var cProperty = cBaseLevel.properties[propertyName];//Get the PropertyInfo for this method from this base class.
							
							if(!(cProperty instanceof jsObject.PropertyInfo))	//If this base class doesn't have a property of this name,
								continue;										//Skip it.
							if(typeof cProperty.onChange !== "function")		//If this property doesn't have an onChane (this allows a derived class to change the default value or type of an inherited property without having to override its onChange)
								continue;										//SKip it.
								
							if(cBaseLevel.base)									//If this onChange was defined on a derived class,
								return cProperty.onChange.call(this, oldVal, newVal,	//Call it
									this.$.baseObjects[cBaseLevel.base.jsClass.className]);//With its baseObject.
							else												//If it wasn't defined on a derived class,
								return cProperty.onChange.call(this, oldVal, newVal);	//Call it without a baseObject.
						}
					});
					
					info.property.info = info;
					info.baseProperty.info = info;
					
					info.property.toString = info.baseProperty.toString = function() { return "[" + type.toString() + " " + wrapper.fullName + "." + propertyName + "]"; };
					
					wrapper.properties[propertyName] = info;
					wrapper.properties.push(info);
					wrapper.$.PropertyValues.prototype[propertyName] = defaultValue;
					
					return info;
				} ]
			]);
			
			if(members.properties) {
				if(typeof members.properties === "string")
					members.properties = jsObject.Internal.escapedSplit(members.properties, "{([<", ">])}", ",");
				for(var i = 0; i < members.properties.length; i++) {
					if(typeof members.properties[i] === "string")
						wrapper.addProperty(members.properties[i]);
					else if(members.properties[i].length === 1)
						wrapper.addProperty(members.properties[i][0]);
					else
						wrapper.addProperty(members.properties[i][0], members.properties[i][1]);
				}
			}
			
			wrapper.lock = jsObject.createFunction(className + ".lock", function() {
				delete wrapper.addEvent;
				delete wrapper.addMethod;
				delete wrapper.addProperty;
				delete wrapper.lock;
			});
			
			//Add the supplied generic parameters of the base classs to the prototype, if any.
			//I allow for "StringDictionary<TValue> : Dictionary<string, $TValue>". 
			//I don't allow for "NullableCollection<T> : Collection<$T?>" - $T would need to be different for base class methods.  If you try it, the Collection methods will get $T, not $T?
			//I also don't allow for "FunnyDictionary<TKey, TValue> : Dictionary<TValue, TKey>".  If you try it, the parameters wouldn't get swapped.
			if(baseClass)
				for(var i = 0; i < baseClass.genericArgs.length; i++)
					if(genericParams.indexOf(baseClass.jsClass.genericParams[i]) === -1)				
						wrapper.prototype["$" + baseClass.jsClass.genericParams[i]] = baseClass.genericArgs[i];
			
			return wrapper;
		}
	] ]
);
