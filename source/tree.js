const Node = require('./node');

class Tree {
    constructor(client) {
        this._client = client;
        this._tree = {};
    }

    async contribute() {
        this._tree = {};
        await this._client.send('DOM.enable');
        let response = await this._client.send("DOM.getFlattenedDocument", { "pierce": true, "depth": -1 });
        let nodes = response.nodes;
        for (const node of nodes) {
            this._tree[node.nodeId] = node;
        }
    }

    getNode(nodeId) {
        let nodeInfo = this._tree[nodeId];
        if (nodeInfo) {
            return new Node(this._client, nodeInfo);
        }
    }

    async getNodeSelector(selectorMode, nodeId) {
        switch (selectorMode) {
            case 'default':
                break;

            case 'class':
                break;

            case 'xpath':
                break;
        }
        return '';
    }

    async isChild(nodeId, childId) {
        return false;
    }
}

module.exports = Tree;