function foo() {
    var p = new promise.Promise();
    setTimeout(function(){
        p.done(3, null);
    });
    return p;
};

foo().then(function(result, error) {
    if (!error) 
        alert(result);
});


function late(n) { 
    var p = new promise.Promise();
    setTimeout(function() {
        console.log(n);
        p.done(n);
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
        function(values) {
            console.log(values);
        }
    );


promise.chain([
    function() {
        return late(400);
    },
    function() {
        return late(200);
    }
]).then(
    function() {
        console.log('two');
    }
);

promise.chain([
    function() {
        p = new promise.Promise();
        p.done(1);
        return p;
    },
    function(n) { 
        p = new promise.Promise(); 
        p.done(n + 2);
        return p;
    },
    function(n) {
        p = new promise.Promise();
        p.done(n + 3);
        return p;
    },
    function(n) { 
        p = new promise.Promise();
        p.done(n + 4);
        return p;
    }
]).then(
    function(n) {
        console.log(n);
    });
