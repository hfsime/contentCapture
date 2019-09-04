class Node {
    constructor(client, nodeInfo) {
        this._client = client;
        this.id = id;
        this.parentId = nodeInfo.parentId;
    }

    async highlight(highlightConfig, relationSelector=null) {
        try {
            let boxModel = await this._client.send('DOM.getBoxModel', { nodeId: this.id });
            if (boxModel.model.width === 0 || boxModel.model.height === 0) {
                let box = await this._getBox();
                if (box) {
                    await this._highlightRect(highlightConfig, box.x, box.y, box.width, box.height);
                }
            } else {
                await this._highlightNode(highlightConfig, relationSelector);
            }
        } catch (error) {
            console.log('该元素是隐藏元素');
        }
    }

    async cancelHighlight() {
        await this._client.send('Overlay.hideHighlight');
    }

    async getClassName() {
        let response = await this._client.send('DOM.collectClassNamesFromSubtree', { nodeId: this.id });
        return response.classNames.join('.');
    }

    async _getBox() {
        let boxes = await this._getBoxes(this._node);
        if (boxes && boxes.length > 0) {
            let startX = boxes[0].startX;
            let startY = boxes[0].startY;
            let endX = boxes[0].endX;
            let endY = boxes[0].endY;
            for (let i = 0; i < boxes.length; i++) {
                startX = Math.min(startX, boxes[i].startX);
                startY = Math.min(startY, boxes[i].startY);
                endX = Math.max(endX, boxes[i].endX);
                endY = Math.max(endY, boxes[i].endY);
            }

            return {
                x: parseInt(startX),
                y: parseInt(startY),
                width: parseInt(endX - startX),
                height: parseInt(endY - startY)
            };
        }
    }

    async _getBoxes(node) {
        if (!node.children) {
            return;
        }

        let boundingBoxes = [];
        for (let i = 0; i < node.children.length; i++) {
            try {
                let boxModel = await this._client.send('DOM.getBoxModel', { nodeId: node.children[i].nodeId });
                let boundingBox = await this._getBoundingBox(boxModel);
                if (boundingBox) {
                    boundingBoxes.push(boundingBox);
                } else {
                    let boxes = await this._getBoxes(node.children[i]);
                    if (boxes) {
                        boundingBoxes.push(...boxes);
                    }
                }
            } catch (error) {
                console.log('该元素是隐藏元素');
            }
        }

        return boundingBoxes;
    }

    async _getBoundingBox(boxModel) {
        if (boxModel.model.width === 0 || boxModel.model.height === 0) {
            return null;
        }

        let boxArray = boxModel.model.content;
        let startX = Math.min(boxArray[0], boxArray[2], boxArray[4], boxArray[6]);
        let startY = Math.min(boxArray[1], boxArray[3], boxArray[5], boxArray[7]);
        let endX = Math.max(boxArray[0], boxArray[2], boxArray[4], boxArray[6]);
        let endY = Math.max(boxArray[1], boxArray[3], boxArray[5], boxArray[7]);

        return {
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY
        };
    }

    async _highlightNode(highlightConfig, relationSelector=null) {
        if (relationSelector) {
            await this._client.send('Overlay.highlightNode', {
                highlightConfig: highlightConfig,
                nodeId: this.id,
                selector: relationSelector
            });
        } else {
            await this._client.send('Overlay.highlightNode', {
                highlightConfig: highlightConfig,
                nodeId: this.id
            });
        }
    }

    async _highlightRect(highlightConfig, x, y, width, height) {
        await this._client.send('Overlay.highlightRect', {
            x: x,
            y: y,
            width: width,
            height: height,
            color: highlightConfig.contentColor
        });
    }
}

module.exports = Node;