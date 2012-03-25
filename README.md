# promise.js

A lightweight javascript implementation of promises.

## Using the `Promise` Object

Promises provide an alternative to callback-passing. Asynchronous functions return a `Promise` object onto which callbacks can be attached.

Callbacks are attached using the `.then(callback)` method. They will be called when the promise is resolved.

    var p = asyncfoo(a, b, c);

    p.then(function(result, error) {
        if (error) return;
        alert(result);
    });

When their task is done, asynchronous functions resolve the promise with the `.done(result, error)` method. This invokes the promise callbacks with the `result` and `error` arguments.

    function asyncfoo() {

        var p = new promise.Promise();  /* (1) create a Promise */

        setTimeout(function() {
            p.done("O hai!", null);     /* (3) resolve it when ready */
        }, 1000);

        return p;                       /* (2) return it */
    }

## Callbacks Signature

Callbacks shall have the signature: `callback(result, error)`. It matches the `.done(result, error)` signature.

The `result` parameter is used to pass the value produced by the asynchronous function; The `error` parameter is used to pass an error code != 0 in case something went wrong. The latter can be omitted if everything went fine. This allows to write callbacks like this:

    function callback(result, error) {
        if (error) {
            /* Deal with error case. */
            ...
            return;
        }
       
        /* Deal with normal case. */
        ...
    }


## Chaining Functions

    promise.chain([f1, f2, f3, ...]);

`promise.chain()` executes a bunch of asynchronous tasks in sequence, passing to each function the `error, value` arguments produced by the previous function. Each function must return a promise and resolve it somehow. `promise.chain()` returns a `Promise`.

**Example:**

    function late(n) {
        var p = new promise.Promise();
        setTimeout(function() {
            p.done(n, 0);
        }, n);
        return p;
    }

    promise.chain([
        function() {
            return late(100);
        },
        function(n, err) {
            return late(n + 200);
        },
        function(n, err) {
            return late(n + 300);
        },
        function(n, err) {
            return late(n + 400);
        }
    ]).then(
        function(n) {
            alert(n);
        }
    );


## Joining Functions

    promise.join([f1, f2, f3, ...]);

`promise.join()` executes a bunch of asynchronous tasks together, returns a promise, and resolve that promise when all tasks are done. The callbacks attached to that promise are invoked with the arguments: `[result1, result2, result3, ...], [error1, error2, error3, ...]`. Each function must return a promise and resolve it somehow. 

**Example**:

    function late(n) {
        var p = new promise.Promise();
        setTimeout(function() {
            p.done(n, 0);
        }, n);
        return p;
    }

    promise.join([
        function() {
            return late(400);
        },
        function(){
            return late(800);
        }
    ]).then(
        function(values, errors) {
            alert(values[0] + " " + values[1]);
        }
    );


## AJAX Functions Included

Because AJAX requests are the root of much asynchrony in Javascript, promise.js provides the following functions:

    promise.get(url, data, headers)
    promise.post(url, data, headers)
    promise.put(url, data, headers)
    promise.delete(url, data, headers)

`data` *(optional)* : a {key: value} object or url-encoded string.

`headers` *(optional)* :  a {key: value} object (e.g. `{"Accept", "application/json"}`).

**Example**:

    promise.get('/').then(function(result, error) {
        if (!error) {
            alert('The page contains ' + result.length + ' character(s).');
        }
    });


Have fun!
