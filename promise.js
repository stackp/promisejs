/*
 *  Copyright 2012-2013 (c) Pierre Duquesne <stackp@online.fr>
 *  Licensed under the New BSD License.
 *  https://github.com/stackp/promisejs
 */

(function(exports) {

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
            f(this.error, this.result);
        } else {
            this._callbacks.push(f);
        }
    };

    Promise.prototype.done = function(error, result) {
        this._isdone = true;
        this.error = error;
        this.result = result;
        for (var i = 0; i < this._callbacks.length; i++) {
            this._callbacks[i](error, result);
        }
        this._callbacks = [];
    };

    function join(funcs) {
        var numfuncs = funcs.length;
        var numdone = 0;
        var p = new Promise();
        var errors = [];
        var results = [];

        function notifier(i) {
            return function(error, result) {
                numdone += 1;
                errors[i] = error;
                results[i] = result;
                if (numdone === numfuncs) {
                    p.done(errors, results);
                }
            };
        }

        for (var i = 0; i < numfuncs; i++) {
            funcs[i]().then(notifier(i));
        }

        return p;
    }

    function chain(funcs, error, result) {
        var p = new Promise();
        if (funcs.length === 0) {
            p.done(error, result);
        } else {
            funcs[0](error, result).then(function(res, err) {
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

    function _encode(data) {
        var result = "";
        if (typeof data === "string") {
            result = data;
        } else {
            var e = encodeURIComponent;
            for (var k in data) {
                if (data.hasOwnProperty(k)) {
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
            p.done(-1, "");
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
        for (var h in headers) {
            if (headers.hasOwnProperty(h)) {
                xhr.setRequestHeader(h, headers[h]);
            }
        }

        function onTimeout() {
            xhr.abort();
            p.done(exports.promise.ETIMEOUT, "");
        };

        var timeout = exports.promise.ajaxTimeout;
        if (timeout) {
            var tid = setTimeout(onTimeout, timeout);
        }

        xhr.onreadystatechange = function() {
            if (timeout) {
                clearTimeout(tid);
            }
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    p.done(null, xhr.responseText);
                } else {
                    p.done(xhr.status, xhr.responseText);
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

    var promise = {
        Promise: Promise,
        join: join,
        chain: chain,
        ajax: ajax,
        get: _ajaxer('GET'),
        post: _ajaxer('POST'),
        put: _ajaxer('PUT'),
        del: _ajaxer('DELETE'),

        /* Error codes */
        ENOXHR: 1,
        ETIMEOUT: 2,

        /**
         * Configuration parameter: time in milliseconds after which a
         * pending AJAX request is considered unresponsive and is
         * aborted. Useful to deal with bad connectivity (e.g. on a
         * mobile network). A 0 value disables AJAX timeouts.
         *
         * Aborted requests resolve the promise with a ETIMEOUT error
         * code.
         */
        ajaxTimeout: 0
    };

    if (typeof define === 'function' && define.amd) {
        /* AMD support */
        define(function() {
            return promise;
        });
    } else {
        exports.promise = promise;
    }

})(this);
