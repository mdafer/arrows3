/*
    Tools
*/
var tools = {
    addNode: false,
    addRelationship: false,
    deleteElement: false
};
var currentNodeId = 0;
var currentRelId = 0;
var addNewRel = false;

/*
    Zoom
*/
var diagramZoom = d3.behavior.zoom()
    .scaleExtent([1/10, 10])
    .on("zoom", zoomed);
function zoomed() {
    d3.selectAll("g.layer")
        .attr("transform", "translate(" + diagramZoom.translate() + ")" + "scale(" + diagramZoom.scale() + ")");
}

/*
    SVG
*/
var svg = d3.select("#diagram")
    .append("svg")
    .attr("class", "graph")
    .on('click', addNodeOnClick)
    .call(diagramZoom)
    .on("wheel.zoom", null)
    .on("dblclick.zoom", null);
var gRelationships = svg.append("g")
    .attr("class", "layer relationships");
var gNodes = svg.append("g")
    .attr("class", "layer nodes");
var gCaptions = svg.append("g")
    .attr("class", "layer captions");
var gOverlay = svg.append("g")
    .attr("class", "layer overlay");

/*
    Render
*/
function render(){
    svg.selectAll("g > *").remove();

    var groupRel = createGroupRel();
    diagramObj.data.relationships.forEach(function(rel){
        var i = groupRel[rel.startNode][rel.endNode];
        groupRel[rel.startNode][rel.endNode]++;
        groupRel[rel.endNode][rel.startNode]++;
        rel.source = diagramObj.data.nodes[rel.startNode];
        rel.target = diagramObj.data.nodes[rel.endNode];
        rel.angle = angleTo(rel.target, rel.source);
        rel.distance = distanceTo(rel.target, rel.source) - 12;
        if(i){
            rel.position = curvedArrow(rel.source.radius + 12, rel.target.radius, rel.distance, i * 10, 5, 20, 20);
        } else {
            rel.position  = horizontalArrow(rel.source.radius + 12, rel.distance - rel.target.radius, 5);
        }
    });

    // Nodes
    var nodes = gNodes.selectAll("rect.node")
        .data(diagramObj.data.nodes);
    nodes.enter()
        .append("rect")
        .attr("class", "node")
        .attr("width", function(node) { return node.radius * 2; })
        .attr("height", function(node) { return node.radius * 2; })
        .attr("x", function(node) { return node.x; })
        .attr("y", function(node) { return node.y; })
        .attr("rx", function(node) { return node.isRectangle ? 20 : node.radius; })
        .attr("ry", function(node) { return node.isRectangle ? 20 : node.radius; })
        .attr("fill", function(node) { return node.fill; })
        .attr("stroke", function(node) { return node.stroke; })
        .attr("stroke-width", function(node) { return node.strokeWidth; })
        .style("color", function(node) { return node.color; });

    // Properties
    nodes.enter()
        .append("path")
        .attr("class", "properties path")
        .attr("transform", function(node) {
            return "translate( " + (node.x + 2 * node.radius) + ", " + (node.y + node.radius) + " )";
        })
        .attr("d", function(node) {
            if(node.properties){
                node.lines = node.properties.split("\n");
                var l = node.lines.length;
                return speechBubblePath(node.propertiesWidth * 2, l * 50, "horizontal", 10, 10);
            }
            return;
        })
        .attr("fill", "white")
        .attr("stroke", "#333333")
        .attr("stroke-width", 2);

    var properties = nodes.enter()
        .append("g")
        .attr("class", "properties text");
    properties.selectAll("text")
        .data(function(node) {
            var lines = [];
            if(node.lines) {
                for(var i = 0; i < node.lines.length; i++){
                    lines.push({
                        "text": node.lines[i],
                        "x": node.x + 2 * node.radius + node.propertiesWidth + 20,
                        "y": node.y + node.radius + (i - node.lines.length) * 25 + (i + 1) * 25,
                        "color": node.color
                    });
                }
            }
            return lines;
        })
        .enter()
        .append("text")
        .attr("x", function(line) { return line.x; })
        .attr("y", function(line) { return line.y; })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .attr("font-size", "50px")
        .text(function(line) { return line.text; });


    // Captions
    var captions = gCaptions.selectAll("text.caption")
        .data(diagramObj.data.nodes);
    captions.enter()
        .append("text")
        .attr("class", "caption")
        .attr("x", function(node) { return node.x + node.radius; })
        .attr("y", function(node) { return node.y + node.radius; })
        .attr("fill", function(node) { return node.color; })
        .attr("text-anchor", "middle")
        .attr("font-size", "50px")
        .attr("alignment-baseline", "central")
        .text(function(node) { return node.caption; });

    // Relationships
    var relationships = gRelationships.selectAll("path.relationship")
        .data(diagramObj.data.relationships);

    relationships.enter()
        .append("path")
        .attr("class", "relationship")
        .attr("transform", function(rel) {
            return "translate(" + (rel.source.x + rel.source.radius) + "," + (rel.source.y + rel.source.radius) + ")" + "rotate(" + rel.angle + ")";
        })
        .attr("d", function(rel, i) { return rel.position.outline; })
        .attr("fill", function(rel) { return rel.fill; });


    relationships.enter()
        .append("g")
        .attr("class", "type")
        .attr("transform", function(rel) {
            return "translate("
            + (rel.source.x + rel.source.radius)
            + ","
            + (rel.source.y + rel.source.radius)
            + ")" + "rotate(" + rel.angle + ")";
        })
        .append("text")
        .attr("x", function(rel) { return rel.position.apex.x; })
        .attr("y", function(rel) { return rel.position.apex.y - 40; })
        .attr("fill", "#333333")
        .attr("class", "relationship type")
        .attr("text-anchor", "middle")
        .attr("font-size",  "50px")
        .attr("alignment-baseline", "central")
        .text(function(rel) { return rel.type; });

    relationships.enter()
        .append("g")
        .attr("class", "group r")
        .attr("transform", function(rel) {
            return "translate("
            + (rel.source.x + rel.source.radius)
            + ","
            + (rel.source.y + rel.source.radius)
            + ")" + "rotate(" + rel.angle + ")";
        })
        .append("path")
        .attr("class", "relationship bubble")
        .attr("transform", function(rel) {
            return "translate("
            + rel.position.apex.x
            + ","
            + rel.position.apex.y
            + ")";
        })
        .attr("d", function(rel) { 
            if(rel.properties){
                rel.lines = rel.properties.split("\n");
                var l = rel.lines.length;
                return speechBubblePath(rel.propertiesWidth * 2, l * 50, "vertical", 10, 10);
            }
            return;
        })
        .attr("fill", "white")
        .attr("stroke", "#333333")
        .attr("stroke-width", 2);

    var propertiesR = relationships.enter()
        .append("g")
        .attr("class", "relationship properties")
        .attr("transform", function(rel) {
            if(rel.lines) {
                return "translate("
                + (rel.source.x + rel.source.radius)
                + ","
                + (rel.source.y + rel.source.radius)
                + ")" + "rotate(" + rel.angle + ")";
            } else { 
                return "";
            }
        });
    propertiesR.selectAll("text")   
        .data(function(rel) { 
            if(rel.lines){
                var list = [];
                for(var i = 0; i < rel.lines.length; i++){
                    list.push({
                        "text": rel.lines[i],
                        "x": rel.position.apex.x,
                        "y": rel.position.apex.y + (i * 50) + 40,
                        "color": rel.fill,
                        "angle": rel.angle
                    });
                }
                return list;
            } else {
                return [];
            }
        })
        .enter()
        .append("text")
        .attr("x", function(p) { return p.x; })
        .attr("y", function(p) { return p.y; })
        .attr("fill", function(p) { return p.color; })
        .attr("class", "properties")
        .attr("text-anchor", "middle")
        .attr("font-size",  "50px")
        .attr("alignment-baseline", "central")
        .text(function(p) { return p.text; });

    // Overlays
    var nodeOverlays = gOverlay.selectAll("rect.node")
        .data(diagramObj.data.nodes);
    nodeOverlays.enter()
        .append("rect")
        .attr("class", "node")
        .attr("width", function(node) { return node.radius * 2 + 4; })
        .attr("height", function(node) { return node.radius * 2 + 4; })
        .attr("x", function(node) { return node.x - 2; })
        .attr("y", function(node) { return node.y - 2; })
        .attr("rx", function(node) { return node.isRectangle ? 22 : node.radius + 2; })
        .attr("ry", function(node) { return node.isRectangle ? 22 : node.radius + 2;})
        .attr("fill", "rgba(255, 255, 255, 0)")
        .on("click", function(node, id) {
            if(tools.deleteElement) {
                deleteNode(id);
            } else if(tools.addRelationship) {
                if(addNewRel){
                    addRelationship(currentNodeId, id);
                }
                addNewRel = !addNewRel;
            } else if(tools.copyStyle) {
                updateNode({
                    isRectangle: mirrorNode.isRectangle,
                    color: mirrorNode.color,
                    fill: mirrorNode.fill
                }, id);
            } else if(!tools.addNode) {
                copyStyle(node);
                editNode(node, id);
            }
            currentNodeId = id;
        })
        .on("mouseover", function() {
            d3.select(this).attr("fill", "rgba(150, 150, 255, 0.5)");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "rgba(255, 255, 255, 0)");
        })
        .call(d3.behavior.drag()
            .on("dragstart", dragStartNode)
            .on("drag", dragNode)
            .on("dragend", dragEndNode)
        );

    gNodes.append("rect")
        .attr("class", "new-node")
        .attr("width", 100)
        .attr("height", 100)
        .attr("fill", "none");
    gRelationships.append("path")
        .attr("class", "new-relationship");
    

    var nodeRings = gOverlay.selectAll("rect.ring")
        .data(diagramObj.data.nodes);
    nodeRings.enter()
        .append("rect")
        .attr("class", "ring")
        .attr("width", function(node) { return node.radius * 2 + 12; })
        .attr("height", function(node) { return node.radius * 2 + 12; })
        .attr("x", function(node) { return node.x - 6; })
        .attr("y", function(node) { return node.y - 6; })
        .attr("rx", function(node) { return node.isRectangle ? 26 : node.radius + 6; })
        .attr("ry", function(node) { return node.isRectangle ? 26 : node.radius + 6; })
        .attr("fill", "none")
        .attr("stroke", "rgba(255, 255, 255, 0)")
        .attr("stroke-width", "8")
        .on("mouseover", function() {
            d3.select(this).attr("stroke", "rgba(150, 150, 255, 0.5)");
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "rgba(255, 255, 255, 0)");
        })
        .call(d3.behavior.drag()
            .on("dragstart", dragStartRing)
            .on("drag", dragRing)
            .on("dragend", dragEndRing)
        );

    relOverlays = gOverlay.selectAll("path.relationship")
        .data(diagramObj.data.relationships);
    relOverlays.enter()
        .append("path")
        .attr("class", "relationship")
        .attr("transform", function(rel) {
           return "translate(" + (rel.source.x + rel.source.radius) + "," + (rel.source.y + rel.source.radius) + ")" + "rotate(" + rel.angle + ")";
        })
        .attr("d", function(rel) { return rel.position.outline; })
        .attr("fill", "rgba(255, 255, 255, 0)")
        .attr("stroke-width", 5)
        .attr("stroke", "rgba(255, 255, 255, 0)")
        .on("click", function(rel, id) {
            if(tools.deleteElement){
                deleteRelationship(id);
            } else {
                currentRelId = id;
                editRel(rel);
            }
        })
        .on("mouseover", function() {
            d3.select(this).attr("stroke", "rgba(150, 150, 255, 0.5)");
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "rgba(255, 255, 255, 0)");
        });

    updateHistoryIndex();

}

render();
zoomFit();
