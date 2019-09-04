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

    async getNodeSelector(selectorMode, nodeId, parentNodeId=null) {
        let selector = '';
        switch (selectorMode) {
            case 'default':
                break;

            case 'class':
                selector = this._getSelectorForClass(nodeId, parentNodeId);
                break;

            case 'xpath':
                break;
        }
        return selector;
    }

    async isChild(nodeId, childId) {
        let nodeInfo = this._tree[childId];
        while (!nodeInfo.parentId) {
            nodeInfo = this._tree[nodeInfo.parentId];
            if (nodeInfo.nodeId === nodeId) {
                return true;
            }
        }

        return false;
    }

    _getSelectorForClass(nodeId, parentNodeId = null) {
        let nodeInfo = this._tree[nodeId];
        let nodeChain = [this._getClassName(nodeInfo.nodeId)];
        while (nodeInfo.parentId) {
            if (parentNodeId === nodeInfo.parentId) {
                break;
            }
            nodeInfo = this._tree[nodeInfo.parentId];
            let className = this._getClassName(nodeInfo.nodeId);
            nodeChain.push(className);

            if (nodeInfo.nodeName.toLowerCase() === 'body') {
                break;
            }
        }

        return nodeChain.reverse().join('>');
    }

    _getClassName(nodeId) {
        let nodeInfo = this._tree[nodeId];
        let attrbutes = nodeInfo.attributes;
        if (attrbutes) {
            let attrIndex = attrbutes.findIndex(e => e === 'class');
            if (attrIndex > -1) {
                return `${nodeInfo.nodeName}.${attrbutes[attrIndex + 1].split(' ').join('.')}`;
            }
        }

        return nodeInfo.nodeName;
    }
}

module.exports = Tree;