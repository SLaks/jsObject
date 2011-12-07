///<reference path="jsObject.IntelliSense.js"/>
//jsObject 2.0.js
//This script has no dependencies
//This script adds jsObject to the global namespace, indexOf and lastIndexOf to Array.prototype, and trim to String.prototype.

//															//
//jsObject.createEvent
//This function creates a stand-alone event.  It returns a function
//with addHandler and removeHandler members.  To raise the event, 
//call the returned function.
//To add an event to a jsClass, call jsClass.addEvent
jsObject.createEvent = jsObject.createFunction("jsObject.createEvent", "string eventName, function... handlers = []", function(eventName, handlers) {
	var event = function event() {												//Create the event function (calling this raises the event)
		for(var i = 0; i < event.handlers.length; i++)							//For each handler,
			if(typeof event.handlers[i] === 'function')							//If this handler is a function (better safe than sorry),
				event.handlers[i].apply(this, arguments);						//Call it, scoped to whatever the event is on, with whatever arguments we were given.
	};
	event.handlers = handlers;													//Create the handlers array
			
	event.name = eventName;
	
	event.toString = function() { return "[Event " + eventName + "]"; };		//Add toString.
	
	event.addHandler = jsObject.createFunction(eventName + ".addHandler", "function... handler", function(handlers) { Array.prototype.push.apply(event.handlers, handlers); });
	event.removeHandler = jsObject.createFunction(eventName + ".removeHandler", "function... handler", function(handlers) {
		for(var i = event.handlers.length - 1; i >= 0; i--)						//For each handler in the event,
			for(var j = 0; j < handlers.length; j++)							//For each handler we were given (in case the client wants to remove two different handlers),
				if(event.handlers[i] === handlers[j])							//If the handlers are equal (if we found a handler that we were given),
					event.handlers.splice(i, 1);								//Remove it.  If the handler was added twice, both copies will be removed.
	});
	
	return event;
});
//															//
//jsObject.createProperty
//This class creates a stand-alone property.  It returns a function
//that, when called with no arguments, returns the property's value,
//and, when called with one argument, sets the property, calling onChange
//with the old and new values if it was supplied.  If onChange returns
//a value, the proeprty is set to that value instead.

//The returned function 
//also has an event called changed, which is raised in the context that 
//the property was set in with the old and new values after the property
//is changed.
//To add a property to a jsClass, call jsClass.addProperty.
jsObject.createProperty = jsObject.createFunction("jsObject.createProperty", [ 
	[ "string declaration, function? onChange = null", function(declaration, onChange) {	//eg, "int id", "string description = ''", "string category = 'Misc'", "Date dueDate = new Date()"
		var parsed = jsObject.Internal.parseDeclaration(declaration);
		
		return jsObject.createProperty(parsed.name, parsed.type, onChange, eval("[ " + parsed.defaultValue + " ]")[0]);	//The default value is wrapped in an array because IE cannot eval function definitions.
	} ], [ "string name, string type, function? onChange = null, *? initialValue = null", function(name, type, onChange, initialValue) { return jsObject.createProperty(name, jsObject.Types.parse(type), onChange, initialValue); } ],
	[ "string name, Type type, function? onChange = null, *? initialValue = null", function(name, type, onChange, initialValue) {
		if(initialValue !== null && !type.check(initialValue)) 
			throw new jsObject.Exceptions.ArgumentTypeException("jsObject.createProperty", "initialValue", initialValue, type.toString(this));
		
		var retVal = jsObject.createFunction(name, [ [ function() { return retVal.value; } ],	//Returns the property's value.  arguments.callee is the anonymous overload definition (not the type-safe wrapper), and is therefore useless.
			[ [ { name: "newVal", type: type } ], function(newVal) {			//Sets the value.
				var oldVal = retVal();											//Get the old value (for parameters).
				if(onChange) {													//If there is an onChange,
					var clientNewVal = onChange.call(this, oldVal, newVal);		//Call it.
					
					if(typeof clientNewVal !== "undefined")	{					//If onChange returned a value,
						if(!type.check(clientNewVal, this))						//And the value doesn't match the type,
							throw new jsObject.Exceptions.ArgumentTypeException(name, "generated newVal", clientNewVal, type.toString(this)); //Throw.
						newVal = clientNewVal;									//Use the new value returned by onChange
					}
				}
				
				retVal.value = newVal;											//Set the property's value,
				retVal.changed.call(this, oldVal, retVal());					//And call the change event.
			} ]
		]);
		
		retVal.value = initialValue;											//Set the default value
		retVal.changed = jsObject.createEvent(name + "Changed");				//Create the changed event
		retVal.toString = function() { return "[Property " + type.toString() + " " + name + " = " + jsObject.toDebugString(this.value) + "]"; };
		retVal.isProperty = true;
		retVal.type = type;
		
		return retVal;
	} ]
]);

//															//
//jsObject.createEnum
//This function creates an enumerated type.  It returns a object
//with one member for each string in the items parameter, and a type
//field containing a jsObject.Type for the enumeration.  
//jsObject.Types.parse can be given the name of the enum.
jsObject.createEnum = jsObject.createFunction("jsObject.createEnum", "string name, string... items", function(name, items) {
	if(items.length === 1) items = items[0].split(",");
	var retVal = { 
		name			: name,
		type			: new jsObject.Type(name, "Enumeration", function(x) { return typeof x === "object" && retVal[x.name] === x; }),
		toString		: function() { return "[Enum " + name + "]"; },
		items			: []
	};
	for(var i = 0; i < items.length; i++) {										//For each item,
		items[i] = items[i].trim();												//Trim the item (in case it was split)
		retVal[items[i]] = {													//Add the item to the enum object by name.
			name		: items[i],
			type		: retVal,
			toString	: function() { return this.name; }
		};
		retVal.items.push(retVal[items[i]]);									//Add the item to the items array.
	}
	if(!jsObject.Types.cache.hasOwnProperty(name))
		jsObject.Types.cache[name] = retVal.type;

	
	return retVal;
});
