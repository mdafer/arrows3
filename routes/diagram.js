var diagramModel = require('../models/diagram');
var userModel = require('../models/user');

// Add new node
module.exports.addNode = function(req, res) {
    diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, 'data.nodes', function(err, diagram){
        if(diagram){
            var node = req.body.node;
            if(node){
                diagram.data.nodes.push(node);
                diagram.save(function(err) {
                    if(err){
                        res.json(403, { error: 'Something went wrong.' });
                    } else {
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

// Delete node
module.exports.deleteNode = function(req, res) {
    diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, 'data.nodes', function(err, diagram) {
        var id = req.query.id;
        if(diagram && id) {
            if(id >= 0 && id < diagram.data.nodes.length){
                diagram.data.nodes.splice(id, 1);
                diagram.save(function(err) {
                    if(err){
                        res.json(403, { error: 'Something went wrong.' });
                    } else {
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
}

// Delete diagram
module.exports.deleteRelationship = function(req, res) {
    diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, 'data.relationships', function(err, diagram) {
        var id = req.query.id;
        if(diagram && id) {
            if(id >= 0 && id < diagram.data.relationships.length){
                diagram.data.relationships.splice(id, 1);
                diagram.save(function(err) {
                    if(err){
                        res.json(403, { error: 'Something went wrong.' });
                    } else {
                        res.json(200, { id: id });
                    }
                });
            } else {
                res.json(404, { error: 'Relationships not found.' });
            }
        } else {
            res.json(404, { error: 'Diagram not found.' });
        }
    });
}