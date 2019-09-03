const Node = require('./Node');

class Element {
    constructor(client, tree, area, id) {
        this._client = client;
        this._tree = tree;
        this._area = area;
        this.node = new Node(client, tree, id);
        this.id = id;
        this._highlightConfig = { contentColor: { r: 111, g: 168, b: 220, a: 0.66 } };
        this._relationMode = 'None';
        this._classSelector = '';
        this._xpathSelector = '';
    }

    /**
     * 获取父元素
     */
    getParent() {
        let parentNode = this._tree.getParentNode(this.id);
        if (parentNode.nodeId !== this._area.id)
            return new Element(this._client, this._tree, this._area, parentNode.nodeId);
    }

    /**
     * 选中元素
     */
    async selected() {
        await this.highlight();
    }

    /**
     * 选中元素确认
     */
    async selectingComplete() {
        await this._client.send('Overlay.hideHighlight');
    }

    /**
     * 元素关联
     */
    async relation() {
        switch (this._relationMode) {
            case 'XPath':
                await this._xpathRelationHighlight();
                this._relationMode = 'None';
                break;

            case 'Class':
                await this._classRelationHighlight();
                this._relationMode = 'XPath';
                break;

            case 'None':
                await this._highlight();
                this._relationMode = 'Class';
        }
    }

    getPickReponse() {
        return {
            subject: 'elementPick',
            arguments: {
                multiSelectMode: this._relationMode,
                elementId: this.id,
                areaId: this._area.id
            }
        };
    }

    async _classRelationHighlight() {
        if (!this._classSelector) {
            this._classSelector = this._getClassSelector().replace(/\s/g, '');
        }
        await this._client.send('Overlay.highlightNode', {
            highlightConfig: this._highlightConfig,
            nodeId: this.id,
            selector: this._classSelector
        });
    }

    async _xpathRelationHighlight() {
        if (!this._xpathSelector) {
            this._xpathSelector = this._getXpathSelector().replace(/\s/g, '');
        }
        await this._client.send('Overlay.highlightNode', {
            highlightConfig: this._highlightConfig,
            nodeId: this.id,
            selector: this._xpathSelector
        });
    }

    async _highlight() {
        await this._client.send('Overlay.highlightNode', {
            highlightConfig: this._highlightConfig,
            nodeId: this.id
        });
    }

    _getClassSelector() {
        let selectorByClass = this.node.getClassSelector(this._area.node);
        return `${this._area.selector}>${selectorByClass}`;
    }

    _getXpathSelector() {
        let elementXpath = this.node.getSelector(this._area.node);
        let elementSplits = elementXpath.split('>');
        elementSplits[0] = elementSplits[0].split(':')[0];
        return `${this._area.selector}>${elementSplits.join('>')}`;
    }

    _getSelector() {
        let elementXpath = this.node.getSelector(this._area.node);
        let selector = this._area.selector;
        return `${selector}>${elementXpath}`;
    }
}

module.exports = Element; 