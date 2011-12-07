///<reference path="jsObject.IntelliSense.js"/>
//jsObject 2.0
//This script has no dependencies
//This script adds jsObject to the global namespace, indexOf and lastIndexOf to Array.prototype, and trim to String.prototype.

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//jsObject.Collection

jsObject.Collection = jsObject.createClass(
	"jsObject.Collection<T>", 
	new jsObject.FunctionDescriptor("jsObject.Collection", "string name = '', $T... items = []", function(name, items) {
		this.name = name || "Collection<" + this.$T.toString(this) + ">";
		
		this.length = 0;
		if(items.length > 0)
			this.addRange(items);
	}), { 
		toString	: function() { return "[" + this.name + " - " + this.length + " item" + (this.length !== 1 ? "s]" : "]"); },
		methods		: [
			//Protected:
			new jsObject.FunctionDescriptor("onItemAdded", "$T item, int index", function(item, index) { this.itemAdded(item, index); }),
			new jsObject.FunctionDescriptor("onItemRemoved", "$T item, int index", function(item, index) { this.itemRemoved(item, index); }),
			new jsObject.FunctionDescriptor("onClearing", function() { this.clearing(); }),
			//Public:
			new jsObject.FunctionDescriptor("add", "$T item", function(item) { 
				Array.prototype.push.call(this, item); 
				this.onItemAdded(item, this.length - 1);
			}),
			new jsObject.FunctionDescriptor("addRange", "$T... items", function(items) { 
				Array.prototype.push.apply(this, items); 
				for(var i = 0; i < items.length; i++)
					this.onItemAdded(items[i], this.length - items.length + i);
			}),
			new jsObject.FunctionDescriptor("insertRange", "int index, $T... items", function(index, items) {
				if(index < 0) throw new jsObject.Exceptions.ArgumentException("jsObject.Collection.insertRange", "index", index, "index must be positive");
				if(index > this.length) throw new jsObject.Exceptions.ArgumentException("jsObject.Collection.insertRange", "index", index, "index must be less than length");
				
				Array.prototype.splice.apply(this, [ index, 0 ].concat(items)); 
				for(var i = 0; i < items.length; i++)
					this.onItemAdded(items[i], index + i);
			}),
			new jsObject.FunctionDescriptor("insertAt", "int index, $T item", function(index, item) { 
				if(index < 0) throw new jsObject.Exceptions.ArgumentException("jsObject.Collection.insertAt", "index", index, "index must be positive");
				if(index > this.length) throw new jsObject.Exceptions.ArgumentException("jsObject.Collection.insertAt", "index", index, "index must be less than length");
				
				Array.prototype.splice.call(this, index, 0, item); 
				this.onItemAdded(item, index);
			}),
			
			new jsObject.FunctionDescriptor("indexOf", "$T item", Array.prototype.indexOf),
			new jsObject.FunctionDescriptor("lastIndexOf", "$T item", Array.prototype.lastIndexOf),
			new jsObject.FunctionDescriptor("sort",  [ [ Array.prototype.sort ], [ "function comparer = null", Array.prototype.sort ] ]),
			new jsObject.FunctionDescriptor("sortBy", [ [
				"string fieldName, int | bool dir = 1", function(fieldName, dir) {
					this.sortBy(function(x) { return typeof x[fieldName] === "function" ? x[fieldName]() : x[fieldName]; }, dir);
				} ], [
				"function getSortItem, int | bool dir = 1", function(getSortItem, dir) {
					dir = ((dir === -1 || dir === true) ? -1 : 1);	//Fix the direction parameter.
					
					this.sort(function(a, b) {
						a = getSortItem.call(this, a);
						b = getSortItem.call(this, b);
						
						if(a === b) return 0;
						
						if(typeof(a) === "undefined") return -dir;
						if(typeof(b) === "undefined") return dir;							
							
						if(a > b) return dir;
						if(b > a) return -dir;
					});
				}
			] ]),
			new jsObject.FunctionDescriptor("removeAt", "int index", function(index) {
				if(index < 0) throw new jsObject.Exceptions.ArgumentException("jsObject.Collection.removeAt", "index", index, "index must be positive");
				if(index >= this.length) throw new jsObject.Exceptions.ArgumentException("jsObject.Collection.removeAt", "index", index, "index must be less than length");
				
				var item = Array.prototype.splice.call(this, index, 1)[0]; 
				
				for(var i = this.length; this.hasOwnProperty(i); i++) delete this[i];
				this.onItemRemoved(item, index);
				
				return item;
			}),
			new jsObject.FunctionDescriptor("removeRange", "int startIndex, int count", function(startIndex, count) {
				if(startIndex < 0) throw new jsObject.Exceptions.ArgumentException("jsObject.Collection.removeRange", "startIndex", startIndex, "startIndex must be positive");
				if(startIndex + count > this.length) throw new jsObject.Exceptions.ArgumentException("jsObject.Collection.removeRange", "count", count, "startIndex + count must be less than length");
				
				var items = Array.prototype.splice.call(this, startIndex, count);
				for(var i = this.length; this.hasOwnProperty(i); i++) delete this[i];
				
				for(var i = 0; i < items.length; i++)
					this.onItemRemoved(items[i], startIndex + i);
					
				return items;
			}),
			new jsObject.FunctionDescriptor("remove", "$T item", function(item) { 
				var index = this.indexOf(item);
				if(index < 0) throw new jsObject.Exceptions.ArgumentException("jsObject.Collection.remove", "item", item, "item does not exist in collection");
				return this.removeAt(index);
			}),
			new jsObject.FunctionDescriptor("removeItems", "$T... items", function(items) { for(var i = 0; i < items.length; i++) this.remove(items[i]); }),
			
			new jsObject.FunctionDescriptor("clear", function() {
				this.onClearing();
				Array.prototype.splice.call(this, 0);
				for(var i = this.length; this.hasOwnProperty(i); i++) delete this[i];
			}),
			
			new jsObject.FunctionDescriptor("toArray", Array.prototype.slice)
		],
		events	: [ "itemAdded", "itemRemoved", "clearing" ]
	}
);
jsObject.Types.Collection			= jsObject.Collection.type;
jsObject.Types.cache.Collection		= jsObject.Collection.type;
jsObject.Types.Generic.Collection	= jsObject.Collection.genericType;
jsObject.classes.Collection			= jsObject.Collection;
