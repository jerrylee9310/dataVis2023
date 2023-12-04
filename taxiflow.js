// // check the d3 & leaflet is loaded well
console.log(d3);
console.log(L);

// Add Leaflet map
// const map = L.map('map').setView([20, -160], 4); 
var map = L.map('map', {
  center: [39.9, 116.4], // beijing
  zoom: 10,
  dragging: false,
  // scrollWheelZoom: "center",
});

// map type
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
}).addTo(map);


// Add an svg layer to the Leaflet map
const svgLayer = L.svg().addTo(map);
const svg = d3.select("#map").select("svg")
const g = svg.select("g");


// load data
d3.csv("./data/taxi.csv").then(data => {
  // check the data is loaded well
  // console.log(data);

  // // convert time to Date object
  data.forEach(d => d.before_time = new Date(d.before_time + "Z"));
  data.forEach(d => d.after_time = new Date(d.after_time + "Z"));

  // get unique dates from the data
  const startDates = 
  [...new Set(data.map(d => d.before_time.toISOString().split("T")[0]))];
  const endDates = 
  [...new Set(data.map(d => d.after_time.toISOString().split("T")[0]))];

  // add unique dates to date menu
  d3.select("#startDateDropdown") 
  .selectAll("option") 
  .data(startDates) 
  .join("option") 
  .attr("value", d => d) 
  .text(d => d);
  // // add unique dates to dropdown menu
  // d3.select("#endDateDropdown") 
  // .selectAll("option") 
  // .data(startDates) 
  // .join("option") 
  // .attr("value", d => d) 
  // .text(d => d);

  // get unique times for time menu
  const uniqueBeforeHours = [...Array(24).keys()]

  // add unique times to dropdown menu
  d3.select('#starttimeDropdown')
  .selectAll("option")
  .data(uniqueBeforeHours)
  .join("option")
  .attr("value", d => d) 
  .text(d => d)

  const uniqueAfterHours = Array.from({length: 24}, (_, i) => i + 1)
  // add unique times to dropdown menu
  d3.select('#endtimeDropdown')
  .selectAll("option")
  .data(uniqueAfterHours)
  .join("option")
  .attr("value", d => d) 
  .text(d => d)

  var clicked_retangle_row = -1;
  var clicked_retangle_col = -1;

  // make a grid
  function drawGrid(filteredData, isSliderUpdate, callback) {
    const latStart = 39.6;
    const latEnd = 40.4;
    const longStart = 116;
    const longEnd = 117.13;
    const rows = 20; // number of grid row
    const cols = 20; // number of grid col
  
    const latStep = (latEnd - latStart) / rows;
    const longStep = (longEnd - longStart) / cols;
  
    let outgoingData = [];
    let incomingData = [];
    
    // Arrays to store the count of points in each grid
    const outgoingCount = Array(rows).fill(0).map(() => Array(cols).fill(0));
    const incomingCount = Array(rows).fill(0).map(() => Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const rectangle = L.rectangle(
          [
            [latStart + i * latStep, longStart + j * longStep],
            [latStart + (i + 1) * latStep, longStart + (j + 1) * longStep],
          ],
          { 
            color: 'black',   // Outline color
            fillColor: 'transparent',  // Fill color (transparent)
            fillOpacity: 0,    // Set fill opacity to 0 for full transparency
            weight: 1           // Outline weight  
          }
        ).addTo(map);
  
        const latRange = [
          latStart + i * latStep,
          latStart + (i + 1) * latStep,
        ];
        const longRange = [
          longStart + j * longStep,
          longStart + (j + 1) * longStep,
        ];

        function updateInOut() {
          console.log("clicked rectangglw row ", clicked_retangle_row);
          console.log("i", i);
          console.log("isSlider", isSliderUpdate);
          if(clicked_retangle_row == i && clicked_retangle_col == j && !isSliderUpdate) {
            outgoingData = [];
            incomingData = [];

            // Update the counts
            outgoingCount[i][j] = 0
            incomingCount[i][j] = 0;
            callback({outgoingData,incomingData,outgoingCount,incomingCount});
            console.log("clicked rectangel");

            clicked_retangle_row = -1; 
            clicked_retangle_col = -1;
            return
          }
          // Filter filteredData based on the clicked grid
          outgoingData = filteredData.filter(
            (d) =>
              d.before_lat >= latRange[0] &&
              d.before_lat <= latRange[1] &&
              d.before_long >= longRange[0] &&
              d.before_long <= longRange[1]
          );
  
          incomingData = filteredData.filter(
            (d) =>
              d.after_lat >= latRange[0] &&
              d.after_lat <= latRange[1] &&
              d.after_long >= longRange[0] &&
              d.after_long <= longRange[1]
          );
          console.log(latRange, longRange)
          // console.log("Outgoing Data in Grid:", outgoingData);
          // console.log("Incoming Data in Grid:", incomingData);
            
          
          // Update the counts
          outgoingCount[i][j] = outgoingData.length;
          incomingCount[i][j] = incomingData.length;
          
          // set clicked rectangle
          clicked_retangle_row = i;
          clicked_retangle_col = j;
          // Invoke the callback function with the data
          callback({ outgoingData, incomingData, outgoingCount, incomingCount });
        }
        // Add a click event listener to the rectangle
        rectangle.on("click", function(){
          isSliderUpdate = false;
          updateInOut();
        });

        // update inout flow when slider update
        if(clicked_retangle_row == i && clicked_retangle_col == j && isSliderUpdate) {
          console.log("update slider inout", clicked_retangle_row);
          updateInOut();
        }

      }
    }
  }


  // slider
  var slider = document.getElementById("timeslider");
  var output = document.getElementById("timevalue");
  output.innerHTML = slider.value +":00-"+(parseInt(slider.value)+1)+":00";
  
  slider.oninput = function() {
    output.innerHTML = this.value +":00-"+(parseInt(this.value)+1)+":00";
    updateVisualization(true);
    console.log("sliderupdate", this.value);
  }

  // Main visulizaition 
  function updateVisualization(isSliderUpdate) {
    // get filtered data
    const startDateDropdown = d3.select("#startDateDropdown");
    const startTime = parseInt(slider.value);

    const selectedStartDateTime = new Date(startDateDropdown.node().value);
    selectedStartDateTime.setHours(startTime);
    const selectedEndDateTime = new Date(startDateDropdown.node().value);
    selectedEndDateTime.setHours(startTime+1);
    
    const filteredData = data.filter(d => 
      d.before_time > selectedStartDateTime &&
      d.after_time < selectedEndDateTime
    );
    
    // all points
    g.selectAll('.all-circle')
    .data(filteredData)
    .join('circle')
    .attr('class', 'all-circle')
    .attr('cx', d => map.latLngToLayerPoint({ lat: +d.before_lat, lng: +d.before_long }).x)
    .attr('cy', d => map.latLngToLayerPoint({ lat: +d.before_lat, lng: +d.before_long }).y)
    .attr('r', 3)
    .attr('fill', 'grey') // Set the fill color to grey
    .attr('opacity', 0.1); // Adjust opacity as needed

    // taxi data in given time interval
    // console.log(filteredData);

    // Draw the grid and pass a callback function
    drawGrid(filteredData, isSliderUpdate, function (gridData) {
      const { outgoingData, incomingData, outgoingCount, incomingCount } = gridData;
      console.log("Received Outgoing Data:", outgoingData);
      console.log("Received Incoming Data:", incomingData);
  
      // Use outgoingCount and incomingCount to determine color intensity and update grid colors
      updateGridColors(outgoingCount, incomingCount);

      // draw a data points as a circle
      g.selectAll('.incoming-circle')
      .data(incomingData)
      .join('circle')
      .attr('class', 'incoming-circle')
      .attr('cx', d => map.latLngToLayerPoint({lat: +d.before_lat, lng: +d.before_long}).x)
      .attr('cy', d => map.latLngToLayerPoint({lat: +d.before_lat, lng: +d.before_long}).y)
      .attr('r', 3)
      .attr('fill', 'blue')
      .attr('opacity', 0.2);

      g.selectAll('.outgoing-circle')
      .data(outgoingData)
      .join('circle')
      .attr('class', 'outgoing-circle')
      .attr('cx', d => map.latLngToLayerPoint({lat: +d.after_lat, lng: +d.after_long}).x)
      .attr('cy', d => map.latLngToLayerPoint({lat: +d.after_lat, lng: +d.after_long}).y)
      .attr('r', 3)
      .attr('fill', 'red')
      .attr('opacity', 0.2);
      
    });

    
  }
    
    // update grid depending on zoom
    function updateGridColors(outgoingCount, incomingCount) {
      // Find the maximum count for both outgoing and incoming data
      const maxOutgoingCount = Math.max(...outgoingCount.map(row => Math.max(...row)));
      const maxIncomingCount = Math.max(...incomingCount.map(row => Math.max(...row)));
    
      const latStart = 39.6;
      const longStart = 116;
      const latStep = (40.4 - 39.6) / 20;
      const longStep = (117.13 - 116) / 20;
    
      // Update grid colors based on counts
      for (let i = 0; i < outgoingCount.length; i++) {
        for (let j = 0; j < outgoingCount[i].length; j++) {
          const colorIntensityOutgoing = outgoingCount[i][j] / maxOutgoingCount;
          const colorIntensityIncoming = incomingCount[i][j] / maxIncomingCount;
    
          // Calculate the color based on intensity (e.g., red for outgoing, blue for incoming)
          const colorOutgoing = `rgb(255, ${Math.round(255 * (1 - colorIntensityOutgoing))}, ${Math.round(255 * (1 - colorIntensityOutgoing))})`;
          const colorIncoming = `rgb(${Math.round(255 * (1 - colorIntensityIncoming))}, ${Math.round(255 * (1 - colorIntensityIncoming))}, 255)`;
          
          // Update the color of the rectangle
          const rectangle = map.getPane('overlayPane').querySelector(`.leaflet-interactive:nth-child(${i * 20 + j + 1})`);
          rectangle.style.fill = colorOutgoing; // Set color for outgoing data
          rectangle.style.stroke = colorIncoming; // Set color for incoming data
        }
      }
    }

  // update position of circles
  function updateCircles() {
    g.selectAll('circle')
      .attr('cx', d => map.latLngToLayerPoint({lat: +d.before_lat, lng: +d.before_long}).x)
      .attr('cy', d => map.latLngToLayerPoint({lat: +d.before_lat, lng: +d.before_long}).y);
  }

  // 
  updateVisualization(false);
  d3.select("#startDateDropdown").on("change", updateVisualization);
  d3.select("#")
  map.on('moveend', updateCircles);
})