import {map, updateCircles, updateVisualization, getETA, clearAll} from "./elements.js"

// // check the d3 & leaflet is loaded well
console.log(d3);
console.log(L);


// map type
L.tileLayer(
  'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}',
  {
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png',
  }
).addTo(map);

// slider
var slider = document.getElementById('timeslider');
var output = document.getElementById('timevalue');

function initializeSlider(data){
  output.innerHTML =
    slider.value + ':00-' + (parseInt(slider.value) + 1) + ':00';

  slider.oninput = function () {
    output.innerHTML = this.value + ':00-' + (parseInt(this.value) + 1) + ':00';
    updateVisualization(data, true);
    console.log('sliderupdate', this.value);
  };
}

// update eta & clear
var eta = document.getElementById('eta');
var clear = document.getElementById('clear');
function initializeButton(data){
  eta.onclick = function() { getETA(data); }
  clear.onclick = function() { clearAll();}
}

// load data
d3.csv('./data/taxi.csv').then((data) => {
  // check the data is loaded well
  // console.log(data);

  // // convert time to Date object
  data.forEach((d) => (d.before_time = new Date(d.before_time + 'Z')));
  data.forEach((d) => (d.after_time = new Date(d.after_time + 'Z')));

  // get unique dates from the data
  const startDates = [
    ...new Set(data.map((d) => d.before_time.toISOString().split('T')[0])),
  ];

  // add unique dates to date menu
  d3.select('#startDateDropdown')
    .selectAll('option')
    .data(startDates)
    .join('option')
    .attr('value', (d) => d)
    .text((d) => d);
  
  // initialize slider, button
  initializeSlider(data);
  initializeButton(data);

  //
  updateVisualization(data, false);
  d3.select('#startDateDropdown').on('change', function (){updateVisualization(data, false);});
  // d3.select('#');
  map.on('moveend', updateCircles);
});
