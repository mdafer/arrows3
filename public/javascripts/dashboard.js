// Set the CSRF token
var csrftoken = $("input[name='_csrf']").val();
$.ajaxSetup({
    beforeSend: function(xhr) {
        if (!this.crossDomain) {
            xhr.setRequestHeader("csrf-token", csrftoken);
        }
    }
});

// Update diagram title
function updateTitle(title, diagram){
    var modalError = $("#mainModalError");
    if(title && diagram){
        var url = "update-title?title=" + title + "&diagram=" + diagram;
        $.ajax({
            type: "PUT",
            url: url,
            dataType: "json",
            success: function(success){
                $("#diagramTitle").html(title);
                $("#" + diagram + " td:first-child").html(title);
                $('#mainModal').modal('hide');
                modalError.attr("hidden", true);
           },
            error: function(err){
                modalError.html(err.responseJSON.error);
                modalError.removeAttr("hidden");
            }
        });
    } 
}
$("#updateTitle").on("click", function(){
    var title = $("#newDiagramTitle").val();
    updateTitle(title, diagramObj._id); 
});

// Change diagram
function changeDiagram(diagram){
  window.location.href = diagram;
}
$(".change-diagram").on("click", function(){
    var diagram = $(this).attr("id");
    changeDiagram(diagram);
});

// Delete diagram
function deleteDiagram(diagram, currentDiagram){
    if(diagram){
        $.ajax({
            type: "DELETE",
            url: 'delete-diagram?diagram=' + diagram,
            dataType: "json",
            success: function(success){
                $("#" + diagram).remove();
                if(diagram === currentDiagram){
                    var d = $("#diagrams table tbody tr:first-child");
                    if(d) {
                        changeDiagram(d.attr("id"));
                    }
                }
           },
            error: function(err){
                //
            }
        });
    }
}
$(".delete-diagram").on("click", function(){
    event.stopPropagation();
    var diagram = $(this).parent().parent().attr("id");
    deleteDiagram(diagram, diagramObj._id);
});

function importCSVNodes(){
    var files = event.target.files;
    var importBtn = $("#importBtn");
    var importError = $("#importError");

    importBtn.attr("hidden", true);
    importBtn.off("click");
    importError.attr("hidden", true);

    if(files.length){
        var reader = new FileReader();
        reader.readAsText(files[0]);

        reader.onload = function(res) {
            var nodes = parseCSV(res.target.result);

            if(!nodes.length){
                importError.html('Wrong data format.');
                importError.removeAttr("hidden");
                return;
            }

            importBtn.on("click", sendParsedData);
            importBtn.removeAttr("hidden");

            function sendParsedData() {
                $.ajax({
                    type: "POST",
                    url: "import",
                    data: {
                        nodes: nodes
                    },
                    dataType: "json",
                    success: function(success){
                        changeDiagram(success.diagram);
                    },
                    error: function(err){
                        importError.html(err.responseJSON.error);
                        importError.removeAttr("hidden");
                    }
                });
            }
        };
    }
}

// Parse CSV
// Ex: style_color => style: { color: value }
// Works for two level deep objects
function parseCSV(data) {
    var parsedData = [];
    var lines = data.split("\n");
    var header = lines[0];

    header = header.split(',');
    for(var i = 1; i < lines.length; i++) {
        var line = lines[i].split(",");
        if(line.length == header.length) {
            var node = {};
            for(var j = 0; j < line.length; j++) {
                var keys = header[j].split("_");
                if(line[j] === "false"){ line[j] = false; }
                if(line[j] === "true"){ line[j] = true; }
                if(keys.length == 1){
                    if(!isNaN(line[j])){
                        line[j] = Number(line[j]);
                    }
                    node[keys[0]] = line[j] === "null" ? "":line[j];
                } else if(keys.length == 2) {
                    if(!node[keys[0]]){
                        node[keys[0]] = {};
                    }
                    if(!isNaN(line[j])){
                        line[j] = Number(line[j]);
                    }
                    node[keys[0]][keys[1]] = line[j] === "null" ? "":line[j];
                }
            }
            parsedData.push(node);
        }
    }
    return parsedData;
}

// Get import sample
function getSample(type) {
    $.ajax({
        type: "GET",
        url: "sample?type=" + type,
        dataType: "json",
        success: function(success){
            // Generate the file
            var blob = new Blob([success.sample], {type: 'text/csvcharset=utf-8'});
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', 'sample-' + type + '.csv');
            document.body.appendChild(a);
            a.click();
            a.remove();
        },
        error: function(err){
            var importError = $("#importError");
            importError.html("Something went wrong.");
            importError.removeAttr("hidden");
        }
    });
}
$("#getSample").on('click', function() {
    var type = $("#sampleType").val();
    type = type === "CSV: Nodes" ? "nodes" : type;
    getSample(type);
});


// Export SVG
function exportSVG(svg){
    if(svg){
        var rawSvg = new XMLSerializer().serializeToString(svg);
        window.open( "data:image/svg+xmlbase64," + btoa(rawSvg) );
    }
}
$("#exportSVG").on("click", function(){
    var svg = document.getElementsByTagName("svg");
    exportSVG(svg[0]);
});


