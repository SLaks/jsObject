jsObject is a powerful Javascript framework for object oriented development.

For sample usage, see the included [jsTest](https://github.com/SLaks/jsObject/blob/master/Tests/jsTest.js).

The scripts are executed in the following order:

 1. [jsObject.Internal.js](https://github.com/SLaks/jsObject/blob/master/	jsObject.Internal.js)
 1. [jsObject.Functions.js](https://github.com/SLaks/jsObject/blob/master/jsObject.Functions.js)
 1. [jsObject.Types.js](https://github.com/SLaks/jsObject/blob/master/jsObject.Types.js)
 1. [jsObject.Types.Generic.js](https://github.com/SLaks/jsObject/blob/master/jsObject.Types.Generic.js)
 1. [jsObject.Core.js](https://github.com/SLaks/jsObject/blob/master/jsObject.Core.js)
 1. [jsObject.Classes.js](https://github.com/SLaks/jsObject/blob/master/jsObject.Classes.js)
 1. [jsObject.Collection.js](https://github.com/SLaks/jsObject/blob/master/jsObject.Collection.js)

#Features
 - 	Exceptions (somewhat useless)
 - 	Types
   - Javascript primitive types
   - Regex
   - Date
   - Integer
   - Classes (see later)
   - Enums (see later)
   - Parameterized types:
     - Generic classes (see later)
     - Arrays
     - Union types
     - Complex object types (composed of typed properties)
     - Complex array types (composed of a sequence of types)
     - Nullable types
 - 	Overloaded type-checked functions
   - Optional parameters
   - varargs
 - 	Multicast events
 - 	Properties
   - Change events
 - 	Enums
 - 	Classes
   - Overloaded constructors (same as JSObject functions)
   - Single inheritance
   - Overloadable virtual member functions
   - Arbitrary non-virtual base-class calls
   - Member events (separate from standalone events)
     - Static handlers
   - Member properties (separate from standalone properties)
     - Overridable
     - Default values
     - Change events
   - Generic classes (allows member functions to have generic type parameters)
   - Open or closed generic base types
 - 	Generic Collection<T> class

#Missing Features
 - Interfaces
 - Namespaces
 - Nested classes
 - Access modifiers
 - Class fields
 - Static members 
 - Type relations
 - Generic type constraints (requires type comparison)
 - Covariance (requres type comparison)
 - Sealed/final methods
 - Higher-kinded types
 - Delegate types
 - Value types
 - Reflection

