/* Map of GeoJSON data from US_Cities.geojson */

//declare map var in global scope
var map;

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('mapid', {
        center: [39,-45],
        zoom: 4
    });

    //add OSM base tilelayer
     L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
    
    /*Create legend and add to map*/
    var legend = L.control({ position: "bottomleft" });

    legend.onAdd = function(map) {
        var div = L.DomUtil.create("div", "legend");
        div.innerHTML += "<h4>Legend</h4>";
        div.innerHTML += '<i style="background: rgb(135,206,235)"></i><span>Water</span><br>';
        div.innerHTML += '<i style="background: #448D40"></i><span>Forest</span><br>';
        div.innerHTML += '<i style="background: rgb(227,218,201)"></i><span>Land</span><br>';
        div.innerHTML += '<i style="background: rgb(224,255,255)"></i><span>Ice</span><br>';
        div.innerHTML += '<i style="background: rgb(225, 93, 68)"></i><span>City</span><br>';
        div.innerHTML += '<i class="icon" style="background-image: url(https://d30y9cdsu7xlg0.cloudfront.net/png/194515-200.png);background-repeat: no-repeat;"></i><span>Border</span><br>';
        return div;
        }; legend.addTo(map);
};

//Finds the minimum value of popultions
function calculateMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var city of data.features){
        //loop through each year
        for(var year = 2010; year <= 2019; year+=1){
              //get population for current year
              var value = city.properties["Pop_"+ String(year)];
              value = parseFloat(value.replace(",",""));
              console.log(value);
              //add value to array
              allValues.push(value);
        }
    }
    //get minimum value of array
    var minValue = Math.min(...allValues)
    return minValue;
}

//Calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    if (attValue >= 1){
        //constant factor adjusts symbol sizes evenly
        var minRadius = 5;
        //Flannery Apperance Compensation formula
        var radius = 0.1 * Math.pow(attValue/minValue,0.5715) * minRadius
        return radius;
    }
    else {
        var radius = 1;
        return radius;
    };
};

//Function to convert markers to circle markers and add popups
function pointToLayer(feature, latlng, attributes){
    //determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    //for each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //create marker options
    var options = {
        fillColor: "#E15D44",
        color: '#E15D44',
        weight: 10,
        opacity: 1,
        fillOpacity: 0.8
     };
    
    //give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);
    
    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    
    //build popup content string starting with city...Example 2.1 line 24
    var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p>";
    
    //add formatted attribute to popup content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Population in " + year + ":</b> " + feature.properties[attribute] + "</p>";
    
    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
          offset: new L.Point(0,-options.radius)
      });
    
    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
  };

//Creates proportional symbols using data and attributes parameters passed
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
           //access feature properties
           var props = layer.feature.properties;
           //update each feature's radius based on new attribute values
           var pop = parseFloat(props[attribute].replace(",", ""));
           var radius = calcPropRadius(pop);
            //old code: var radius = calcPropRadius(props[attribute]);
           
            layer.setRadius(radius);
           //add city to popup content string
           var popupContent = "<p><b>City:</b> " + props.City + "</p>";
           //add formatted attribute to panel content string
           var year = attribute.split("_")[1];
           popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute] + "</p>";
           //update popup with new content
           popup = layer.getPopup();
           popup.setContent(popupContent).update();
        };
    });
};

//Takes in data parameter and processes; returns attributes
function processData(data){
    //empty array to hold attributes
    var attributes = [];
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;
    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Pop") > -1){
            attributes.push(attribute);
        };
    };
    return attributes;
};

//Create new sequence controls
function createSequenceControls(attributes){
    //create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');
    //set slider attributes
    $('.range-slider').attr({
        max: 9,
        min: 0,
        value: 0,
        step: 1
    });
    //add step buttons
    $('#panel').append('<button class="step" id="reverse">Reverse</button>');
    $('#panel').append('<button class="step" id="forward">Forward</button>');
   //replace button content with images
   $('#reverse').html('<img src="img/reverse.png">');
   $('#forward').html('<img src="img/forward.png">');
   //click listener for buttons
    $('.step').click(function(){
      //get the old index value
      var index = $('.range-slider').val();

      //increment or decrement depending on button clicked
      if ($(this).attr('id') == 'forward'){
          index++;
          //if past the last attribute, wrap around to first attribute
          index = index > 9 ? 0 : index;
      } else if ($(this).attr('id') == 'reverse'){
          index--;
          //if past the first attribute, wrap around to last attribute
          index = index < 0 ? 9 : index;
      };

      //update slider
      $('.range-slider').val(index);
      //pass new attribute to update symbols
      updatePropSymbols(attributes[index]);
    });

    //input listener for slider
    $('.range-slider').on('input', function(){
      //get the new index value
      var index = $(this).val();
      //pass new attribute to update symbols
      updatePropSymbols(attributes[index]);
    });
};

//Import GeoJSON data
function getData(map){
    //load the data
    $.getJSON("data/US_Cities.geojson", function(response){
            //create an attributes array
            var attributes = processData(response);
            //calculate minimum data value
            minValue = calculateMinValue(response);
            //call function to create proportional symbols
            createPropSymbols(response, attributes);
            createSequenceControls(attributes);
    });
};

//Create the map
$(document).ready(createMap);

