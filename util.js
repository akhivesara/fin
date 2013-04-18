util = {};

function safeLookup (base, path, defaultValue) {

    if (typeof path === 'string') {
        path = path.split('.');
    }

    for (var i = 0, l = path.length; i < l; i++) {
        if (typeof base !== 'undefined' && base !== null && (base = base[path[i]])) {
        } else {
            return defaultValue;
        }
    }
    return base;
}

function isArray (obj) {
    if ( obj && obj.constructor.toString().indexOf("Array") != -1)
        return true;
    else {
        return false;
    }
}

Array.prototype.merge = function() {
    var results = [];
    this.forEach(function(subArray) {
        results.push.apply(results, subArray);
    });

    return results;
};

/**
 *	Sums all the numbers in an array
 *	@return	number	sum of all the numbers
 */
Array.prototype.sum = function() {
    var ret = 0, i = 0, num;
    for (i = 0; i < this.length; i++) {
        num = this[i];
        if (typeof num === 'number') {
            ret += num;
        }
    }
    return ret;
};

NOOP = function() {}
