/*
 *  Copyright 2012-2013 (c) Pierre Duquesne <stackp@online.fr>
 *  Licensed under the New BSD License.
 *  https://github.com/stackp/promisejs
 */

(function(exports) {

    function Promise() {
        this._callbacks = [];
    }

    Promise.prototype.then = function(func, context) {
        var p;
        if (this._isdone) {
            p = func.apply(context, this.result);
        } else {
            p = new Promise();
            this._callbacks.push(function () {
                var res = func.apply(context, arguments);
                if (res && typeof res.then === 'function')
                    res.then(p.done, p);
            });
        }
        return p;
    };

    Promise.prototype.done = function() {
        this.result = arguments;
        this._isdone = true;
        for (var i = 0; i < this._callbacks.length; i++) {
            this._callbacks[i].apply(null, arguments);
        }
        this._callbacks = [];
    };

    function join(promises) {
        var p = new Promise();
        var results = [];

        if (!promises || !promises.length) {
            p.done(results);
            return p;
        }

        var numdone = 0;
        var total = promises.length;

        function notifier(i) {
            return function() {
                numdone += 1;
                results[i] = Array.prototype.slice.call(arguments);
                if (numdone === total) {
                    p.done(results);
                }
            };
        }

        for (var i = 0; i < total; i++) {
            promises[i].then(notifier(i));
        }

        return p;
    }

    function chain(funcs, args) {
        var p = new Promise();
        if (funcs.length === 0) {
            p.done.apply(p, args);
        } else {
            funcs[0].apply(null, args).then(function() {
                funcs.splice(0, 1);
                chain(funcs, arguments).then(function() {
                    p.done.apply(p, arguments);
                });
            });
        }
        return p;
    }

    /*
     * AJAX requests
     */

    function _encode(data) {
        var payload = "";
        if (typeof data === "string") {
            payload = data;
        } else {
            var e = encodeURIComponent;
            var params = [];

            for (var k in data) {
                if (data.hasOwnProperty(k)) {
                    params.push(e(k) + '=' + e(data[k]));
                }
            }
            payload = params.join('&')
        }
        return payload;
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
        xhr.withCredentials = promise.withCredentials;
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
            p.done(promise.ENOXHR, "");
            return p;
        }

        payload = _encode(data);
        if (method === 'GET' && payload) {
            url += '?' + payload;
            payload = null;
        }

        xhr.open(method, url);

        var content_type = 'application/x-www-form-urlencoded';
        for (var h in headers) {
            if (headers.hasOwnProperty(h)) {
                if (h.toLowerCase() === 'content-type')
                    content_type = headers[h];
                else
                    xhr.setRequestHeader(h, headers[h]);
            }
        }
        xhr.setRequestHeader('Content-type', content_type);


        function onTimeout() {
            xhr.abort();
            p.done(promise.ETIMEOUT, "", xhr);
        }

        var timeout = promise.ajaxTimeout;
        if (timeout) {
            var tid = setTimeout(onTimeout, timeout);
        }

        xhr.onreadystatechange = function() {
            if (timeout) {
                clearTimeout(tid);
            }
            if (xhr.readyState === 4) {
                var err = (!xhr.status ||
                           (xhr.status < 200 || xhr.status >= 300) &&
                           xhr.status !== 304);
                p.done(err, xhr.responseText, xhr);
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

    this._withCredentials = false;
    Object.defineProperty(this,'withCredentials',{
        get: function() {
          return this._withCredentials;
        },
        set: function(value) {
          this._withCredentials = value;
        }
    });
    
    var promise = {
        Promise: Promise,
        join: join,
        chain: chain,
        ajax: ajax,
        get: _ajaxer('GET'),
        post: _ajaxer('POST'),
        put: _ajaxer('PUT'),
        del: _ajaxer('DELETE'),
        withCredentials: withCredentials,
        
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
