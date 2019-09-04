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
        for (let node of nodes) {
            this._tree[node.nodeId] = node;
            this._tree[node.nodeId].children = [];
        }
        for (let node of nodes) {
            if (node.parentId && this._tree[node.parentId]) {
                this._tree[node.parentId].children.push(node.nodeId);
            } 
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
                selector = this._getSelectorForXpath(nodeId, parentNodeId);
                break;

            case 'class':
                selector = this._getSelectorForClass(nodeId, parentNodeId);
                break;

            case 'xpath':
                selector = this._getSelectorForXpath(nodeId, parentNodeId);
                let splits = selector.split('>');
                splits[0] = splits[0].split(':')[0];
                selector = splits.join('>');
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

    _getSelectorForXpath(nodeId, parentNodeId = null) {
        let nodeChain = [];
        let parentNodeInfo = this._getParentNodeInfo(nodeId);
        while (parentNodeInfo) {
            if (parentNodeInfo.nodeId === parentNodeId) {
                break;
            }
            nodeChain.push(this._getNodeXpath(parentNodeInfo, nodeId));
            nodeId = parentNodeInfo.nodeId;
            parentNodeInfo = this._getParentNodeInfo(nodeId);

            if (parentNodeInfo.nodeName.toLowerCase() === 'body') {
                break;
            }
        }

        return nodeChain.reverse().join('>');
    }

    _getParentNodeInfo(nodeId) {
        let parentNodeId = this._tree[nodeId].parentId;
        if (parentNodeId) {
            return this._tree[parentNodeId];
        }
    }

    _getNodeXpath(parentNodeInfo, nodeId) {
        let childIndex = parentNodeInfo.children.indexOf(nodeId);
        return `${parentNodeInfo.nodeName}:nth-child(${childIndex + 1})`;
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