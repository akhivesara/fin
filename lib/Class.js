// Dependencies

/**
 * @class exports.Class Provides simple class creation and inheritance
 *
 * Based on work from John Resig, base2, and Prototype. Class uses namespace
 * safe method access allowing renaming of exports.Class.
 *
 * Create an empty Class:
 *
 * var MyEmptyClass = exports.Class.create();
 *
 * Create a typical Class instance:
 *
 * var MyClass = exports.Class.create({
 *     init: function () {
 *         // This method serves as the constructor
 *     },
 *     aPrototypeMethod: function () {
 *         // All methods and properties are assigned to MyClass.prototype
 *     }
 * });
 *
 * Extend a Class instance:
 *
 * var YourClass = MyClass.extend({
 *     init: function () {
 *         // Base class properties are overwritten. Base methods can be invoked
 *         // using the _super() method.
 *         this._super();
 *     }
 * });
 *
 */

(function(exports){
    var NOOP = function(){};

    var _hasSuper = /\b_super\b/,
        _doNotInit = {};

    /**
     * Enables sub classed methods to call their associated super class method
     * using `this._super()`.  Returns a function which executes in the scope
     * of a Class instance.
     * @returns {Function}
     * @private
     */
    function _bindSuper (value, superValue) {

        // A _super() method is bound temporarily (created then destroyed) each
        // time a subclassed method is run.

        return function () {
            var tmp = this._super,
                ret;

            this._super = superValue;

            ret = value.apply(this, arguments);

            // The method only need to be bound temporarily, so it is removed
            // after the subclass method has executed.

            if (tmp) {
                this._super = tmp;
            } else {
                delete this._super;
            }

            return ret;
        };
    }

    /**
     * Overrides the Function.bind contract to ensure that another class
     * constructor is emitted when called instead of a wrapper function.
     *
     * Normally bind just creates a wrapper function around an inner function.
     * This behavior is undesirable though as class methods like extend are
     * lost.
     *
     * @public
     * @returns {Function} A Class instance
     */
    function _bind() {
        var bindArgs = Array.prototype.slice.call(arguments, 1);
        return this.extend({
            init : function() {
                var args = Array.prototype.slice.call(arguments, 0);
                this._super.apply(this, bindArgs.concat(args));
            }
        });
    }

    /**
     * Extends a Class instance with properties to create a sub-class. Executes
     * in scope of a Class instance.
     * @public
     * @param {Object} props Object descriptor with key/value pairs
     * @returns {Function} A Class instance
     */
    function _extend (props) {
        var prototype = new this(_doNotInit),
            name, getter, setter, value
        ;

        // Copy the properties over onto the new prototype
        for (name in props) {
            if (props.__lookupGetter__) {
                getter = props.__lookupGetter__(name);
                setter = props.__lookupSetter__(name);
            }
            
            if (getter || setter) {
                getter && prototype.__defineGetter__(name, getter);
                setter && prototype.__defineSetter__(name, setter);
            } else {
                value = props[name];
                if (typeof value === "function" && _hasSuper.test(value)) {
                    // value: sub-class method
                    // this.prototype[name]: this class' (super class) method
                    value = _bindSuper(value, this.prototype[name] || NOOP);
                }
                prototype[name] = value;
            }
        }

        return _create(prototype);
    }

    /**
     * Creates a new Class instance, optionally including a prototype
     * object.  This method is not applied to returned Class instances;
     * use Class.extend to sub-class Class instances.
     * @public
     * @param {Object} props Object descriptor with key/value pairs
     * @returns {Function} A Class instance
     */
    function _create (props) {
        var Class = function () {
            var init = this.init;

            // All construction is actually done in the init method
            if (init && arguments[0] !== _doNotInit) {
                init.apply(this, arguments);
            }
        };

        // Ensure that the Chrome profiler shows relevant class names, instead
        // of 'Class' when memory debugging is enabled.  get the className as
        // the function of the dummy class constructor.

        //var className = props && props.classId || "UNKNOWN";
        //get("var " + className + " = function() { var init = this.init; if (init && arguments[0] !== _doNotInit) { init.apply(this, arguments); } }; Class = " + className + ";");

        // Populate our constructed prototype object
        if (props) {
            Class.prototype = props;
        }

        // Enforce the constructor to be what we expect
        Class.constructor = Class;

        // And make this class extendable
        Class.extend = _extend;

        // And overload the bind function to create a subclass
        Class.bind = _bind;

        return Class;
    }

    // Reveal _class publically

    Class = {
        create: _create
    };

})();