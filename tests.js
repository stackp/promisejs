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

// override window.XMLHttpRequest
function makeFakeXMLHttpRequest(opts) {
    opts = opts || {};
    var delayTime = opts.delayTime || 3000;
    return function() {
        this.readyState = 4;
        this.status = opts.status || 200;
        this.responseText = opts.responseText || 'a response text';
        this.open = function () {};
        this.setRequestHeader = function () {};
        this.abort = opts.abort || function () { isAborted = true; };
        this.onreadystatechange = function () {};
        var self = this;
        this.send = function () {
            setTimeout(function() {
                self.onreadystatechange();
            }, delayTime);
        };
    };
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
        function(errors, values) {
            var delay = new Date() - d;
            assert(values[0] === 400 && values[1] === 800, "join() result");
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
    promise.ajaxTimeout = 400;

    window.XMLHttpRequest = makeFakeXMLHttpRequest({
        status: 200,
        delayTime: 500,
        responseText:'',
        abort: function () { isAborted = true; }
    });

    promise.get('/').then(
        function(err, response){
            assert(isAborted === true, 'Ajax timeout must abort xhr');
            assert(err === promise.ETIMEOUT, 'Ajax timeout must report error');
            assert(response === '', 'Ajax timeout must return empty response');

            window.XMLHttpRequest = realXMLHttpRequest;
            promise.ajaxTimeout = defaultTimeout;
        });
}




function test_ajax_responsecodes () {
    // assert that status 204 (no content) 
    // and 304 (not modified) returns succesfully,
    // whilst 401 (Unathorized) reports an error

    var realXMLHttpRequest = window.XMLHttpRequest;
    var defaultTimeout = promise.ajaxTimeout;
    var isAborted = false;
    promise.ajaxTimeout = 1000;

    // 204:
    window.XMLHttpRequest = makeFakeXMLHttpRequest({
        status: 204,
        delayTime: 300, 
        responseText:''
    });
    promise.get('/').then(
        function(err, response){
            assert(!err, '"Status 204 No content" must return success');
        }
    );

    // 304:
    window.XMLHttpRequest = makeFakeXMLHttpRequest({
        status: 304,
        delayTime: 400,
        responseText: ''
    });
    promise.get('/').then(
        function(err, response){
            assert(!err, '"Status 304 Not modified" must return success');
            window.XMLHttpRequest = realXMLHttpRequest;
            promise.ajaxTimeout = defaultTimeout;
        }
    );

    // 401:
    window.XMLHttpRequest = makeFakeXMLHttpRequest({
        status: 401,
        delayTime: 500
    });
    promise.get('/').then(
        function(err, response){
            assert(err === 401, '"Status 401 Unauthorized" must trigger an error');
        }
    );

    // Restore methods
    window.XMLHttpRequest = realXMLHttpRequest;
    promise.ajaxTimeout = defaultTimeout;
}

function test() {
    test_simple_synchronous();
    test_simple_asynchronous();
    test_join();
    test_chain();
    test_ajax_timeout();
    test_ajax_responsecodes();
}
