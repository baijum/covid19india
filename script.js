var alldata = [];
var statewise = {};
var maxConfirmed = 0;
var lastUpdated = "";

var newjson = [];

$.getJSON("https://spreadsheets.google.com/feeds/cells/1nzXUdaIWC84QipdVGUKTiCSc5xntBbpMpzLm6Si33zk/ovd0hzm/public/values?alt=json",
function(result) {
    entries = result["feed"]["entry"]
    entries.forEach(function(item) {
        if (newjson[(item["gs$cell"]["row"] - 1)] == null) {
            newjson[(item["gs$cell"]["row"] - 1)] = [];
            alldata[(item["gs$cell"]["row"] - 1)] = [];
        }
        if (parseInt(item["gs$cell"]["col"]) - 1 < 2) 
        {
            if (!isNaN(item["gs$cell"]["$t"])) {
                newjson[(item["gs$cell"]["row"] - 1)][(item["gs$cell"]["col"] - 1)] = parseInt(item["gs$cell"]["$t"]);
            } else {
                newjson[(item["gs$cell"]["row"] - 1)][(item["gs$cell"]["col"] - 1)] = (item["gs$cell"]["$t"]);
            }
        }
        alldata[(item["gs$cell"]["row"] - 1)][(item["gs$cell"]["col"] - 1)] = (item["gs$cell"]["$t"]);
    });
    // alldata = newjson;
    newjson.splice(1, 1);
    maxConfirmed = alldata[2][1];
    lastUpdated = alldata[1][5];
    
    for(var i = 0; i<alldata.length;i++){
        alldata[i].splice(5,1);
    }
    alldata.forEach(function(data){
        statewise[data[0]] = data;
    });
    // console.log(newjson);
    // console.log(alldata);
    var numStatesInfected = 0;
    
    var tablehtml = "<thead>";
    for (var i = 0; i < alldata.length; i++) {
        if (i == 0) {
            tablehtml += "<tr>";
            alldata[i].forEach(function(data) {
                tablehtml += "<th>" + data + "</th>";
            });
            tablehtml += "</tr></thead><tbody>";
        } else {
            if (i == 1) {
                continue;
            }
            tempdata = Array.from(alldata[i]);
            
            tempdata.splice(0, 1);
            allzero = true;
            tempdata.forEach(function(data) {
                if (data != 0) {
                    allzero = false;
                }
            });
            if (!allzero) {
                numStatesInfected++;
                tablehtml += "<tr>";
                alldata[i].forEach(function(data) {
                    tablehtml += "<td>" + data + "</td>";
                });
                tablehtml += "</tr>";
            }
        }
    }
    tablehtml += '<tr class="totals">';
    alldata[1].forEach(function(data) {
        tablehtml += "<td>" + data + "</td>";
    });
    tablehtml += "</tr>";
    
    tablehtml += "</tbody>";
    alldata.forEach(function(item) {
        tablehtml += item[0];
    });
    // console.log(numStatesInfected);
    $("table#prefectures-table").html(tablehtml);
    $("div#states-value").html(numStatesInfected);
    $("div#confvalue").html(alldata[1][1]);
    $("div#deathsvalue").html(alldata[1][3]);
    $("div#recoveredvalue").html(alldata[1][2]);
    $("strong#last-updated").html(lastUpdated);
    
    initMapStuff();
    
});

function is_touch_device() {  
    try {  
        document.createEvent("TouchEvent");  
        return true;  
    } catch (e) {  
        return false;  
    }  
}

function initMapStuff(){
    var map = L.map('map').setView([22.5, 82], 3);
    map.setMaxBounds(map.getBounds());
    map.setView([22.5, 82], 4);
    
    if(is_touch_device()){
        map.dragging.disable();
        map.tap.disable();
    }
    
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic3VkZXZzY2hpeiIsImEiOiJjazdvbGg1ZWMwOW52M21wOWEzZzFmcWhnIn0.hN6tcoQ3uo-ha-hmki5Qew', {
    maxZoom: 6,
    minZoom: 4,
    id: 'mapbox/light-v9',
    tileSize: 512,
    zoomOffset: -1
}).addTo(map);


// control that shows state info on hover
var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

info.update = function (props) {
    if(props){
        // console.log(props);
        // this._div.innerHTML = '<h4>Confirmed cases</h4><b>' + props["NAME_1"] + ": "+statewise[props["NAME_1"]][1]+"</b>";
        this._div.innerHTML = '<h4>'+props["NAME_1"]+'</h4>'+
        '<pre>Confirmed: '+statewise[props["NAME_1"]][1]+
        '<br>Recovered: '+statewise[props["NAME_1"]][2]+
        '<br>Deaths   : '+statewise[props["NAME_1"]][3]+
        '<br>Active   : '+statewise[props["NAME_1"]][4]+"</pre>";
    }
    
};

info.addTo(map);

function style(feature) {
    // console.log(feature.properties["NAME_1"]);
    // console.log(statewise[feature.properties["NAME_1"]]);
    var n = 0
    if(statewise[feature.properties["NAME_1"]]){
        // console.log(statewise[feature.properties["NAME_1"]][1]);
        n = statewise[feature.properties["NAME_1"]][1];
    }
    
    return {
        weight: 1,
        opacity: 1,
        color: "#bfbfbf",
        // dashArray: '3',
        fillOpacity: (n/maxConfirmed)*0.8,
        // fillColor: "#000000"
        fillColor: "red"
    };
}

function highlightFeature(e) {
    geojson.resetStyle();
    info.update();
    
    var layer = e.target;
    
    layer.setStyle({
        weight: 1,
        color: '#000000',
        dashArray: '',
        // fillOpacity: 0.7
    });
    
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    
    info.update(layer.feature.properties);
}

var geojson;

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: highlightFeature
    });
}

geojson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachFeature
}).addTo(map);
}