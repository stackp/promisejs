/* 
   Copyright 2012 (c) Pierre Duquesne <stackp@online.fr>
   Licensed under the New BSD License.
*/

var promise = (function() {

    function bind(func, context) {
	return function() {
	    return func.apply(context, arguments);
	};
    }

    function Promise() {
	this._callbacks = [];
    }
    
    Promise.prototype.then = function(func, context) {
	var f = bind(func, context);
	if (this._isdone) {
	    f(this.result, this.error);
	} else {
	    this._callbacks.push(f);
	}
	return this;
    };
    
    Promise.prototype.done = function(result, error) {
	this._isdone = true;
	this.result = result;
	this.error = error;
        for (var i = 0; i < this._callbacks.length; i++) {
	    this._callbacks[i](result, error);
        }
	this._callbacks = [];
    }
    
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
