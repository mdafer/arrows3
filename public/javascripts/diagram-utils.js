function changeTool(tool) {
    var elem = $(tool);
    elem.toggleClass("active");
    tools[elem.attr("id")] = !tools[elem.attr("id")];
    elem.siblings().each(function() {
        $(this).removeClass("active");
        tools[$(this).attr("id")] = false;
    });
    $("#mirrorNode").addClass("hide");
}


// Activate: Add node
$("#addNode").on("click", function() {
    changeTool(this);
    if(tools.addNode){
        $(this).children(1).append($("#mirrorNode"));
        $("#mirrorNode")
            .css({
                "color": mirrorNode.color,
                "background-color": mirrorNode.fill,
                "border-radius": mirrorNode.isRectangle ? "4px" : "12px"
            })
            .removeClass("hide");
    }
});

// Add node
function addNodeOnClick() {
    if(!tools.addNode){ return; }

    var node = mirrorNode;
    node.x = d3.mouse(gNodes.node())[0] - 50;
    node.y = d3.mouse(gNodes.node())[1] - 50;

    addNode(node);
}
function addNode(node){
    $.ajax({
        type: "PUT",
        url: "/diagram/add-node?diagram=" + diagramObj._id,
        data: {
            node: JSON.stringify(node)
        },
        dataType: "json",
        success: function(res){     
            diagramObj.data.nodes.push(res.node);
            historyIndex++;
            render();
        },
        error: function(err){
            //
        }
    });
}

// Activate: Copy style
$("#copyStyle").on('click', function() {
    changeTool(this);
    if(tools.copyStyle){
        $(this).children(1).append($("#mirrorNode"));
        $("#mirrorNode")
            .css({
                "color": mirrorNode.color,
                "background-color": mirrorNode.fill,
                "border-radius": mirrorNode.isRectangle ? "4px" : "12px",
            })
            .removeClass("hide");
    } else {
        $("#mirrorNode").addClass("hide");
    }
});

// Update node
function updateNode(node, id) {
    $.ajax({
        type: "PUT",
        url: "/diagram/update-node?id=" + id + "&diagram=" + diagramObj._id,
        data: {
            node: JSON.stringify(node)
        },
        dataType: "json",
        success: function(resNode){
            Object.keys(resNode.node).forEach(function(key) {
                diagramObj.data.nodes[id][key] = resNode.node[key];
            });
            historyIndex++;
            //diagramObj.data.nodes[id] = resNode.node;
            render();
        },
        error: function(err){
            //
        }
    });
}

// Save node
$("#saveNode").on('click', function() {
    var node = {};
    node.caption = $("#caption").val();
    node.properties = $("#nodeProperties").val();
    node.isRectangle = $("#isRectangle").parent().hasClass("active");
    node.fill = $("#nodeFill").val();
    node.color = $("#nodeColor").val();

    node.radius = getTxtLength(node.caption);
    var longest = node.properties.split('\n')
        .reduce(function(a, b){
            return a.length > b.length ? a : b; 
        }, '');
    node.propertiesWidth = getTxtLength(longest);

    updateNode(node, currentNodeId);
    $("#editNode").addClass("hide");
});

// Open edit node sidebar
function editNode(node, id) {
    $("#editNode").removeClass("hide");
    $("#caption").val(node.caption);
    $("#nodeProperties").val(node.properties);
    node.isRectangle ? $("#isRectangle").click() : $("#isCircle").click();
    $("#nodeColor").val(node.color);
    $("#nodeColorBtn").css("color", node.color);
    $("#nodeFill").val(node.fill);
    $("#nodeFillBtn").css("background-color", node.fill);
}

// Close edit node sidebar
$("#closeEditNode").on('click', function() {
    $("#editNode").addClass("hide");
});

// Copy style
function copyStyle(node) {
    mirrorNode.isRectangle = node.isRectangle;
    mirrorNode.color = node.color;
    mirrorNode.fill = node.fill;
}

// Activate: Add relationship
$("#addRelationship").on("click", function() {
    changeTool(this);
});

// Add Relationship
function addRelationship(startNode, endNode){
    $.ajax({
        type: "PUT",
        url: "/diagram/add-relationship?diagram=" + diagramObj._id,
        data: {
            startNode: startNode,
            endNode: endNode
        },
        dataType: "json",
        success: function(res){
            diagramObj.data.relationships.push(res.rel);
            historyIndex++;
            render();
        },
        error: function(err){
            //
        }
    });
}

// Update relationship
function updateRel(rel, id) {
    $.ajax({
        type: "PUT",
        url: "/diagram/update-relationship?id=" + id + "&diagram=" + diagramObj._id,
        data: {
            rel: JSON.stringify(rel)
        },
        dataType: "json",
        success: function(resRel){
            Object.keys(resRel.rel).forEach(function(key) {
                diagramObj.data.relationships[id][key] = resRel.rel[key];
            });
            historyIndex++;
            render();
        },
        error: function(err){
            //
        }
    });
}

// Save relationship
$("#saveRel").on('click', function(){
    var rel = {};
    rel.type = $("#type").val();
    rel.properties = $("#relProperties").val();
    rel.fill = $("#relFill").val();
    var longest = rel.properties.split('\n')
        .reduce(function(a, b){
           return a.length > b.length ? a : b; 
        }, '');
    rel.propertiesWidth = getTxtLength(longest);

    updateRel(rel, currentRelId);
    $("#editRel").addClass("hide");
});

// Open edit relationship sidebar
function editRel(rel) {
    $("#editRel").removeClass("hide");
    $("#type").val(rel.type);
    $("#relProperties").val(rel.properties);
    $("#relFill").val(rel.fill);
    $("#relFillBtn").css("background-color", rel.fill);
}

// Close edit rel sidebar
$("#closeEditRel").on('click', function() {
    $("#editRel").addClass("hide");
});

// Activate: Delete node
$("#deleteElement").on('click', function() {
    changeTool(this);
});

// Delete node
function deleteNode(id){
    if(!tools.deleteElement) { return; }

    var rels = diagramObj.data.relationships.filter(function(rel){
        var res = rel.startNode != id && rel.endNode != id;
        var a = Number(rel.startNode);
        var b = Number(rel.endNode);
        var c = Number(id);
        if(a > c) { rel.startNode = a - 1; }
        if(b > c) { rel.endNode = b - 1; }
        
        return res;
    });

    $.ajax({
        type: "DELETE",
        url: "/diagram/delete-node?id=" + id + "&diagram=" + diagramObj._id,
        dataType: "json",
        success: function(res){    
            diagramObj.data.relationships = rels;
            diagramObj.data.nodes.splice(id, 1);
            historyIndex++;
            render();
        },
        error: function(err){
            //
        }
    });
}

// Delete Relationship
function deleteRelationship(id) {
    if(!tools.deleteElement) { return; }

    $.ajax({
        type: "DELETE",
        url: "/diagram/delete-relationship?id=" + id + "&diagram=" + diagramObj._id,
        dataType: "json",
        success: function(res){     
            diagramObj.data.relationships.splice(id, 1);
            historyIndex++;
            render();
        },
        error: function(err){
            //
        }
    });
}

// Undo
$("#undo").on('click', function(){
    historyIndex--;
    updateToIndex(historyIndex);
});

// Redo
$("#redo").on('click', function(){
    historyIndex++;
    updateToIndex(historyIndex);
});

function updateToIndex(index) {
    $.ajax({
        type: "PUT",
        url: "/diagram/update-to-index?index=" + index + "&diagram=" + diagramObj._id,
        dataType: "json",
        success: function(res){     
            diagramObj.data = res.data;
            render();
        },
        error: function(err){
            if(err.responseJSON.index !== undefined){
                historyIndex = Number(err.responseJSON.index);
            }
        }
    });
}

// Create branch and stay
$("#create-stay").on('click', function() {
    var title = $("#new-branch-title").val();
    createBranch(title, historyIndex, 0);
});
// Create and go to new diagram
$("#create-go").on('click', function() {
    var title = $("#new-branch-title").val();
    createBranch(title, historyIndex, 1);
});
// Create branch
function createBranch(title, index, red) {
    var url = "/diagram/create-branch?index=" + index;
    url += "&title=" + title;
    url += "&diagram=" + diagramObj._id;

    $.ajax({
        type: "POST",
        url: url,
        dataType: "json",
        success: function(res){
            if(red) { window.location.href = res.id; }
        },
        error: function(err){
            //
        }
    });
}

// Zoom in
$("#zoomIn").on('click', function() {
    diagramZoom.scale(diagramZoom.scale() * 1.2);
    zoomed();
});

// Zoom out
$("#zoomOut").on('click', function() {
    diagramZoom.scale(diagramZoom.scale() * 0.8);
    zoomed();
});

// Zoom fit
$("#zoomFit").on('click', function() {
    zoomFit();
});
function zoomFit() {
    var gNodes = d3.select("g.layer.nodes").node().getBBox();
    if (gNodes.width === 0 || gNodes.height === 0) { return; }

    var fullWidth = svg.node().clientWidth || svg.node().parentNode.clientWidth,
        fullHeight = svg.node().clientHeight || svg.node().parentNode.clientHeight;

    var midX = gNodes.x + gNodes.width / 2,
        midY = gNodes.y + gNodes.height / 2;

    var scale = 0.95 / Math.max(gNodes.width / fullWidth, gNodes.height / fullHeight);
    var tx = fullWidth / 2 - scale * midX,
        ty = fullHeight / 2 - scale * midY;

    diagramZoom.translate([tx, ty]);
    diagramZoom.scale(scale);
    zoomed();
}

// Drag nodes
var startPoint = {};
var dragStartNode = function() {
    startPoint.x = d3.event.sourceEvent.x;
    startPoint.y = d3.event.sourceEvent.y;
    d3.event.sourceEvent.stopPropagation();
};
var dragNode = function(node) {
    node.x += d3.event.dx;
    node.y += d3.event.dy;
    render();
};
var dragEndNode = function(node, id) {
    if(Math.max(Math.abs(d3.event.sourceEvent.x - startPoint.x), Math.abs(d3.event.sourceEvent.y - startPoint.y)) > 5){
        updateNode(node, id);
    }
};

// Drag ring
var closestNode;
var newNode = {};
var dragStartRing = function() {
    d3.event.sourceEvent.stopPropagation();
};
var dragRing = function(node, index) {
    closestNode = "";
    newNode.isRectangle = node.isRectangle;
    newNode.fill = node.fill;
    newNode.color = node.color;
    newNode.radius = 50;
    newNode.x = d3.mouse(this)[0] - newNode.radius;
    newNode.y = d3.mouse(this)[1] - newNode.radius;

    diagramObj.data.nodes.find(function(n, i){
        if(index != i && distanceTo(n, newNode) <= n.radius + newNode.radius){
            closestNode += i;
            newNode.x = n.x + n.radius - newNode.radius;
            newNode.y = n.y + n.radius - newNode.radius;
            return true;
        }
        return false;
    });

    if(closestNode){
        d3.select("rect.new-node")
            .attr("fill", "none")
            .attr("stroke", "none")
            .style("color", "none");
    } else {
        d3.select("rect.new-node")
            .attr("x", newNode.x)
            .attr("y", newNode.y)
            .attr("rx", node.isRectangle ? 20 : node.radius)
            .attr("ry", node.isRectangle ? 20 : node.radius)
            .attr("fill", node.fill)
            .attr("stroke", node.stroke)
            .attr("stroke-width", node.strokeWidth)
            .style("color", node.color);    
    }

    var distance = distanceTo(node, newNode) - newNode.radius - 12;
    if(distance > node.radius){
        d3.select("path.new-relationship")
            .attr("transform", 
                "translate(" 
                + (node.x + node.radius)
                + ","
                + (node.y + node.radius)
                + ")" + "rotate("
                + angleTo(newNode, node) + ")"
                )
            .attr("d", horizontalArrow(node.radius + 12, distance, 5).outline)
            .attr("fill", "#333333");           
    }
};
var dragEndRing = function(node, index){
    if(closestNode){
        addRelationship(index, closestNode);
    } else {
        Object.keys(newNode).forEach(function(key){
            mirrorNode[key] = newNode[key];
        });
        var l = diagramObj.data.nodes.length;
        addNode(mirrorNode);
        addRelationship(index, l);
    }
};

// Get text length
function getTxtLength(text){
    var txt = svg.append("text")
        .attr("font-size",  "50px")
        .text(text);
    var size = txt.node().getComputedTextLength() / 2 + 20;
    txt.remove();

    return size < 50 ? 50 : size;
}

// Properties path
function speechBubblePath(width, height, style, margin, padding) {
    var styles = {
        diagonal: [
            "M", 0, 0,
            "L", margin + padding, margin,
            "L", margin + width + padding, margin,
            "A", padding, padding, 0, 0, 1, margin + width + padding * 2, margin + padding,
            "L", margin + width + padding * 2, margin + height + padding,
            "A", padding, padding, 0, 0, 1, margin + width + padding, margin + height + padding * 2,
            "L", margin + padding, margin + height + padding * 2,
            "A", padding, padding, 0, 0, 1, margin, margin + height + padding,
            "L", margin, margin + padding,
            "Z"
        ],
        horizontal: [
            "M", 0, 0,
            "L", margin, -padding,
            "L", margin, -height / 2,
            "A", padding, padding, 0, 0, 1, margin + padding, -height / 2 - padding,
            "L", margin + width + padding, -height / 2 - padding,
            "A", padding, padding, 0, 0, 1, margin + width + padding * 2, -height / 2,
            "L", margin + width + padding * 2, height / 2,
            "A", padding, padding, 0, 0, 1, margin + width + padding, height / 2 + padding,
            "L", margin + padding, height / 2 + padding,
            "A", padding, padding, 0, 0, 1, margin, height / 2,
            "L", margin, padding,
            "Z"
        ],
        vertical: [
            "M", 0, 0,
            "L", -padding, margin,
            "L", -width / 2, margin,
            "A", padding, padding, 0, 0, 0, -width / 2 - padding, margin + padding,
            "L", -width / 2 - padding, margin + height + padding,
            "A", padding, padding, 0, 0, 0, -width / 2, margin + height + padding * 2,
            "L", width / 2, margin + height + padding * 2,
            "A", padding, padding, 0, 0, 0, width / 2 + padding, margin + height + padding,
            "L", width / 2 + padding, margin + padding,
            "A", padding, padding, 0, 0, 0, width / 2, margin,
            "L", padding, margin,
            "Z"
        ]
    };
    return styles[style].join(" ");
}

function createGroupRel(){
    var groupRel = [];
    var len = diagramObj.data.nodes.length;
    for(var i = 0; i < len; i++){
        groupRel.push([]);
        for(var j = 0; j < len; j++){
            groupRel[i].push(0);
        }
    }
    return groupRel;
}

function angleTo(source, target) {
    var dx = (source.x + source.radius) - (target.x + target.radius);
    var dy = (source.y + source.radius) - (target.y + target.radius);

    return Math.atan2(dy, dx) * 180 / Math.PI;
}

function distanceTo(source, target) {
    var dx = (source.x + source.radius) - (target.x + target.radius);
    var dy = (source.y + source.radius) - (target.y + target.radius);

    return Math.sqrt(dx * dx + dy * dy);
}

function horizontalArrow(start, end, arrowWidth) {
    var shaftRadius = arrowWidth / 2;
    var headRadius = arrowWidth * 2;
    var headLength = headRadius * 2;
    var shoulder = start < end ? end - headLength : end + headLength;
    return {
        outline: [
            "M", start, shaftRadius,
            "L", shoulder, shaftRadius,
            "L", shoulder, headRadius,
            "L", end, 0,
            "L", shoulder, -headRadius,
            "L", shoulder, -shaftRadius,
            "L", start, -shaftRadius,
            "Z"
        ].join(" "),
        apex: {
            "x": start + (shoulder - start) / 2,
            "y": 0
        }
    };
}


function curvedArrow(startRadius, endRadius, endCentre, minOffset, arrowWidth, headWidth, headLength){
    var startAttach, endAttach, offsetAngle;

    function square(l){ return l * l; }

    var radiusRatio = startRadius / (endRadius + headLength);
    var homotheticCenter = -endCentre * radiusRatio / (1 - radiusRatio);

    function intersectWithOtherCircle(fixedPoint, radius, xCenter, polarity){
        var gradient = fixedPoint.y / (fixedPoint.x - homotheticCenter);
        var hc = fixedPoint.y - gradient * fixedPoint.x;

        var A = 1 + square(gradient);
        var B = 2 * (gradient * hc - xCenter);
        var C = square(hc) + square(xCenter) - square(radius);

        var intersection = { "x": (-B + polarity * Math.sqrt( square( B ) - 4 * A * C )) / (2 * A) };
        intersection["y"] = (intersection.x - homotheticCenter) * gradient;

        return intersection;
    }

    if(endRadius + headLength > startRadius){
        offsetAngle = minOffset / startRadius;
        startAttach = {
            x: Math.cos( offsetAngle ) * (startRadius),
            y: Math.sin( offsetAngle ) * (startRadius)
        };
        endAttach = intersectWithOtherCircle( startAttach, endRadius + headLength, endCentre, -1 );
    } else {
        offsetAngle = minOffset / endRadius;
        endAttach = {
            x: endCentre - Math.cos( offsetAngle ) * (endRadius + headLength),
            y: Math.sin( offsetAngle ) * (endRadius + headLength)
        };
        startAttach = intersectWithOtherCircle( endAttach, startRadius, 0, 1 );
    }

    var
        g1 = -startAttach.x / startAttach.y,
        c1 = startAttach.y + (square( startAttach.x ) / startAttach.y),
        g2 = -(endAttach.x - endCentre) / endAttach.y,
        c2 = endAttach.y + (endAttach.x - endCentre) * endAttach.x / endAttach.y;

    var cx = ( c1 - c2 ) / (g2 - g1);
    var cy = g1 * cx + c1;

    var arcRadius = Math.sqrt(square(cx - startAttach.x) + square(cy - startAttach.y));

    function startTangent(dr){
        var dx = (dr < 0 ? -1 : 1) * Math.sqrt(square(dr) / (1 + square(g1)));
        var dy = g1 * dx;
        return [
            startAttach.x + dx,
            startAttach.y + dy
        ].join(",");
    }

    function endTangent(dr){
        var dx = (dr < 0 ? -1 : 1) * Math.sqrt(square(dr) / (1 + square(g2)));
        var dy = g2 * dx;
        return [
            endAttach.x + dx,
            endAttach.y + dy
        ].join(",");
    }

    function endNormal(dc){
        var dx = (dc < 0 ? -1 : 1) * Math.sqrt(square(dc) / (1 + square(1 / g2)));
        var dy = dx / g2;
        return [
            endAttach.x + dx,
            endAttach.y - dy
        ].join(",");
    }

    var shaftRadius = arrowWidth / 2;
    var headRadius = headWidth / 2;

    return {
        outline: [
            "M", startTangent(-shaftRadius),
            "L", startTangent(shaftRadius),
            "A", arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, minOffset > 0 ? 0 : 1, endTangent(-shaftRadius),
            "L", endTangent(-headRadius),
            "L", endNormal(headLength),
            "L", endTangent(headRadius),
            "L", endTangent(shaftRadius),
            "A", arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, minOffset < 0 ? 0 : 1, startTangent(-shaftRadius)
        ].join( " " ),
        apex: {
            "x": cx,
            "y": cy > 0 ? cy - arcRadius : cy + arcRadius
        }
    };
}