const Element = require('./element');

class Area {
    constructor(client, page, tree, id) {
        this._client = client;
        this._page = page;
        this.id = id;
        this._highlightConfig = { contentColor: { r: 111, g: 168, b: 220, a: 0.66 } };
        this._tree = tree;
        this.node = this._tree.getNode(id);
        this.elements = [];
        this._frameId = '';
    }

    /**
     * 开始选择区域
     */
    async startSelecting() {
        await this._client.send('Overlay.setInspectMode', {
            mode: 'searchForNode',
            highlightConfig: this._highlightConfig
        });
    }
    
    /**
     * 选中区域
     */
    async selected() {
        await this.node.highlight(this._highlightConfig);
    }

    /**
     * 选中确认
     */
    async selectConfirm() {
        await this.node.cancelHighlight();
        let box = await this._client.send('DOM.getBoxModel', {
            nodeId: this.id
        });
        await this._drawArea(box, this.id);
    }

    /**
     * 清除区域
     */
    async clear() {
        await this._page.evaluate((areaId) => {
            let boxEle = document.querySelector('#xly_area_boxs');
            if (boxEle) {
                let areaEle = boxEle.querySelector(`#xly_area_id${areaId}`);
                if (areaEle) {
                    box.removeChild(areaEle);
                }
            }
        }, this.id);
    }

    /**
     * 判断元素是否在区域中
     * @param {number} elementId 
     */
    include(elementId) {
        return this._tree.isChild(this.id, elementId);
    }

    /**
     * 获取父区域
     */
    getParent() {
        let parentNode = this._tree.getNode(this.node.parentId);
        return new Area(this._client, this._page, this._tree, parentNode.id);
    }

    /**
     * 添加元素
     * @param {number} elementId 
     */
    addElement(elementId) {
        if (this.include(elementId) && !this.getElement(elementId)) {
            let element = new Element(this._client, this._highlightConfig, this._tree, elementId);
            this.elements.push(element);
            return element;
        }
    }

    /**
     * 获取元素
     */
    getElement(elementId) {
        return this.elements.find(p => p.id === elementId);
    }

    /**
     * 区域画框
     * @param {object} box 
     * @param {number} areaId 
     */
    async _drawArea(box, areaId) {
        await this._page.evaluate((box, areaId) => {
            let parent = document.getElementById('xly_area_boxs'),
                area = document.createElement('div'),
                lineTop = document.createElement('div'),
                lineBottom = document.createElement('div'),
                lineLeft = document.createElement('div'),
                lineRight = document.createElement('div'),
                scrollTop = document.documentElement.scrollTop;

            area.id = `xly_area_id${areaId}`;

            lineTop.style.width = `${box.model.width}px`;
            lineTop.style.height = '2px';
            lineTop.style.backgroundColor = 'rgba(0, 187, 12, 0.4)';
            lineTop.style.position = 'absolute';
            lineTop.style.top = `${box.model.border[1] + scrollTop}px`;
            lineTop.style.left = `${box.model.border[0]}px`;

            lineBottom.style.width = `${box.model.width}px`;
            lineBottom.style.height = '2px';
            lineBottom.style.backgroundColor = 'rgba(0, 187, 12, 0.4)';
            lineBottom.style.position = 'absolute';
            lineBottom.style.top = `${box.model.border[5] + scrollTop}px`;
            lineBottom.style.left = `${box.model.border[0]}px`;

            lineLeft.style.width = '2px';
            lineLeft.style.height = `${box.model.height}px`;
            lineLeft.style.backgroundColor = 'rgba(0, 187, 12, 0.4)';
            lineLeft.style.position = 'absolute';
            lineLeft.style.top = `${box.model.border[1] + scrollTop}px`;
            lineLeft.style.left = `${box.model.border[0]}px`;

            lineRight.style.width = '2px';
            lineRight.style.height = `${box.model.height}px`;
            lineRight.style.backgroundColor = 'rgba(0, 187, 12, 0.4)';
            lineRight.style.position = 'absolute';
            lineRight.style.top = `${box.model.border[1] + scrollTop}px`;
            lineRight.style.left = `${box.model.border[2]}px`;

            area.appendChild(lineTop);
            area.appendChild(lineBottom);
            area.appendChild(lineLeft);
            area.appendChild(lineRight);
            if (!parent) {
                parent = document.createElement('div');
                parent.id = 'xly_area_boxs';
                parent.appendChild(area);
                document.body.appendChild(parent);
            } else {
                parent.appendChild(area);
            }
        }, box, areaId);
    }
}

module.exports = Area;