// Returns nodes in csv format
module.exports.csvn = function (data) {
    return parseCSV(data.nodes);
};

// Returns relationships in csv format
module.exports.csvr = function (data) {
    var d = [];
    for (var g = 0; g < data.relationships.length; g += 1) {
        d.concat(data.relationships[g]);
    }
    return parseCSV(d);
};

// Parse data to csv
function parseCSV(data) {
    if (!data.length) {
        return "";
    }
    var result = "", line, head;
    head = Object.keys(data[0]).sort();
    result = head.toString() + "\n";
    for (var i = 0; i < data.length; i += 1) {
        line = "";
        head.map(function (key) {
            if (line !== "") {
                line += ",";
            }
            line += data[i][key] === "" ? "null" : data[i][key];
        });
        result += line;
        result += "\n";
    }
    return result;
}

// Returns data in cypher format
module.exports.cypher = function (data) {
    var rel = data.relationships;
    var nodes = data.nodes;
    var lines = [];

    for (var i = 0; i < nodes.length; i += 1){
        lines.push("(`" + i + "`:`" + (nodes[i].caption || "Node") + "`)");

        // TODO: Properties
    }
    for (var g = 0; g < rel; g += 1) {
        for (var i = 0; i < rel[g].length; i += 1) {
            lines.push("(`" + rel[g][i].startNode + "`)-[:`" + (rel[g][i].type || "RELATED_TO") + "`]->(`" + rel[g][i].endNode + "`)");
        }
    }
    return lines;
};

// Returns data in markup format
module.exports.markup = function (data) {
    var rel = data.relationships;
    var nodes = data.nodes;
    var markup = '<ul class="graph-diagram-markup">\n';
    var props, p, text;

    for(var i = 0; i < nodes.length; i += 1){
        props = '       <dl class="properties">\n';
        text = nodes[i].properties.split("\n");
        for(var j = 0; j < text.length; j += 1){
            p = text[j].split(":");
            if(p.length == 2){
                props += '<dt>' + p[0] + '</dt>' + '<dd>' + p[1] + '</dd>\n';
            }
        }
        props += '      </dl>\n';
        markup += ' <li class="node" '
            + 'data-node-id="' + i
            + '" data-x="' + nodes[i].x
            + '" data-y="' + nodes[i].y
            + '" isrect="' + nodes[i].isRectangle
            + '" style="background-color: ' + nodes[i].fill
            + '; color: ' + nodes[i].color
            + '">\n' + (nodes[i].caption ? '\n  <span class="caption">' + nodes[i].caption + "</span>\n":"")
            + props + " </li>\n";
    }
    for(var g = 0; g < rel.length; g += 1){
        for(var i = 0; i < rel[g]; i += 1){
            props = '<dl class="properties">\n';
            text = rel[g][i].properties.split("\n");
            for(var j = 0; j < text.length; j += 1){
                p = text[j].split(":");
                if(p.length == 2){
                    props += '<dt>' + p[0] + '</dt>' + '<dd>' + p[1] + '</dd>\n';
                }
            }
            props += '</dl>\n';
            markup += '<li class="relationship" '
                + 'data-from="' + rel[g][i].startNode
                + '" data-to="' + rel[g][i].endNode
                + '">' + (rel[g][i].type ? '\n  <span class="type">' + rel[g][i].type + "</span>\n":"")
                + props + "</li>\n";
        }
    }
    markup += '</ul>';
    return markup;
};