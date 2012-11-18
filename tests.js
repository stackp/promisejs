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


function test() {
    test_simple_synchronous();
    test_simple_asynchronous();
    test_join();
    test_chain();
    test_timeout();    
}

function test_timeout(){
     
     var oldXHR = window.XMLHttpRequest;
     var isAborted = false;
     promise.timeout = 10;

     window.XMLHttpRequest = function(){ 
        this.readyState = 4;
        this.status = 200;
        this.responseText = 'a response text';
        this.open = function(){}
        this.setRequestHeader = function(){}
        this.abort = function(){ isAborted = true; }
        this.onreadystatechange = function(){}
        this.send = function(){ 
            var startTime = new Date().getTime();  
            while (new Date().getTime() < startTime + 20) {};
            var endTime = new Date().getTime();
            if(endTime - startTime <= promise.timeout){     
              this.onreadystatechange();             
          }
        }
     }

     promise.get('/').then(function(err, response){
        assert(isAborted === true, 'timeout aborts xhr');
        assert(err === promise.ETIMEOUT, 'timeout error reported');
        assert(response === "", 'timeout returns empty response');

        window.XMLHttpRequest = oldXHR;
     });
}


function test_simple_synchronous(){
    sync_return(123).then(function(error, result) {
        assert(result === 123, 'simple synchronous test');
    });
}

function test_simple_asynchronous(){
     async_return(123).then(function(error, result) {
        assert(result === 123, 'simple asynchronous test');
    });
}

function test_join(){

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
                assert(values[0] === 400 && values[1] === 800,
                       "join() result");
                var delay = new Date() - d;
                assert(700 < delay && delay < 900,
                       "joining functions");
            }
        );

}

function test_chain(){

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
            assert(n === 1000, "chain() result");
            var delay = new Date() - d;
            assert(1900 < delay && delay < 2400,
                   "chaining functions()");
        }
    );
}