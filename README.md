# promise.js

A lightweight javascript implementation of promises.

## Using the `Promise` Object

Promises provide an alternative to callback-passing. Asynchronous functions return a `Promise` object onto which callbacks can be attached.

Callbacks are attached using the `.then(callback)` method. They will be called when the promise is resolved.

```js
var p = asyncfoo(a, b, c);

p.then(function(error, result) {
    if (error) return;
    alert(result);
});
```

Asynchronous functions resolve the promise with the `.done(error, result)` method when their task is done. This invokes the promise callbacks with the `error` and `result` arguments.

```js
function asyncfoo() {

    var p = new promise.Promise();  /* (1) create a Promise */

    setTimeout(function() {
        p.done(null, "O hai!");     /* (3) resolve it when ready */
    }, 1000);

    return p;                       /* (2) return it */
}
```

## Callbacks Signature

Callbacks shall have the signature: `callback(error, result)`. It matches the `.done(error, result)` signature.

The `error` parameter is used to pass an error code such that `error != false` in case something went wrong; the `result` parameter is used to pass a value produced by the asynchronous task. This allows to write callbacks like this:

```js
function callback(error, result) {
    if (error) {
        /* Deal with error case. */
        ...
        return;
    }
       
    /* Deal with normal case. */
    ...
}
```

## Chaining Functions

```js
promise.chain([f1, f2, f3, ...]);
```

`promise.chain()` executes a bunch of asynchronous tasks in sequence, passing to each function the `error, value` arguments produced by the previous task. Each function must return a promise and resolve it somehow. `promise.chain()` returns a `Promise`.

**Example:**

```js
function late(n) {
    var p = new promise.Promise();
    setTimeout(function() {
        p.done(null, n);
    }, n);
    return p;
}

promise.chain([
    function() {
        return late(100);
    },
    function(err, n) {
        return late(n + 200);
    },
    function(err, n) {
        return late(n + 300);
    },
    function(err, n) {
        return late(n + 400);
    }
]).then(
    function(err, n) {
        alert(n);
    }
);
```

## Joining Functions

    promise.join([f1, f2, f3, ...]);

`promise.join()` executes a bunch of asynchronous tasks together, returns a promise, and resolve that promise when all tasks are done. The callbacks attached to that promise are invoked with the arguments: `[error1, error2, error3, ...], [result1, result2, result3, ...]`. Each function must return a promise and resolve it somehow.

**Example**:

```js
function late(n) {
    var p = new promise.Promise();
    setTimeout(function() {
        p.done(null, n);
    }, n);
    return p;
}

promise.join([
    function() {
        return late(400);
    },
    function() {
        return late(800);
    }
]).then(
    function(errors, values) {
        alert(values[0] + " " + values[1]);
    }
);
```

## AJAX Functions Included

Because AJAX requests are the root of much asynchrony in Javascript, promise.js provides the following functions:

```js
promise.get(url, data, headers)
promise.post(url, data, headers)
promise.put(url, data, headers)
promise.del(url, data, headers)
```

`data` *(optional)* : a {key: value} object or url-encoded string.

`headers` *(optional)* :  a {key: value} object (e.g. `{"Accept", "application/json"}`).

**Example**:

```js
promise.get('/').then(function(error, result) {
    if (!error) {
        alert('The page contains ' + result.length + ' character(s).');
    }
});
```

You can set a time in milliseconds after which unresponsive AJAX
requests should be aborted. This is a global configuration option,
disabled by default.

    /* Global configuration option */
    promise.ajaxTimeout = 10000;


## Browser compatibility

The library has been successfully tested on IE5.5+ and FF1.5+


Have fun!
