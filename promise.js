/* 
 *  Copyright 2012 (c) Pierre Duquesne <stackp@online.fr>
 *  Licensed under the New BSD License.
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

    function join() {
        var funcs = arguments;
        var numfuncs = funcs.length;
        var numdone = 0;
        var p = new Promise();
        var results = [];
        var errors = [];

        function notifier(i) {
            return function(result, error) {
                numdone += 1;
                results[i] = result;
                errors[i] = error;
                if (numdone === numfuncs) {
                    p.done(results, errors);
                }
            };
        }

        for (var i = 0; i < numfuncs; i++) {
            funcs[i]().then(notifier(i));
        }

        return p;
    }

    function chain() {
        var funcs = Array.prototype.slice.call(arguments);
        return _chain(funcs);
    }

    function _chain(funcs, result, error) {
        var p = new Promise();
        if (funcs.length === 0) {
            p.done(result, error);
        } else {
            funcs[0](result, error).then(function(res, err) {
                funcs.splice(0, 1);
                _chain(funcs, res, err).then(function(r, e) {
                    p.done(r, e);
                });
            });
        }
        return p;
    }

    /*
     * AJAX requests
     */

    function _encode(data) {
        var result = "";
        if (typeof data === "string") {
            result = data;
        } else {
            for (var k in data) {
                if (data.hasOwnProperty(k)) { 
                    var e = encodeURIComponent;
                    result += '&' + e(k) + '=' + e(data[k]);
                }
            }
        }
        return result;
    }

    function new_xhr() {
        var xhr;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            }
        }
        return xhr;
    }

    function ajax(method, url, data, headers) {
        var p = new Promise();
        var xhr, payload;
        data = data || {};
        headers = headers || {};

        try {
            xhr = new_xhr();
        } catch (e) {
            p.done("", -1);
            return p;
        }
        
        payload = _encode(data);
        if (method === 'GET' && payload) {
            url += '?' + payload;
            payload = null;
        }
        
        xhr.open(method, url);
        xhr.setRequestHeader('Content-type', 
                             'application/x-www-form-urlencoded');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        for (var h in headers) {
            if (headers.hasOwnProperty(h)) { 
                xhr.setRequestHeader(h, headers[h]);
            }
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    p.done(xhr.responseText);
                } else {
                    p.done("", xhr.status);
                }
            }
        };
        
        xhr.send(payload);
        return p;
    }

    function _ajaxer(method) {
        return function(url, data, headers) {
            return ajax(method, url, data, headers);
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
