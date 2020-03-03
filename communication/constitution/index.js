$$.swarms.describe('echo', {
    say: function (input) {
        this.return(null, Number(input) + 1);
    },
    throwError: function(delay) {
    console.log('An test purpose error will be thrown in ', delay || 10, 'ms');
    setTimeout(() => {
        throw new Error('this is a generated error for testing purpose');
    }, delay || 10);
}
});

$$.swarms.describe("commTest", {
    default: function (agentName, input) {
        input += 1;
        this.swarm(agentName, 'extension', input);
    },
    extension: function (input) {
        if (input === '#1') {
            throw new Error('Intended error');
        } else {
            input += 1;
            this.return(input);
        }
    }
});