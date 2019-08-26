class Node {
    constructor(client, tree, id) {
        this._client = client;
        this._tree = tree;
        this.id = id;
        this._node = tree.getNode(id);
    }

    contains(nodeId) {
        let node = this._tree.getNode(nodeId, this._node);
        if (node) {
            return true;
        } else {
            return false;
        }
    }

    async highlight(highlightConfig) {
        try {
            let boxModel = await this._client.send('DOM.getBoxModel', { nodeId: this.id });
            //获取子元素的区域大小
            if (boxModel.model.width === 0 || boxModel.model.height === 0) {
                //获取子元素的区域大小
                let box = await this._getBox();
                if (box) {
                    await this._highlightRect(box.x, box.y, box.width, box.height);
                }
            } else {
                await this._highlightNode(highlightConfig, this.id);
            }
        } catch (error) {
            console.log('该元素是隐藏元素');
        }
    }

    getSelector(parentNode = null) {
        if (parentNode) {
            let node = parentNode._node;
            return this._calculateSelector(node, this.id);
        } else {
            let node = this._tree.getRoot();
            return this._calculateSelector(node, this.id, 'body');
        }
    }

    getClassSelector(parentNode = null) {
        let node = parentNode ? parentNode._node : this._tree.getRoot();
        return this._calculateClassSelector(node, this.id);
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

    async _highlightNode(highlightConfig) {
        await this._client.send('Overlay.highlightNode', {
            highlightConfig: highlightConfig,
            nodeId: this.id
        });
    }

    async _highlightRect(x, y, width, height) {
        await this._client.send('Overlay.highlightRect', {
            x: x,
            y: y,
            width: width,
            height: height,
            color: { r: 111, g: 168, b: 220, a: 0.66 }
        });
    }

    _calculateSelector(parentNode, nodeId, xpath = '') {
        let children = parentNode.children;
        // if (parentNode.nodeName.toLowerCase() === 'iframe') {
        //     children = parentNode.contentDocument.children;
        // }
        if (!children) {
            return;
        }

        children = children.filter(e => e.nodeType === 1);
        let matchNodeIndex = children.findIndex(p => p.nodeId === nodeId);
        if (matchNodeIndex > -1) {
            let matchNode = children[matchNodeIndex];
            if (xpath) {
                return `${xpath} > ${matchNode.nodeName}:nth-child(${matchNodeIndex + 1})`;
            } else {
                return `${matchNode.nodeName}:nth-child(${matchNodeIndex + 1})`;
            }
        }

        for (let i = 0; i < children.length; i++) {
            let subXpath = xpath;
            let nodename = children[i].nodeName.toLowerCase();
            if (nodename === 'head') {
                continue;
            }
            if (nodename !== 'html' && nodename !== 'body') {
                if (subXpath) {
                    subXpath = `${xpath} > ${children[i].nodeName}:nth-child(${i + 1})`;
                } else {
                    subXpath = `${children[i].nodeName}:nth-child(${i + 1})`;
                }
            }

            let selector = this._calculateSelector(children[i], nodeId, subXpath);
            if (selector) {
                return selector;
            }
        }
    }

    _calculateClassSelector(parentNode, nodeId, classSelector = '') {
        let children = parentNode.children;
        if (!children) {
            return;
        }

        children = children.filter(e => e.nodeType === 1);
        let matchNodeIndex = children.findIndex(p => p.nodeId === nodeId);
        if (matchNodeIndex > -1) {
            let matchNode = children[matchNodeIndex];
            let strNodeClass = this._getClassAttribute(matchNode);
            classSelector = classSelector ? `${classSelector} >` : classSelector;
            return `${classSelector} ${matchNode.nodeName}${strNodeClass}`;
        }

        for (let i = 0; i < children.length; i++) {
            let subXpath = classSelector;
            if (subXpath) {
                subXpath = `${classSelector} > ${children[i].nodeName}`;
            } else {
                subXpath = `${children[i].nodeName}`;
            }

            let selector = this._calculateClassSelector(children[i], nodeId, subXpath);
            if (selector) {
                return selector;
            }
        }
    }

    _getClassAttribute(node) {
        let strClass = '';
        let nodeAttributes = node.attributes;
        if (nodeAttributes) {
            let classIndex = nodeAttributes.findIndex(e => e === 'class');
            if (classIndex > -1) {
                let classSplits = nodeAttributes[classIndex + 1].split(' ');
                for (let i = 0; i < classSplits.length; i++) {
                    if (classSplits[i])
                        strClass = `${strClass}.${classSplits[i]}`;
                }
            }
        }

        return strClass;
    }
}

module.exports = Node;