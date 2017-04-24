function changeDiagram(diagram){
  window.location.href = diagram
}

function exportSVG(){
	var svg = document.getElementsByTagName("svg")
	if(svg){
		var rawSvg = new XMLSerializer().serializeToString(svg[0])
		window.open( "data:image/svg+xmlbase64," + btoa(rawSvg) )
	}
}
