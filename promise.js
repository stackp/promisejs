var promise = (function() {

    function Promise() {
	this._callbacks = [];
    }
    
    Promise.prototype.then = function(func) {
	this._callbacks.push(func);
	return this;
    };
    
    Promise.prototype.done = function(result, error) {
	/*
	 * Using setTimeout() gives the ability to call done() before
	 * callbacks were attached to the promise, e.g.:
	 *
	 *    function foo() {
	 *        var p = new Promise();
	 *        p.done(3, null);
	 *        return p;
	 *    };
	 *  
	 *    foo().then(function(result) {
	 *       alert(result);
	 *    });
	 *
	 */
	var self = this;
	setTimeout(function() {
            for (var i = 0; i < self._callbacks.length; i++) {
		self._callbacks[i](result, error);
            }
	    self._callbacks = [];
	});
    };
    
    function join(funcs) {
	var numfuncs = funcs.length;
	var numdone = 0;
	var p = new Promise();
	
	function inc() {
	    numdone += 1;
	    if (numdone === numfuncs) {
		p.done();
	    }
	}
	
	for (var i = 0; i < numfuncs; i++) {
	    funcs[i]().then(inc);
	}
	
	return p;
    }
    
    function chain(funcs, result, error) {
	var p = new Promise();
	if (funcs.length === 0) {
	    p.done(result, error);
	} else {
	    funcs[0](result, error).then(function(res, err) {
		funcs.splice(0, 1);
		chain(funcs, res, err).then(function(r, e) {
		    p.done(r, e);
		});
	    });
	}
	return p;
    }

    var lib = {	
	Promise: Promise,
	join: join,
	chain: chain
    };

    return lib;
})();
