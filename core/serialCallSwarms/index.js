$$.swarms.describe("controller", {
    public: {
        resultValue: 'array',
    },
    serialExec: function () {
        this.resultValue = ['a'];
        var serial = this.serial(this.result);
        serial.stepOne(this.progress);
        serial.stepTwo(this.progress);
    },
    stepOne: () => {
        this.resultValue.push('b');
    },
    stepTwo: () => {
        this.resultValue.push('c');
    },
    progress: (error, progress) => {
        this.return(error);
    },
    result: function (err, result) {
        this.return(undefined, this.resultValue);
    },
});