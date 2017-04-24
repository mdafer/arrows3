var button = document.getElementById("csv")

if(button) {
	var data = document.getElementById("code").innerHTML
	var blob = new Blob([data],{type: 'text/csvcharset=utf-8'})
	var url = URL.createObjectURL(blob)
	button.setAttribute("href", url)
}