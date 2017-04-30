/*
    Tools
*/
var tools = {
    addNode: false,
    addRelationship: false,
    deleteElement: false
};



/*
    SVG
*/
var svg = d3.select("#diagram")
    .append("svg")
    .attr("class", "graph")
    .on('click', addNode);

/*
    Render
*/
function render(){
    svg.selectAll("*").remove();

    // Nodes
    var gNodes = svg.append("g")
        .attr("class", "layer nodes");
    var nodes = gNodes.selectAll("rect.node")
        .data(diagramObj.data.nodes);
    nodes.enter()
        .append("rect")
        .attr("class", "node")
        .attr("width", function(node) { 
            var size = getTxtLength(node.caption);
            node.radius = size < 50 ? 50 : size;
            return node.radius * 2;
        })
        .attr("height", function(node) { return node.radius * 2; })
        .attr("x", function(node) { return node.x; })
        .attr("y", function(node) { return node.y; })
        .attr("rx", function(node) { return node.isRectangle ? 20 : node.radius; })
        .attr("ry", function(node) { return node.isRectangle ? 20 : node.radius; })
        .attr("fill", function(node) { return node.style.fill; })
        .attr("stroke", function(node) { return node.style.stroke; })
        .attr("stroke-width", function(node) { return node.style.strokeWidth; })
        .style("color", function(node) { return node.style.color; });

    // Properties
    nodes.enter()
        .append("path")
        .attr("class", "properties path")
        .attr("transform", function(node) {
            return "translate(" + (node.x + 2 * node.radius) + "," + (node.radius + node.y) + ")";
        })
        .attr("d", function(node) {
            if(node.properties.text){
                node[lines] = node.properties.text.split("\n");
                var l = node.lines.length;
                return speechBubblePath(node.properties.width * 2, l * 50, "horizontal", 10, 10);
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
                for(var i = 0; i < nodes.lines.length; i++){
                    lines.push({
                        "text": node.lines[i],
                        "x": node.x + 2 * node.radius + node.properties.width + 20,
                        "y": node.y + node.radius + (i - node.lines.length) * 25 + (i + 1) * 25,
                        "color": node.style.color
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
        .attr("font-size", "central")
        .text(function(line) { return line.text; });


    // Captions

    var gCaptions = svg.append("g")
        .attr("class", "layer captions");
    var captions = gCaptions.selectAll("text.caption")
        .data(diagramObj.data.nodes);
    captions.enter()
        .append("text")
        .attr("class", "caption")
        .attr("x", function(node) { return node.x + node.radius; })
        .attr("y", function(node) { return node.y + node.radius; })
        .attr("fill", function(node) { return node.style.color; })
        .attr("text-anchor", "middle")
        .attr("font-size", "50px")
        .attr("alignment-baseline", "central")
        .text(function(node) { return node.caption; });



    // Relationships

    var gRelationships = svg.append("g")
        .attr("class", "layer relationships");
    var relationships = gRelationships.selectAll("g.group")
        .data(diagramObj.data.relationships)
        .enter()
        .append("g")
        .attr("class", "group")
        .selectAll("path.relationship")
        .data(function(group) { return group; });

    relationships.enter()
        .append("path")
        .attr("class", "relationship")
        .attr("transform", function(rel) {
            return "translate(" + (rel.source.x + rel.source.radius) + "," + (rel.source.y + rel.source.radius) + ")" + "rotate(" + rel.angle + ")";
        })
        .attr("d", function(rel, i) {
            if(i){
                rel.position = that.curvedArrow(rel.source.radius + 12, rel.target.radius, rel.distance, i * 10, 5, 20, 20);
                rel.d = rel.position.outline;
                return rel.position.outline;
            } else {
                rel.position  = that.horizontalArrow(rel.source.radius + 12, rel.distance - rel.target.radius, 5);
                rel.d = rel.position.outline;
                return rel.position.outline;
            }
        })
        .attr("fill", function(rel) { return rel.style.fill; });



    // Overlays

    var gOverlay = svg.append("g")
        .attr("class", "layer overlay");
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
            deleteNode(id);
        })
        .on("mouseover", function() {
            d3.select(this).attr("fill", "rgba(150, 150, 255, 0.5)");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "rgba(255, 255, 255, 0)");
        });

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
        });


    var relOverlays = gOverlay.selectAll("g.group")
        .data(diagramObj.data.relationships)
        .enter()
        .append("g")
        .attr("class", "group")
        .selectAll("path.relationship")
        .data(function(group) { return group; });

    relOverlays.enter()
        .append("path")
        .attr("class", "relationship")
        .attr("transform", function(rel) {
            return "translate(" + (rel.source.x + rel.source.radius) + "," + (rel.source.y + rel.source.radius) + ")" + "rotate(" + rel.angle + ")";
        })
        .attr("d", function(rel) { return rel.d; })
        .attr("fill", "rgba(255, 255, 255, 0)")
        .attr("stroke-width", 5)
        .attr("stroke", "rgba(255, 255, 255, 0)");

}

render();