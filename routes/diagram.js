var diagramModel = require('../models/diagram');
var userModel = require('../models/user');

// Add new node
module.exports.addNode = function(req, res) {
    diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, 'data.nodes', function(err, diagram){
        if(diagram){
            var node = JSON.parse(req.body.node);
            if(node){
                diagram.data.nodes.push(node);
                diagram.save(function(err) {
                    if(err){
                        res.json(403, { error: 'Something went wrong.' });
                    } else {
                        module.exports.updateHistory(req.query.diagram);
                        res.json(200, { node: node });
                    }
                });
            } else {
                res.json(403, { error: 'Something went wrong.' });
            }
        } else {
            res.json(404, { error: 'Diagram not found.' });
        }
    });
};

module.exports.updateNode = function(req, res) {
    diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, 'data.nodes', function(err, diagram){
        if(diagram){
            var node = JSON.parse(req.body.node);
            var id = req.query.id;
            if(node && diagram.data.nodes[id]){
                Object.keys(node).forEach(function(key) {
                    diagram.data.nodes[id][key] = node[key];
                });
                diagram.markModified('data.nodes');
                diagram.save(function(err, resDiagram) {
                    if(err){
                        res.json(403, { error: 'Something went wrong.' });
                    } else {
                        module.exports.updateHistory(req.query.diagram);
                        res.json(200, { node: resDiagram.data.nodes[id] });
                    }
                });
            } else {
                res.json(403, { error: 'Node not found.' });
            }
        } else {
            res.json(404, { error: 'Diagram not found.' });
        }
    });
};

// Delete node
module.exports.deleteNode = function(req, res) {
    diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, 'data', function(err, diagram) {
        var id = req.query.id;
        if(diagram && id) {
            if(diagram.data.nodes[id]){
                diagram.data.relationships = diagram.data.relationships.filter(function(rel){
                    var res = rel.startNode != id && rel.endNode != id;
                    var a = Number(rel.startNode);
                    var b = Number(rel.endNode);
                    var c = Number(id);
                    if(a > c) { rel.startNode = a - 1; }
                    if(b > c) { rel.endNode = b - 1; }
                    
                    return res;
                });
                diagram.data.nodes.splice(id, 1);
                diagram.save(function(err) {
                    if(err){
                        res.json(403, { error: 'Something went wrong.' });
                    } else {
                        module.exports.updateHistory(req.query.diagram);
                        res.json(200, { id: id });
                    }
                });
            } else {
                res.json(404, { error: 'Node not found.' });
            }
        } else {
            res.json(404, { error: 'Diagram not found.' });
        }
    });
};


// Add new relationship
module.exports.addRelationship = function(req, res) {
    diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, 'data.relationships', function(err, diagram) {
        if(diagram){
            if(req.body.startNode && req.body.endNode) {
                var rel = diagramModel.Relationship();
                rel.startNode = req.body.startNode;
                rel.endNode = req.body.endNode;
                diagram.data.relationships.push(rel);

                diagram.save(function(err) {
                    if(err){
                        res.json(403, { error: 'Something went wrong.' });
                    } else {
                        module.exports.updateHistory(req.query.diagram);
                        res.json(200, { rel: rel });
                    }
                });
            } else {
                res.json(403, { error: 'Invalid parameters.' });
            }
        } else {
            res.json(404, { error: 'Diagram not found.' });
        }
    });
};

// Update relationship
module.exports.updateRelationship = function(req, res){
    diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, 'data.relationships', function(err, diagram) {
        var id = req.query.id;
        var rel = JSON.parse(req.body.rel);
        if(diagram) {
            if(rel && diagram.data.relationships[id]){
                Object.keys(rel).forEach(function(key) {
                    diagram.data.relationships[id][key] = rel[key];
                });
                diagram.markModified('data.relationships');
                diagram.save(function(err, resDiagram) {
                    if(err){
                        res.json(403, { error: 'Something went wrong.' });
                    } else {
                        module.exports.updateHistory(req.query.diagram);
                        res.json(200, { rel: resDiagram.data.relationships[id] });
                    }
                });
            } else {
                res.json(404, { error: 'Relationship not found.' });
            }
        } else {
            res.json(404, { error: 'Diagram not found.' });
        }
    });
};

// Delete relationship
module.exports.deleteRelationship = function(req, res) {
    diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, 'data.relationships', function(err, diagram) {
        var id = req.query.id;
        if(diagram) {
            if(diagram.data.relationships[id]){
                diagram.data.relationships.splice(id, 1);
                diagram.save(function(err) {
                    if(err){
                        res.json(403, { error: 'Something went wrong.' });
                    } else {
                        module.exports.updateHistory(req.query.diagram);
                        res.json(200, { id: id });
                    }
                });
            } else {
                res.json(404, { error: 'Relationship not found.' });
            }
        } else {
            res.json(404, { error: 'Diagram not found.' });
        }
    });
};

// Undo
module.exports.updateToIndex = function(req, res) {
    diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, function(err, diagram) {
        var index = Number(req.query.index);

        if(diagram) {
            if(index >= 0 && index < diagram.history.length){
                diagram.meta.historyIndex = index;
                diagram.data = diagram.history[index];
                diagram.save(function(err, diagramRes) {
                    if(err) {
                        res.json(403, { error: 'Something went wrong.' });
                    } else {
                        res.json(200, { data: diagramRes.data });
                    }
                });
            } else {
                res.json(404, {
                    error: 'Index not found.',
                    index: index < 0 ? 0 : diagram.history.length - 1
                });
            }
        } else {
            res.json(404, { error: 'Diagram not found.' });
        }
        
    });
};

// Update history
module.exports.updateHistory = function(diagramId){
    diagramModel.Diagram.findOne({ _id: diagramId }, function(err, diagram) {
        diagram.meta.historyIndex++;
        diagram.history.splice(diagram.meta.historyIndex);
        diagram.history.push(diagram.data);
        diagram.save();
    });
};
