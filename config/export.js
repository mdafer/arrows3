// Returns nodes in csv format
module.exports.csvn = function (data) {
	return parseCSV(data.nodes)
}

// Returns relationships in csv format
module.exports.csvr = function (data) {
	var d = []
	for(var g = 0; g < data.relationships.length; g++){
		d.concat(data.relationships[g])
	}
	return parseCSV(d)
}

// Parse data to csv
// works for two level deep objects
function parseCSV(data){
	if(!data.length) { return "" }
	var result, line = ""
	for(var b in data[0]){
		if(typeof data[0][b] === 'object'){
			for(var c in data[0][b]){
				if(line != "") { line += "," }
				line += b + "_" + c
			}
		} else {
			if(line != "") { line += "," }
			line += b
		}
	}
	result = line + "\r\n"
	for(var a = 0; a < data.length; a++){
		line = ""
		for(var b in data[a]){
			if(typeof data[a][b] === 'object'){
				for(var c in data[a][b]){
					if(line != "") { line += "," }
					line += data[a][b][c] === "" ? "null":data[a][b][c]
				}
			} else{
				if(line != "") { line += "," }
				line += data[a][b] === "" ? "null":data[a][b]
			}
		}
		result += line + "\r\n"
	}
	return result
}

// Returns data in cypher format
module.exports.cypher = function (data) {
	var rel = data.relationships
	var nodes = data.nodes
	var lines = []

	for(var i = 0; i < nodes.length; i++){
		lines.push("(`" + i + "`:`" + (nodes[i].caption || "Node") + "`)")

		// TODO: Properties
	}
	for(var g = 0; g < rel; g++){
		for(var i = 0; i < rel[g].length; i++){
			lines.push("(`" + rel[g][i].startNode + "`)-[:`" + (rel[g][i].type || "RELATED_TO") + "`]->(`" + rel[g][i].endNode + "`)")
		}
	}
	return lines
}

// Returns data in markup format
module.exports.markup = function (data) {
	var rel = data.relationships
	var nodes = data.nodes
	var markup = '<ul class="graph-diagram-markup">\n'

	for(var i = 0; i < nodes.length; i++){
		var props = '		<dl class="properties">\n'
		for(var line of nodes[i].properties.text.split("\n")){
			var p = line.split(":")
			if(p.length == 2){
				props += '<dt>' + p[0] + '</dt>' + 
					'<dd>' + p[1] + '</dd>\n'
			}
		}
		props += '		</dl>\n'
		markup += '	<li class="node" ' +
			'data-node-id="' + i +
			'" data-x="' + nodes[i].x +
			'" data-y="' + nodes[i].y +
			'" isrect="' + nodes[i].isRectangle +
			'" style="background-color: ' + nodes[i].style.fill +
			' color: ' + nodes[i].style.color + 
			'">\n' + (nodes[i].caption ? '\n	<span class="caption">' + nodes[i].caption + "</span>\n":"") +
			props +
			"	</li>\n"
	}
	for(var g = 0; g < rel.length; g++){
		for(var i = 0; i < rel[g]; i++){
			var props = '<dl class="properties">\n'
			for(var line of rel[g][i].properties.text.split("\n")){
				var p = line.split(":")
				if(p.length == 2){
					props += '<dt>' + p[0] + '</dt>' + 
						'<dd>' + p[1] + '</dd>\n'
				}
			}
			props += '</dl>\n'
			markup += '<li class="relationship" ' +
				'data-from="' + rel[g][i].startNode +
				'" data-to="' + rel[g][i].endNode +
				'">' + (rel[g][i].type ? '\n	<span class="type">' + rel[g][i].type + "</span>\n":"") +
				props +
				"</li>\n"
		}
	}
	markup += '</ul>'
	return markup
}