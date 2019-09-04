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
        let selector = await this._tree.getNodeSelector(this._relationMode, this.node.id);
        await this.node.highlight(this._highlightConfig, selector);
        let relationModeIndex = relationModes.findIndex(p => p === this._relationMode);
        this._relationMode = relationModes[(relationModeIndex + 1) % relationModes.length];
    }
}

module.exports = Element; 