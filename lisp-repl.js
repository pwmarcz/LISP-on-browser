// REPL - using the jQuery Terminal script

lisp.repl_terminal = function(selector) {
    $(selector).terminal(
        function(str, terminal) {
            try {
                var term = lisp.parse(str);
                if (term != null) {
                    var result = term.eval();
                    terminal.echo(result.print());
                }
            } catch (err) {
                terminal.error(err);
            }
        },
        {
            greetings: "LISP Interpreter. Type 'clear' to clear",
            prompt: '> '
        });
};
