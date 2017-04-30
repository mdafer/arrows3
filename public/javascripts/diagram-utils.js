// Activate: Add node
$("#addNode").on("click", function() {
    changeTool(this);
});

// Add node
function addNode() {
    if(!tools.addNode){ return; }

    var node = mirrorNode;
    node.x = event.clientX - node.radius - 2;
    node.y = event.clientY - node.radius - 53;

    $.ajax({
        type: "PUT",
        url: "/diagram/add-node?diagram=" + diagramObj._id,
        data: {
            node: node
        },
        dataType: "json",
        success: function(res){     
            diagramObj.data.nodes.push(res.node);
            render();
        },
        error: function(err){
            //
        }
    });
}

// Activate: Delete node
$("#deleteElement").on('click', function() {
    changeTool(this);
});

// Delete node
function deleteNode(id){
    if(!tools.deleteElement) { return; }

    $.ajax({
        type: "DELETE",
        url: "/diagram/delete-node?id=" + id + "&diagram=" + diagramObj._id,
        dataType: "json",
        success: function(res){     
            diagramObj.data.nodes.splice(id, 1);
            render();
        },
        error: function(err){
            //
        }
    });
}


// Activate: Add relationship
$("#addRelationship").on("click", function() {
    changeTool(this);
});

function changeTool(tool) {
    var elem = $(tool);
    elem.toggleClass("active");
    tools[elem.attr("id")] = !tools[elem.attr("id")];
    elem.siblings().not(tool).each(function() {
        $(this).removeClass("active");
        tools[$(this).attr("id")] = false;
    });
}




// Get text width
function getTxtLength(text){
    var txt = svg.append("text")
        .attr("font-size",  "50px")
        .text(text);
    var size = txt.node().getComputedTextLength() / 2 + 20;
    txt.remove();

    return size;
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