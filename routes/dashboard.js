var diagramModel = require('../models/diagram');
var userModel = require('../models/user');
var exportData = require('../config/export');

// Redirect to diagram
module.exports.view = function(req, res, next) {
    userModel.User.findOne({ _id: req.session.user._id }, 'currentDiagram', function(err, user) {
        // TODO: Check if currentDiagram exist

        if(user.currentDiagram) {
            res.redirect('/dashboard/' + user.currentDiagram);
        } else {
            module.exports.addDiagram(req, res, next);
        }
    });
};

// Update diagram title
module.exports.updateTitle = function(req, res) {
    if(req.query.title && req.query.diagram){
        diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, 'meta', function(err, diagram) {
            if(diagram){
                diagram.meta.title = req.query.title;
                diagram.save(function(err) {
                    res.json(200, { success: "Title successfully updated." });
                });
            } else {
                res.json(404, { error: 'Diagram not found.' });
            }
        });
    } else {
        res.json(403, { error: 'Parameters are missing' });
    }
};

// Add new diagram
module.exports.addDiagram = function(req, res) {
    var diagram = diagramModel.Diagram();
    diagram.user = req.session.user._id;
    diagram.data.nodes.push(diagramModel.Node());
    diagram.history.push(diagram.data);

    diagram.save(function(err){
        res.redirect('/dashboard/' + diagram._id);
    });
};

// Delete diagram
module.exports.deleteDiagram = function(req, res) {
    if(req.query.diagram){
        diagramModel.Diagram.deleteOne({ _id: req.query.diagram, user: req.session.user._id }, function(err) {
            if(err){
                res.json(404, { error: err });
            } else {
                res.json(200, { success: "Diagram successfully deleted." });
            }
        });
    } else {
        res.json(403, { error: 'Parameters are missing' });
    }
};

// Sort diagrams
module.exports.saveSort = function(req, res){
    if(req.query.col){
        userModel.User.findOne({ _id: req.session.user._id }, 'sortDiagrams', function(err, user) {
            user.sortDiagrams.col = req.query.col;
            user.sortDiagrams.asc = req.query.asc === "true" ? true:false;
            user.save(function(err) {
                res.json(200, { success: "Sort successfully updated." });
            });
        });
    } else {
        res.json(403, { error: 'Parameters are missing' });
    }
}

// Import diagram
module.exports.import = function(req, res, next) {
    if(req.body.nodes){
        var goodNodes = [], value;
        var nodes = JSON.parse(req.body.nodes);
        var keys = Object.keys(nodes[0]);

        for(var i = 0; i < nodes.length; i += 1){
            var node = diagramModel.Node();
            keys.forEach(function(key){
                if(key in node){
                    value = nodes[i][key];
                    if (typeof(node[key]) === "number"){
                        value = Number(value);
                    }
                    else if (value === "false"){ value = false; }
                    else if (value === "true") { value = true; }
                    else if (value === "null") { value = ""; }
                    node[key] = value;
                }
            });
            goodNodes.push(node);
        }
        var diagram = diagramModel.Diagram();
        diagram.user = req.session.user._id;
        diagram.data = {
            nodes: goodNodes
        };
        diagram.history = {
            nodes: goodNodes
        };

        diagram.markModified('data.nodes', 'history.nodes');
        diagram.save(function(err){
            res.json(200, { diagram: diagram._id });
        });
    } else {
        res.json(403, { error: 'Parameters are missing' });
    }
};

// Returns sample object schema for csv
module.exports.sample = function(req, res, next){
    if(req.query.type === 'nodes'){
        var node = diagramModel.Node();
        var sample = Object.keys(node);

        res.json(200, { sample: sample });
    } else {
        next();
    }
};

// Export diagram
module.exports.export = function(req, res, next) {
    diagramModel.Diagram.findOne({ _id: req.query.diagram, user: req.session.user._id }, function(err, diagram) {
        if(diagram){
            var type = req.query.type;
            if(type in exportData){
                var data = exportData[type](diagram.data);
                res.render('export', {
                    data: data,
                    type: req.query.type
                });
            } else {
                next();
            }
        } else {
            next();
        }
    });
};

// Render the diagram page
module.exports.diagram = function(req, res, next) {
    diagramModel.Diagram.findOne({ _id: req.params.id, user: req.session.user._id}, function(err, diagram) {
        if(diagram){
            diagramModel.Diagram.find({ user: req.session.user._id }, function(err, diagrams) {
                userModel.User.findByIdAndUpdate(req.session.user._id, { $set: { "currentDiagram": diagram._id }}, { new: true }, function(err) {
                    res.render('dashboard', {
                        csrfToken: req.csrfToken(),
                        diagram: diagram,
                        diagrams: diagrams,
                        node: diagramModel.Node()
                    });
                });
            });
        } else {
            next();
        }
    });
};
