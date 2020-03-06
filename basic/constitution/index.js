$$.swarms.describe("echo", {
    say: function (message) {
        this.return(null, 'Echo ' + message);
    }
});