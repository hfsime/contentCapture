const Node = require('./Node');

class Area {
    constructor(client, page, targetId, tree, id) {
        this._client = client;
        this._page = page;
        this._targetId = targetId;
        this.id = id;
        this._highlightConfig = { contentColor: { r: 111, g: 168, b: 220, a: 0.66 } };
        this._tree = tree;
        this.node = new Node(client, tree, id);
        this.selector = this.node.getSelector().replace(/\s/g, '');
        this.elements = [];
    }

    async selectParent() {
        let parent = this.getParent();
        if (parent) {
            await parent.highlight();
            return parent;
        }
    }

    /**
     * 选中区域
     */
    async selected() {
        await this.highlight();
        return this.getPickResponse();
    }

    /**
     * 选中确认
     */
    async selectingComplete() {
        await this._client.send('Overlay.hideHighlight');
        let box = await this._client.send('DOM.getBoxModel', {
            nodeId: this.id
        });
        await this._drawArea(box, this.id);
    }

    getPickResponse() {
        return {
            subject: 'areaPick',
            arguments: {
                targetId: this._targetId,
                areaId: this.id,
                guid: this._guid(),
                selector: this.selector
            }
        };
    }

    async highlight() {
        await this.node.highlight(this._highlightConfig);
    }

    isElementInArea(elementId) {
        return this.node.contains(elementId);
    }

    getParent() {
        let parentNode = this._tree.getParentNode(this.id);
        return new Area(this._client, this._page, this._targetId, this._tree, parentNode.nodeId);
    }

    getElement(elementId) {
        return this.elements.find(p => p.id === elementId);
    }

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

    _guid(len, radix) {
        let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        let uuid = [], i;
        radix = radix || chars.length;
        if (len) {
            for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
        } else {
            let r;
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    uuid[i] = chars[i === 19 ? r & 0x3 | 0x8 : r];
                }
            }
        }

        return uuid.join('');
    }
}

module.exports = Area;