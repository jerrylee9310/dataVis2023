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
L.tileLayer(
  'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}',
  {
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png',
  }
).addTo(map);

// Add an svg layer to the Leaflet map
const svgLayer = L.svg().addTo(map);
const svg = d3.select('#map').select('svg');
const g = svg.select('g');

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
  const endDates = [
    ...new Set(data.map((d) => d.after_time.toISOString().split('T')[0])),
  ];

  // add unique dates to date menu
  d3.select('#startDateDropdown')
    .selectAll('option')
    .data(startDates)
    .join('option')
    .attr('value', (d) => d)
    .text((d) => d);
  // // add unique dates to dropdown menu
  // d3.select("#endDateDropdown")
  // .selectAll("option")
  // .data(startDates)
  // .join("option")
  // .attr("value", d => d)
  // .text(d => d);

  // get unique times for time menu
  const uniqueBeforeHours = [...Array(24).keys()];

  // add unique times to dropdown menu
  d3.select('#starttimeDropdown')
    .selectAll('option')
    .data(uniqueBeforeHours)
    .join('option')
    .attr('value', (d) => d)
    .text((d) => d);

  const uniqueAfterHours = Array.from({ length: 24 }, (_, i) => i + 1);
  // add unique times to dropdown menu
  d3.select('#endtimeDropdown')
    .selectAll('option')
    .data(uniqueAfterHours)
    .join('option')
    .attr('value', (d) => d)
    .text((d) => d);

  var clicked_retangle_row = -1;
  var clicked_retangle_col = -1;

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
          console.log('clicked rectangglw row ', clicked_retangle_row);
          console.log('i', i);
          console.log('isSlider', isSliderUpdate);
          if (
            clicked_retangle_row == i &&
            clicked_retangle_col == j &&
            !isSliderUpdate
          ) {
            outgoingData = [];
            incomingData = [];

            // Update the counts
            outgoingCount[i][j] = 0;
            incomingCount[i][j] = 0;
            callback({
              outgoingData,
              incomingData,
              outgoingCount,
              incomingCount,
            });
            console.log('clicked rectangel');

            clicked_retangle_row = -1;
            clicked_retangle_col = -1;
            return;
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
          console.log(latRange, longRange);
          // console.log("Outgoing Data in Grid:", outgoingData);
          // console.log("Incoming Data in Grid:", incomingData);

          // Update the counts
          outgoingCount[i][j] = outgoingData.length;
          incomingCount[i][j] = incomingData.length;

          // set clicked rectangle
          clicked_retangle_row = i;
          clicked_retangle_col = j;
          // Invoke the callback function with the data
          callback({
            outgoingData,
            incomingData,
            outgoingCount,
            incomingCount,
          });

          let filteredGridData = data.filter(
            (d) =>
              d.before_lat >= latRange[0] &&
              d.before_lat <= latRange[1] &&
              d.before_long >= longRange[0] &&
              d.before_long <= longRange[1]
          );

          console.log('Filtered Data:', filteredGridData);

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
          isSliderUpdate = false;
          updateInOut();
        });

        // update inout flow when slider update
        if (
          clicked_retangle_row == i &&
          clicked_retangle_col == j &&
          isSliderUpdate
        ) {
          console.log('update slider inout', clicked_retangle_row);
          updateInOut();
        }
      }
    }
  }

  // slider
  var slider = document.getElementById('timeslider');
  var output = document.getElementById('timevalue');
  output.innerHTML =
    slider.value + ':00-' + (parseInt(slider.value) + 1) + ':00';

  slider.oninput = function () {
    output.innerHTML = this.value + ':00-' + (parseInt(this.value) + 1) + ':00';
    updateVisualization(true);
    console.log('sliderupdate', this.value);
  };

  // Main visulizaition
  function updateVisualization(isSliderUpdate) {
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

    // taxi data in given time interval
    // console.log(filteredData);

    // Draw the grid and pass a callback function
    drawGrid(filteredData, isSliderUpdate, function (gridData) {
      const { outgoingData, incomingData, outgoingCount, incomingCount } =
        gridData;
      console.log('Received Outgoing Data:', outgoingData);
      console.log('Received Incoming Data:', incomingData);

      // Use outgoingCount and incomingCount to determine color intensity and update grid colors
      updateGridColors(outgoingCount, incomingCount);

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
    });
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

  // update position of circles
  function updateCircles() {
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

  //
  updateVisualization(false);
  d3.select('#startDateDropdown').on('change', updateVisualization);
  d3.select('#');
  map.on('moveend', updateCircles);
});
