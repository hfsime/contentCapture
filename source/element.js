const Node = require('./Node');

class Element {
    constructor(client, tree, area, id) {
        this._client = client;
        this._tree = tree;
        this._area = area;
        this.node = new Node(client, tree, id);
        this.id = id;
        this._highlightConfig = { contentColor: { r: 111, g: 168, b: 220, a: 0.66 } };
        this._selectorByClass = this._getClassSelector().replace(/\s/g, '');
        this._selectorByXpath = this._getXpathSelector().replace(/\s/g, '');
        this._onlySelector = this._getOnlySelector().replace(/\s/g, '');
        this._relationMode = 'None';
    }

    async selectParent() {
        let parent = this.getParent();
        if (parent) {
            await parent.highlight();
            return parent;
        }
    }

    /**
     * 选中元素
     */
    async selected() {
        await this.highlight();
        return this.getPickReponse();
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
        let response = this.getPickReponse();
        switch (this._relationMode) {
            case 'XPath':
                await this.highlightRelevantByXpath();
                this._relationMode = 'None';
                break;

            case 'Class':
                await this.highlightRelevantByClass();
                this._relationMode = 'XPath';
                break;

            case 'None':
                await this.highlight();
                this._relationMode = 'Class';
        }

        return response;
    }

    /**
     * 切换元素选择器
     */
    async changeSelector() {
        switch (this._relationMode) {
            case 'XPath':
                await this.highlightRelevantByXpath();
                this._relationMode = 'Class';
                break;

            case 'Class':
                await this.highlightRelevantByClass();
                this._relationMode = 'XPath';
                break;
        }

        return this.getPickReponse();
    }

    getPickReponse() {
        return {
            subject: 'elementPick',
            arguments: {
                multiSelectMode: this._relationMode,
                elementId: this.id,
                areaId: this._area.id,
                selector: this._onlySelector,
                multiClass: this._selectorByClass,
                multiXPath: this._selectorByXpath
            }
        };
    }

    async highlightRelevantByClass() {
        await this._client.send('Overlay.highlightNode', {
            highlightConfig: this._highlightConfig,
            nodeId: this.id,
            selector: this._selectorByClass
        });
    }

    async highlightRelevantByXpath() {
        await this._client.send('Overlay.highlightNode', {
            highlightConfig: this._highlightConfig,
            nodeId: this.id,
            selector: this._selectorByXpath
        });
    }

    async highlight() {
        await this._client.send('Overlay.highlightNode', {
            highlightConfig: this._highlightConfig,
            nodeId: this.id
        });
    }

    getParent() {
        let parentNode = this._tree.getParentNode(this.id);
        if (parentNode.nodeId !== this._area.id)
            return new Element(this._client, this._tree, this._area, parentNode.nodeId);
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

    _getOnlySelector() {
        let elementXpath = this.node.getSelector(this._area.node);
        let selector = this._area.selector;
        return `${selector}>${elementXpath}`;
    }
}

module.exports = Element; 