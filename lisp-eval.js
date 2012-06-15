
lisp.Func = function(name, run) {
    this.name = name;
    this.run = run;
};
lisp.Func.prototype = {
    type: 'function',
    print: function() {
        return '<function '+ this.name+ '>';
    }
};

lisp.Number.prototype.eval = function() {
    return this;
};

lisp.nil.eval = function() {
    return this;
};

lisp.Symbol.prototype.eval = function() {
    var v = lisp.env.get(this.s);
    if (v)
        return v;
    else
        throw 'undefined variable: '+this.s;
};

lisp.Cons.prototype.eval = function() {
    var args = lisp.termToList(this.cdr);

    // check for special forms
    if (this.car.type == 'symbol') {
        var s = this.car.s;

        if (s == 'if') {
            lisp.checkNumArgs('if', 3, args);
            var test = args[0].eval();
            if (test.type == 'nil')
                return args[2].eval();
            else
                return args[1].eval();
        }

        if (s == 'quote') {
            lisp.checkNumArgs('quote', 1, args);
            return args[0];
        }
    }

    // ordinary function
    var car = this.car.eval();
    lisp.checkType(car, 'function');
    for (var i = 0; i < args.length; ++i)
        args[i] = args[i].eval();

    return car.run(args);
};

lisp.Func.prototype.eval = function() {
    throw 'trying to evaluate '+this.print()+' again';
};

lisp.numFunc = function(name, func) {
    return new lisp.Func(
        name, function(args) {
            if (args.length == 0)
                throw 'too few arguments to '+name;
            var n = args[0].n;
            for (var i = 1; i < args.length; i++) {
                lisp.checkType(args[i], 'number');
                n = func(n, args[i].n);
            }
            return new lisp.Number(n);
        });
};

// A basic Lisp variables environment. Make new one using the extend() method
lisp.env = {
    vars: {},
    parent: null,

    // variable lookup
    get: function(name) {
        if (name in this.vars)
            return this.vars[name];
        else if (this.parent)
            return this.parent.get(name);
        return null;
    },

    // make new environment on top of current and return it
    extend: function(vars) {
        return {
            __proto__: lisp.env,
            vars: vars,
            parent: this
        };
    }
};
lisp.env.vars['+'] = lisp.numFunc('+', function(a,b) { return a+b; });
lisp.env.vars['-'] = lisp.numFunc('-', function(a,b) { return a-b; });
lisp.env.vars['*'] = lisp.numFunc('*', function(a,b) { return a*b; });
lisp.env.vars['/'] = lisp.numFunc('/', function(a,b) {
                                      if (b == 0)
                                          throw 'division by zero';
                                      else
                                          return a/b; });
lisp.env.vars.t = new lisp.Symbol('t');
lisp.env.vars.t.eval = function() { return this; };

lisp.env.vars.eval = new lisp.Func('eval', function(args) {
                                  lisp.checkNumArgs('eval', 1, args);
                                  return args[0].eval();
                              });

lisp.env.vars.list = new lisp.Func('list', function(args) {
                                  return lisp.listToTerm(args);
                              });
lisp.env.vars.cons = new lisp.Func('list', function(args) {
                                  lisp.checkNumArgs('cons', 2, args);
                                  return new lisp.Cons(args[0], args[1]);
                              });

lisp.compareFunc = function(name, func) {
    return new lisp.Func(
        name, function(args) {
            lisp.checkNumArgs(name, 2, args);
            lisp.checkType(args[0], 'number');
            lisp.checkType(args[1], 'number');
            return func(args[0].n, args[1].n) ? lisp.env.vars.t : lisp.nil;
        });
};

lisp.env.vars['=']  = lisp.compareFunc('=',  function(a,b) { return a == b; });
lisp.env.vars['/='] = lisp.compareFunc('/=', function(a,b) { return a != b; });
lisp.env.vars['>']  = lisp.compareFunc('>',  function(a,b) { return a > b; });
lisp.env.vars['>='] = lisp.compareFunc('>=', function(a,b) { return a >= b; });
lisp.env.vars['<']  = lisp.compareFunc('<',  function(a,b) { return a < b; });
lisp.env.vars['<='] = lisp.compareFunc('<=', function(a,b) { return a <= b; });
