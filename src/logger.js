const colors = require('colors/safe')

// don't modify string prototype

class logger {
    constructor() {
        // init private var
        this._startTime = Date.now()
    }

    success(message) {
        console.log(colors.green(`[${this.getDiff()}] ${message}`))
    }

    failure(message) {
        console.log(colors.red(`[${this.getDiff()}] ${message}`))
    }

    getDiff() {
        return (Date.now() - this._startTime) / 1000
    }
}

module.exports = logger