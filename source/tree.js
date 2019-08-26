class Tree {
    constructor(client) {
        this._client = client;
        this._tree = null;
    }

    async contribute() {
        this._tree = await this._client.send("DOM.getDocument", { "pierce": true, "depth": -1 });
    }

    getRoot() {
        return this._tree.root;
    }

    getNode(nodeId, parentNode = null) {
        if (!parentNode) {
            parentNode = this.getRoot();
        }
        return this._getNode(parentNode, nodeId);
    }

    getParentNode(nodeId) {
        return this._getParentNode(this.getRoot(), nodeId);
    }

    _getNode(parentNode, nodeId) {
        let children = parentNode.children;
        // if (parentNode.nodeName.toLowerCase() === 'iframe') {
        //     children = parentNode.contentDocument.children;
        // }
        if (!children) {
            return;
        }
        
        let matchNode = children.find(p => p.nodeId === nodeId);
        if (matchNode) {
            return matchNode;
        }

        for (let i = 0; i < children.length; i++) {
            let node = this._getNode(children[i], nodeId);
            if (node) {
                return node;
            }
        }
    }

    _getParentNode(node, targetNodeId) {
        let children = node.children;
        if (!children) {
            return;
        }

        let matchNode = children.find(p => p.nodeId === targetNodeId);
        if (matchNode) {
            return node;
        }

        for (let i = 0; i < children.length; i++) {
            let parentNode = this._getParentNode(children[i], targetNodeId);
            if (parentNode) {
                return parentNode;
            }
        }
    }
}

module.exports = Tree;