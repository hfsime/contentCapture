const Node = require('./node');

class Tree {
    constructor(client) {
        this._client = client;
        this._tree = {};
    }

    /**
     * 构建DOM节点集合
     */
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

    /**
     * 获取节点
     * @param {number} nodeId 
     */
    getNode(nodeId) {
        let nodeInfo = this._tree[nodeId];
        if (nodeInfo) {
            return new Node(this._client, nodeInfo);
        }
    }

    /**
     * 是否是子节点
     * @param {number} nodeId 节点ID
     * @param {number} childId 子节点ID
     */
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

    /**
     * 获取父节点信息
     * @param {number} nodeId 
     */
    getParentNodeInfo(nodeId) {
        let parentNodeId = this._tree[nodeId].parentId;
        if (parentNodeId) {
            return this._tree[parentNodeId];
        }
    }

    /**
     * 获取节点的xpath值
     * @param {object} parentNodeInfo 
     * @param {number} nodeId 
     */
    getNodeXpath(parentNodeInfo, nodeId) {
        let childIndex = parentNodeInfo.children.indexOf(nodeId);
        return `${parentNodeInfo.nodeName}:nth-child(${childIndex + 1})`;
    }

    /**
     * 获取节点的类选择器
     * @param {number} nodeId 
     * @param {number} parentNodeId 
     */
    getSelectorForClass(nodeId, parentNodeId) {
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

    /**
     * 获取iframe的节点的id属性值
     * @param {object} nodeInfo 
     */
    async getFrameId(nodeInfo) {
        if (nodeInfo.frameId && nodeInfo.nodeName.toLowerCase() === 'html') {
            let response = await this._client.send('DOM.getFrameOwner', { frameId: nodeInfo.frameId });
            let frameNodeInfo = this.getParentNodeInfo(response.nodeId);
            if (frameNodeInfo) {
                return new Node(this._client, frameNodeInfo).getAttribute('id');
            }
        }
    }

    _getClassName(nodeId) {
        let nodeInfo = this._tree[nodeId];
        let className = new Node(this._client, nodeInfo).getClassName();
        if (className) {
            return `${nodeInfo.nodeName}.${className}`;
        }

        return nodeInfo.nodeName;
    }
}

module.exports = Tree;