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

    /*
     * AJAX requests
     */

    function ajax(method, url, args) {
        args = args || {};
        var p = new Promise();
        var req;

        if (window.XMLHttpRequest) {
            req = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            try {
                req = new ActiveXObject("Msxml2.XMLHTTP");
            }
            catch (e) {
                try {
                    req = new ActiveXObject("Microsoft.XMLHTTP");
                }
                catch (e) {}
            }
        }

        if (!req) {
            p.done("", -1);
        }

        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    p.done(req.responseText);
                } else {
                    p.done("", req.status);
                }
            }
        };

        req.open(method, url);
        req.send();
        return p;
    }

    function _ajaxer(method) {
        return function(url, args) {
            return ajax(method, url, args);
        };
    }

    var lib = {
        Promise: Promise,
        join: join,
        chain: chain,
        ajax: ajax,
        get: _ajaxer('GET'),
        post: _ajaxer('POST'),
        put: _ajaxer('PUT'),
        delete: _ajaxer('DELETE')
    };
    
    return lib;
})();
