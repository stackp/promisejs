/*
 * Useful functions
 */

function success(name){
    console.log("Success: ", name);
}
function failure(name){
    console.log("Error: ", name);
}

function assert(bool, name) {
    if (bool)
        success(name);
    else
        failure(name);
}


function sync_return(value) {
    var p = new promise.Promise();
    p.done(null, value);
    return p;
}

function async_return(value) {
    var p = new promise.Promise();
    setTimeout(function(){
        p.done(null, value);
    });
    return p;
}

function late(n) {
    var p = new promise.Promise();
    setTimeout(function() {
        p.done(null, n);
    }, n);
    return p;
}


/*
 * Tests
 */

function test_simple_synchronous() {
    sync_return(123).then(function(error, result) {
        assert(result === 123, 'simple synchronous test');
    });
}

function test_simple_asynchronous() {
    async_return(123).then(function(error, result) {
        assert(result === 123, 'simple asynchronous test');
    });
}

function test_multi_results() {
    p = new promise.Promise();

    p.then(function (res, a, b, c) {
               assert(a === 1, 'multiple results (1/3)');
           });

    setTimeout(
        function () {
            p.then(function (res, a, b, c) {
                       assert(b === 2, 'multiple results (2/3)');
                   });

            p.done(null, 1, 2, 3);

            p.then(function (res, a, b, c) {
                       assert(c === 3, 'multiple results (3/3)');
                   });
        });

}

function test_join() {

    var d = new Date();

    promise.join([
        function() {
            return late(400);
        },
        function(){
            return late(800);
        }
    ]).then(
        function(results) {
            var delay = new Date() - d;
            assert(results[0][1] === 400 && results[1][1] === 800,
                   "join() result");
            assert(700 < delay && delay < 900, "joining functions");
        }
    );

}

function test_chain() {

    var d = new Date();

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
            var delay = new Date() - d;
            assert(n === 1000, "chain() result");
            assert(1900 < delay && delay < 2400, "chaining functions()");
        }
    );
}

function test_ajax_timeout () {

    var realXMLHttpRequest = window.XMLHttpRequest;
    var defaultTimeout = promise.ajaxTimeout;

    var isAborted = false;

    promise.ajaxTimeout = 2000;

    window.XMLHttpRequest = function () {
        this.readyState = 4;
        this.status = 200;
        this.responseText = 'a response text';
        this.open = function () {};
        this.setRequestHeader = function () {};
        this.abort = function () { isAborted = true; };
        this.onreadystatechange = function () {};
        var self = this;
        this.send = function () {
            setTimeout(function() {
                self.onreadystatechange();
            }, 3000);
        };
    };

    promise.get('/').then(
        function(err, response){
            assert(isAborted === true, 'Ajax timeout must abort xhr');
            assert(err === promise.ETIMEOUT, 'Ajax timeout must report error');
            assert(response === "", 'Ajax timeout must return empty response');

            window.XMLHttpRequest = realXMLHttpRequest;
            promise.ajaxTimeout = defaultTimeout;
        });
}


function test() {
    test_simple_synchronous();
    test_simple_asynchronous();
    test_multi_results();
    test_join();
    test_chain();
    test_ajax_timeout();
}
