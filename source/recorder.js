class Recorder {
    constructor(page) {
        this._page = page;
        this._dataCaptrue = null;
    }

    async start() {
        await this._exposeActionMonitor();
    }

    /**
     * 注入动作监听器
     */
    async _exposeActionMonitor() {
        // expose click

        // expose scroll
    }
}

module.exports = Recorder;