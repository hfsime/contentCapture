const Node = require('./Node');
const relationModes = ['default', 'class', 'xpath'];

class Element {
    constructor(client, highlightConfig, tree, id) {
        this._client = client;
        this._tree = tree;
        this.node = this._tree.getNode(id);
        this.id = id;
        this._highlightConfig = highlightConfig;
        this._relationMode = relationModes[0];
    }

    /**
     * 获取父元素
     */
    getParent() {
        let parentNode = this._tree.getNode(this.node.parentId);
        return new Element(this._client, this._highlightConfig, this._tree, parentNode.id);
    }

    /**
     * 选中元素
     */
    async selected() {
        await this.node.highlight(this._highlightConfig);
    }

    /**
     * 选中元素确认
     */
    async selectingComplete() {
        await this.node.cancelHighlight();
    }

    /**
     * 元素关联
     */
    async relation() {
        let selector = await this._getNodeSelector(this._relationMode, this.node.id);
        await this.node.highlight(this._highlightConfig, selector);
        let relationModeIndex = relationModes.findIndex(p => p === this._relationMode);
        this._relationMode = relationModes[(relationModeIndex + 1) % relationModes.length];
    }

    /**
     * 获取节点选择器
     * @param {Node} selectorMode 
     * @param {number} nodeId 
     * @param {number} parentNodeId 
     */
    async _getNodeSelector(selectorMode, nodeId, parentNodeId=null) {
        let selector = '';
        switch (selectorMode) {
            case 'default':
                selector = this._getSelectorForXpath(nodeId, parentNodeId);
                break;

            case 'class':
                selector = this.node.getSelectorForClass(nodeId, parentNodeId);
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

    /**
     * 获取节点的xpath类型的选择器
     * @param {number} nodeId 
     * @param {number} parentNodeId 
     */
    _getSelectorForXpath(nodeId, parentNodeId = null) {
        let nodeChain = [];
        let parentNodeInfo = this._tree.getParentNodeInfo(nodeId);
        while (parentNodeInfo) {
            if (parentNodeInfo.nodeId === parentNodeId) {
                break;
            }
            nodeChain.push(this._tree.getNodeXpath(parentNodeInfo, nodeId));
            nodeId = parentNodeInfo.nodeId;
            parentNodeInfo = this._tree.getParentNodeInfo(nodeId);

            if (parentNodeInfo.nodeName.toLowerCase() === 'body') {
                break;
            }
        }

        return nodeChain.reverse().join('>');
    }
}

module.exports = Element; 