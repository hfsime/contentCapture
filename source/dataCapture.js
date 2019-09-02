const Tree = require('./Tree');
const Area = require('./Area');
const Element = require('./Element');

/**
 * 数据抓取主体类
 */
class DataCapture {
    constructor(page, client, responseCallback) {
        this._page = page;
        this._client = client;
        this._tree = new Tree(client);
        this._highlightConfig = { contentColor: { r: 111, g: 168, b: 220, a: 0.66 } };
        this._areas = [];
        this._selectMode = 'area';
        this._selectedArea = null;
        this._selectedElement = null;
        this._responseCallback = responseCallback;
    }

    async startCapture() {
        this._tree.contribute();
        await this._client.send('DOM.enable');
        await this._client.send('Overlay.enable');

        this._client.on('Overlay.inspectNodeRequested', async r => {
            let response = await this._client.send('DOM.pushNodesByBackendIdsToFrontend', {
                backendNodeIds: [r.backendNodeId]
            });

            await this.startSelecting();
            let nodeId = response.nodeIds[0];

            if (this._selectMode === 'element') {
                if (!this._selectedArea) {
                    // 有取消区域选择，_selectedArea会置空
                    for (let i = 0; i < this._areas.length; i++) {
                        if (this._areas[i].isElementInArea(nodeId)) {
                            this._selectedArea = this._areas[i];
                            break;
                        }
                    }
                    if (!this._selectedArea) {
                        await this.startSelecting();
                        return;
                    }
                }
                
                let area = this._selectedArea;
                let isElementInArea = area.isElementInArea(nodeId);
                if (isElementInArea) {
                    let exists = area.getElement(nodeId);
                    if (!exists) {
                        let element = new Element(this._client, this._tree, area, nodeId);
                        let action = await element.selected();
                        this._selectedElement = element;
                        this._responseCallback(action);
                    }
                }
            } else {
                let area = new Area(this._client, this._page, this._tree, nodeId);
                let action = await area.selected();
                this._selectedArea = area;
                this._responseCallback(action);
            }
        });
    }

    async startSelecting() {
        await this._client.send('Overlay.setInspectMode', {
            mode: 'searchForNode',
            highlightConfig: this._highlightConfig
        });
    }

    async selectParent() {
        if (this._selectMode === 'element') {
            let parent = await this._selectedElement.selectParent();
            if (parent) {
                this._selectedElement = parent;
                let action = parent.getPickReponse();
                this._responseCallback(action);
            }
        } else {
            let parent = await this._selectedArea.selectParent();
            if (parent) {
                this._selectedArea = parent;
                let action = parent.getPickResponse();
                this._responseCallback(action);
            }
        }
    }

    /**
     * 开始选择区域
     */
    async selectingArea() {
        this._selectMode = 'area';
        await this.startSelecting();
    }

    /**
     * 开始选择元素
     */
    async selectElement() {
        this._selectMode = 'element';
        await this.startSelecting();
    }

    /**
     * 元素关联
     */
    async relation() {
        let action = await this._selectedElement.relation();
        this._responseCallback(action);
    }

    /**
     * 选择确认
     */
    async selectConfirm() {
        if (this._selectMode === 'area') {
            await this._selectedArea.selectingComplete();
            this._areas.push(this._selectedArea);
        } else {
            await this._selectedElement.selectingComplete();
            let area = this._getArea(this._selectedArea.id);
            if (area) {
                area.elements.push(this._selectedElement);
            }
        }
        await this.startSelecting();
    }

    /**
     * 取消选择
     */
    async cancelSelect() {
        if (this._selectMode === 'area') {
            this._selectedArea = null;
        } else {
            this._selectedElement = null;
        }
        await this.startSelecting();
    }

    /**
     * 删除区域
     * @param {number} areaId 
     */
    async deleteArea(areaId) {
        let areaIndex = this._areas.findIndex(p => p.id === areaId);
        if (areaIndex > -1) {
            this._areas.splice(areaIndex, 1);
        }
        await this.clearAreaBoxes(areaId);
    }

    /**
     * 删除元素
     * @param {number} areaId 
     * @param {number} elementId 
     */
    async deleteElement(areaId, elementId) {
        let area = this._areas.find(p => p.id === areaId);
        if (area) {
            let elementIndex = area.elements.findIndex(p => p.id === elementId);
            area.elements.splice(elementIndex, 1);
        }
    }

    /**
     * 停止抓取
     */
    async stopCapture() {
        await this._client.detach();
        await this.clearAreaBoxes();
    }

    _getArea(areaId) {
        return this._areas.find(p => p.id === areaId);
    }

    _getElement(areaId, elementId) {
        let area = this._getArea(areaId);
        if (area) {
            let element = area.getElement(elementId);
            return element;
        }
    }

    /**
     * 清除区域选择框
     * @param {number} areaId 
     */
    async clearAreaBoxes(areaId = null) {
        await this._page.evaluate((areaId) => {
            let box = document.querySelector('#xly_area_boxs');
            if (box && areaId === null) {
                document.body.removeChild(box);
            } else {
                let child = box.querySelector(`#xly_area_id${areaId}`);
                if (child)
                    box.removeChild(child);
            }
        }, areaId);
        if (areaId !== null) {
            for (let [index, area] of this._areas.entries()) {
                if (area.id === areaId) {
                    this._areas.splice(index, 1);
                    break;
                }
            }
        }
    }
}

module.exports = DataCapture;