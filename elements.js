

export var map = L.map('map', {
    // center: [39.9, 116.4], // beijing
    center: [40,116.565],
    zoom: 10,
    dragging: false,
    scrollWheelZoom: false,
});

// Add an svg layer to the Leaflet map
const svgLayer = L.svg().addTo(map);
const svg = d3.select('#map').select('svg');
const g = svg.select('g');


  // add unique times to dropdown menu
var clicked_retangle = [-1.0, -1.0];
var rectangle_list = [];

export function clearAll(){
    clicked_retangle = [-1.0, -1.0];

    var start_row_output = document.getElementById("start_lat_value");
    var start_col_output = document.getElementById("start_long_value");
    var end_row_output = document.getElementById("end_lat_value");
    var end_col_output = document.getElementById("end_long_value");
    start_row_output.innerHTML = null;
    start_col_output.innerHTML = null;
    end_row_output.innerHTML = null;
    end_col_output.innerHTML = null;

    rectangle_list.forEach(rect => {rect.remove()});
    rectangle_list = [];

}

export function getETA(data){

    var slider = document.getElementById('timeslider');
    const latStart = 39.6;
    const latEnd = 40.4;
    const longStart = 116;
    const longEnd = 117.13;

    const latStep = (latEnd - latStart) / 20;
    const longStep = (longEnd - longStart) / 20;

    // get filtered data
    const startDateDropdown = d3.select('#startDateDropdown');
    const startTime = parseInt(slider.value);

    const selectedStartDateTime = new Date(startDateDropdown.node().value);
    selectedStartDateTime.setHours(startTime);
    const selectedStartEndDateTime = new Date(startDateDropdown.node().value);
    selectedStartEndDateTime.setHours(startTime + 1);
    const selectedEndDateTime = new Date(startDateDropdown.node().value);
    selectedEndDateTime.setHours(startTime + 3);


    // get start taxis
    var start_row = parseInt(document.getElementById('start_lat_value').innerText);
    var start_col = parseInt(document.getElementById('start_long_value').innerText);
    
    const startlatRange = [latStart + start_row * latStep, latStart + (start_row + 1) * latStep];
    const startlongRange = [
      longStart + start_col * longStep,
      longStart + (start_col + 1) * longStep,
    ];

    const startfilteredData = data.filter(
        (d) =>
        d.before_time > selectedStartDateTime &&
        d.after_time < selectedStartEndDateTime &&
        d.before_lat >= startlatRange[0] &&
        d.before_lat <= startlatRange[1] &&
        d.before_long >= startlongRange[0] &&
        d.before_long <= startlongRange[1]
    );

    var startTaxis = [];
    startfilteredData.forEach(d => {
        if(!startTaxis.includes(d.id)) startTaxis.push(d.id);
    });

    // get end taxis
    var end_row = parseInt(document.getElementById('end_lat_value').innerText);
    var end_col = parseInt(document.getElementById('end_long_value').innerText);
    
    const endlatRange = [latStart + end_row * latStep, latStart + (end_row + 1) * latStep];
    const endlongRange = [longStart + end_col * longStep,longStart + (end_col + 1) * longStep];

    const endfilteredData = data.filter(
        (d) =>
        d.before_time > selectedStartDateTime &&
        d.after_time < selectedEndDateTime &&
        d.before_lat >= endlatRange[0] &&
        d.before_lat <= endlatRange[1] &&
        d.before_long >= endlongRange[0] &&
        d.before_long <= endlongRange[1] &&
        startTaxis.includes(d.id)
    );

    console.log("end taxis", endfilteredData);

    var estimatedTimes = 0;
    var endTaxis = [];
    endfilteredData.forEach(d => {
        if(endTaxis.includes(d.id)) return;
        
        endTaxis.push(d.id);
        var lastStartTaxi = startfilteredData.filter((d_s) => d_s.id == d.id).pop();
        var firstEndTaxi = endfilteredData.filter((d_e) => d_e.id == d.id)[0];
        console.log("start tzxi", lastStartTaxi);
        console.log("endtzxi", firstEndTaxi);



        var estimatedTime = firstEndTaxi.before_time - lastStartTaxi.before_time;
        console.log("estimatedtime :", estimatedTime);
        estimatedTimes += estimatedTime;
    });

    var output = document.getElementById('eta_value');
    if(estimatedTimes == 0) {
        output.innerHTML = 'No data';
        return
    }

    estimatedTimes = (estimatedTimes/endTaxis.length)/60000.0
    var estimatedH = (estimatedTimes/60).toFixed();
    var estimatedM = (estimatedTimes-(estimatedH*60)).toFixed();

    var output = document.getElementById('eta_value');
    output.innerHTML = estimatedH + 'hours '+ estimatedM + 'minutes';

}

  // update position of circles
  export function updateCircles() {
    g.selectAll('circle')
      .attr(
        'cx',
        (d) =>
          map.latLngToLayerPoint({ lat: +d.before_lat, lng: +d.before_long }).x
      )
      .attr(
        'cy',
        (d) =>
          map.latLngToLayerPoint({ lat: +d.before_lat, lng: +d.before_long }).y
      );
}

// Main visulizaition
export function updateVisualization(data, isSliderUpdate) {
    console.log("update visualdifs");

    // Draw the grid and pass a callback function
    drawGrid(data, isSliderUpdate, drawInOut);
}

// make a grid
function drawGrid(data, isSliderUpdate, callback) {
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

    var timeFilteredData = getTimeFilteredData(data);
    console.log("clicked rec", clicked_retangle[0])

    // Arrays to store the count of points in each grid
    const outgoingCount = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0));
    const incomingCount = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const rectangle = L.rectangle(
          [
            [latStart + i * latStep, longStart + j * longStep],
            [latStart + (i + 1) * latStep, longStart + (j + 1) * longStep],
          ],
          {
            color: 'black', // Outline color
            fillColor: 'transparent', // Fill color (transparent)
            fillOpacity: 0, // Set fill opacity to 0 for full transparency
            weight: 1, // Outline weight
          }
        ).addTo(map);

        const latRange = [latStart + i * latStep, latStart + (i + 1) * latStep];
        const longRange = [
          longStart + j * longStep,
          longStart + (j + 1) * longStep,
        ];

        function updateInOut() {
          // Filter filteredData based on the clicked grid
          outgoingData = timeFilteredData.filter(
            (d) =>
              d.before_lat >= latRange[0] &&
              d.before_lat <= latRange[1] &&
              d.before_long >= longRange[0] &&
              d.before_long <= longRange[1]
          );

          incomingData = timeFilteredData.filter(
            (d) =>
              d.after_lat >= latRange[0] &&
              d.after_lat <= latRange[1] &&
              d.after_long >= longRange[0] &&
              d.after_long <= longRange[1]
          );
          console.log(latRange, longRange);
          // console.log("Outgoing Data in Grid:", outgoingData);
          // console.log("Incoming Data in Grid:", incomingData);

          // Update the counts
          outgoingCount[i][j] = outgoingData.length;
          incomingCount[i][j] = incomingData.length;

          // set clicked rectangle
          clicked_retangle = [i,j];
          // Invoke the callback function with the data
          callback({ outgoingData, incomingData, outgoingCount, incomingCount });
        }

        function drawBarChart(){
            let filteredGridData = getGridFilteredData(data, latRange, longRange);
    
            let hourlyIdCounts = Array.from({ length: 24 }, () => new Set());
            filteredGridData.forEach((d) => {
            let hour = d.before_time.getHours();
            hourlyIdCounts[hour].add(d.id);
            });

            let barChartData = hourlyIdCounts.map((ids, hour) => ({
            hour,
            count: ids.size,
            }));
            console.log(barChartData);

            // 바 차트 생성
            createBarChart(barChartData);
        }

        // Add a click event listener to the rectangle
        rectangle.on('click', function () {
            console.log("clicked, ", clicked_retangle.toString());
            if(clicked_retangle.toString() == [-1,-1].toString()){
                var row_output = document.getElementById("start_lat_value");
                var col_output = document.getElementById("start_long_value");
                rectangle_list.push(color_grid(i,j,'red'));
            }
            else{
                var row_output = document.getElementById("end_lat_value");
                var col_output = document.getElementById("end_long_value");
                if(rectangle_list.length > 1) rectangle_list.pop().remove();
                rectangle_list.push(color_grid(i,j,'blue'));
            }
            row_output.innerHTML = i;
            col_output.innerHTML = j;

            isSliderUpdate = false;
            updateInOut();
            drawBarChart();
        });

        // update inout flow when slider update
        if(clicked_retangle.toString() == [i,j].toString() && isSliderUpdate) {
            console.log("is slider update!!!");
            updateInOut();
        }
      }
    }
  }

  function color_grid(row, col, color){
    const latStart = 39.6;
    const longStart = 116;
    const latStep = (40.4 - 39.6) / 20;
    const longStep = (117.13 - 116) / 20;

    const rectangle = L.rectangle(
      [
        [latStart + row * latStep, longStart + col * longStep],
        [latStart + (row + 1) * latStep, longStart + (col + 1) * longStep],
      ],
      {
        color: color, // Outline color
        fillColor: 'transparent', // Fill color (transparent)
        fillOpacity: 0, // Set fill opacity to 0 for full transparency
        weight: 5, // Outline weight
      }
    ).addTo(map);

    return rectangle
  }

  // barchart
function createBarChart(data) {
    // 바 차트를 표시할 div 요소 생성
    // SVG의 전체 크기와 차트의 여백 설정
    let margin = { top: 20, right: 20, bottom: 50, left: 40 };
    let width = 450 - margin.left - margin.right;
    let height = 300 - margin.top - margin.bottom;

    // barChartDiv 설정은 동일하게 유지
    let barChartDiv = d3
      .select('#map')
      .append('div')
      .attr('class', 'bar-chart')
      .style('position', 'absolute')
      .style('right', '10px')
      .style('top', '10px')
      .style('width', '450px')
      .style('height', '300px')
      .style('background-color', 'white')
      .style('border', '1px solid black')
      .style('z-index', '1000');

    // SVG 크기를 조정
    let svg = barChartDiv
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // x축 스케일 설정
    let xScale = d3
      .scaleBand()
      .range([0, width])
      .domain(data.map((d) => d.hour))
      .padding(0.1);

    // y축 스케일 설정
    let yScale = d3
      .scaleLinear()
      .range([height, 0])
      .domain([
        0,
        d3.max(data, (d) => d.count) > 0 ? d3.max(data, (d) => d.count) : 10,
      ]);

    // 바 차트 그리기
    svg
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.hour))
      .attr('y', (d) => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => height - yScale(d.count))
      .attr('fill', '#4e79a7') // 변경된 색상
      .attr('stroke', 'black') // 테두리 색상 추가
      .attr('stroke-width', 1); // 테두리 두께 추가

    // 축 스타일링
    svg
      .selectAll('.axis path, .axis line')
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('shape-rendering', 'crispEdges');

    svg
      .selectAll('.axis text')
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px');
    // x축 추가
    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(xScale));

    svg
      .append('text')
      .attr(
        'transform',
        'translate(' + width / 2 + ' ,' + (height + margin.top + 20) + ')'
      )
      .style('text-anchor', 'middle')
      .text('Hour'); // 여기에 원하는 x축 제목을 입력

    // y축 추가
    svg.append('g').call(d3.axisLeft(yScale));

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Number of Taxi'); // 여기에 원하는 y축 제목을 입력

    svg
      .append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(''))
      .attr('stroke', 'lightgrey')
      .attr('stroke-opacity', 0.7);
}


function drawInOut(gridData) {
    const { outgoingData, incomingData, outgoingCount, incomingCount } =
      gridData;
    // console.log('Received Outgoing Data:', outgoingData);
    // console.log('Received Incoming Data:', incomingData);

    // Use outgoingCount and incomingCount to determine color intensity and update grid colors
    // updateGridColors(outgoingCount, incomingCount);

    // draw a data points as a circle
    g.selectAll('.incoming-circle')
      .data(incomingData)
      .join('circle')
      .attr('class', 'incoming-circle')
      .attr(
        'cx',
        (d) =>
          map.latLngToLayerPoint({ lat: +d.before_lat, lng: +d.before_long })
            .x
      )
      .attr(
        'cy',
        (d) =>
          map.latLngToLayerPoint({ lat: +d.before_lat, lng: +d.before_long })
            .y
      )
      .attr('r', 3)
      .attr('fill', 'blue')
      .attr('opacity', 0.2);

    g.selectAll('.outgoing-circle')
      .data(outgoingData)
      .join('circle')
      .attr('class', 'outgoing-circle')
      .attr(
        'cx',
        (d) =>
          map.latLngToLayerPoint({ lat: +d.after_lat, lng: +d.after_long }).x
      )
      .attr(
        'cy',
        (d) =>
          map.latLngToLayerPoint({ lat: +d.after_lat, lng: +d.after_long }).y
      )
      .attr('r', 3)
      .attr('fill', 'red')
      .attr('opacity', 0.2);
}

function getTimeFilteredData(data){
    var slider = document.getElementById('timeslider');

    // get filtered data
    const startDateDropdown = d3.select('#startDateDropdown');
    const startTime = parseInt(slider.value);

    const selectedStartDateTime = new Date(startDateDropdown.node().value);
    selectedStartDateTime.setHours(startTime);
    const selectedEndDateTime = new Date(startDateDropdown.node().value);
    selectedEndDateTime.setHours(startTime + 1);

    const filteredData = data.filter(
        (d) =>
        d.before_time > selectedStartDateTime &&
        d.after_time < selectedEndDateTime
    );

    // all points
    g.selectAll('.all-circle')
        .data(filteredData)
        .join('circle')
        .attr('class', 'all-circle')
        .attr(
        'cx',
        (d) =>
            map.latLngToLayerPoint({ lat: +d.before_lat, lng: +d.before_long }).x
        )
        .attr(
        'cy',
        (d) =>
            map.latLngToLayerPoint({ lat: +d.before_lat, lng: +d.before_long }).y
        )
        .attr('r', 3)
        .attr('fill', 'grey') // Set the fill color to grey
        .attr('opacity', 0.1); // Adjust opacity as needed
    
    return filteredData;
}

function getGridFilteredData(data, latRange, longRange){
    return data.filter(
        (d) =>
          d.before_lat >= latRange[0] &&
          d.before_lat <= latRange[1] &&
          d.before_long >= longRange[0] &&
          d.before_long <= longRange[1]
      );
}

    // update grid depending on zoom
function updateGridColors(outgoingCount, incomingCount) {
    // Find the maximum count for both outgoing and incoming data
    const maxOutgoingCount = Math.max(
        ...outgoingCount.map((row) => Math.max(...row))
    );
    const maxIncomingCount = Math.max(
        ...incomingCount.map((row) => Math.max(...row))
    );

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
        const colorOutgoing = `rgb(255, ${Math.round(
            255 * (1 - colorIntensityOutgoing)
        )}, ${Math.round(255 * (1 - colorIntensityOutgoing))})`;
        const colorIncoming = `rgb(${Math.round(
            255 * (1 - colorIntensityIncoming)
        )}, ${Math.round(255 * (1 - colorIntensityIncoming))}, 255)`;

        // Update the color of the rectangle
        const rectangle = map
            .getPane('overlayPane')
            .querySelector(`.leaflet-interactive:nth-child(${i * 20 + j + 1})`);
        rectangle.style.fill = colorOutgoing; // Set color for outgoing data
        rectangle.style.stroke = colorIncoming; // Set color for incoming data
        }
    }
    }
    
    