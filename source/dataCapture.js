const Tree = require('./Tree');
const Area = require('./Area');

/**
 * 数据抓取器
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
        await this._tree.contribute();
        await this._client.send('DOM.enable');
        await this._client.send('Overlay.enable');

        this._client.on('Overlay.inspectNodeRequested', async r => {
            let response = await this._client.send('DOM.pushNodesByBackendIdsToFrontend', {
                backendNodeIds: [r.backendNodeId]
            });

            let nodeId = response.nodeIds[0];
            await this.startSelecting();

            if (this._selectMode === 'element') {
                let area = this._selectedArea;
                for (let a of this._areas) {
                    if (a.include(nodeId)) {
                        area = a;
                        break;
                    }
                }
                let element = area.addElement(nodeId);
                if (element) {
                    await element.selected();
                    this._selectedElement = element;
                    this._responseCallback(element.getPickReponse());
                }
            } else {
                let area = new Area(this._client, this._page, this._tree, nodeId);
                await area.selected();
                this._selectedArea = area;
                this._responseCallback(area.getPickResponse());
            }
        });
    }

    async startSelecting() {
        await this._client.send('Overlay.setInspectMode', {
            mode: 'searchForNode',
            highlightConfig: this._highlightConfig
        });
    }

    /**
     * 预览
     */
    async preview() {

    }

    /**
     * 选中父元素
     */
    async selectParent() {
        if (this._selectMode === 'element') {
            let parent = await this._selectedElement.getParent();
            if (parent) {
                await parent.selected();
                this._selectedElement = parent;
                let action = parent.getPickReponse();
                this._responseCallback(action);
            }
        } else {
            let parent = await this._selectedArea.getParent();
            if (parent) {
                await parent.selected();
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
            let area = this._areas[areaIndex];
            await area.clear();
            this._areas.splice(areaIndex, 1);
        }
    }

    /**
     * 删除元素
     * @param {number} areaId 
     * @param {number} elementId 
     */
    async deleteElement(areaId, elementId) {
        let area = this._getArea(areaId);
        if (area) {
            let elementIndex = area.elements.findIndex(p => p.id === elementId);
            area.elements.splice(elementIndex, 1);
        }
    }

    /**
     * 停止抓取
     */
    async stopCapture() {
        await this._removeAreas();
        await this._client.detach();
    }

    _getArea(areaId) {
        return this._areas.find(p => p.id === areaId);
    }

    /**
     * 清除区域选择框
     */
    async _removeAreas() {
        this._areas.length = 0;
        await this._page.evaluate(() => {
            let boxEle = document.querySelector('#xly_area_boxs');
            if (boxEle) {
                document.body.removeChild(box);
            }
        });
    }
}

module.exports = DataCapture;