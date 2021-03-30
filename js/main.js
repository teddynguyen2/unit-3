//begin script when window loads
window.onload = setMap();

//map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on Spain
    var projection = d3.geoAlbers()
        .center([2, 51])
        .rotate([-8, 0])
        .parallels([48, 53.6])
        .scale(2500)
        .translate([width / 2, height / 2]);

	var path = d3.geoPath()
        .projection(projection);

//set up choropleth map
function setMap(){
    //use Promise.all to parallelize asynchronous data loading
    var promises = [d3.csv("data/Spain_data.csv"),
                    d3.json("data/Europe.topojson"),
                    d3.json("data/Spain_autonomous_communities.topojson")
                   ];
    Promise.all(promises).then(callback);

function callback(data){
    csvData = data[0];
    europe = data[1];
    spain = data[2];
    console.log(csvData);
            console.log(europe);
            console.log(spain);  

//translate europe TopoJSON
        var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
            spainRegions = topojson.feature(spain, spain.objects.SpainRegions).features;

//create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

//create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

//create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines

//add Europe countries to map
        var countries = map.append("path")
            .datum(europeCountries)
            .attr("class", "countries")
            .attr("d", path);

        //add Spain autonomous communities to map
        var states = map.selectAll(".regions")
            .data(spainRegions)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "states " + d.properties.NAME_1;
            })
            .attr("d", path);

	};
};

