// Load data
Promise.all([
    d3.json("sleep_viz_data.json"),
    d3.json("nyc_shapes.geojson")
]).then(([data, geoData]) => {
    // Set up dimensions
    const width = 800;
    const height = 600;
    
    // Create SVG
    const svg = d3.select("#map")
        .append("svg")
        .attr("width", width + 150)  // Increased width for legend
        .attr("height", height);
    
    // Create projection
    const projection = d3.geoMercator()
        .fitSize([width, height], geoData);
    
    // Create path generator
    const path = d3.geoPath()
        .projection(projection);
    
    // Create color scales
    const colorScales = {
        sleep_deprivation: d3.scaleSequential(d3.interpolateReds),
        median_income: d3.scaleSequential(d3.interpolateGreens),
        education_ba_plus: d3.scaleSequential(d3.interpolateBlues),
        poverty_rate: d3.scaleSequential(d3.interpolateOranges)
    };

    // Create legend
    function createLegend(variable, values) {
        // Remove existing legend
        svg.selectAll(".legend").remove();
        svg.selectAll("defs").remove();  // Remove existing gradients

        const legendWidth = 20;
        const legendHeight = height / 2;
        const legendPosition = width + 30;  // Adjusted position

        // Create gradient for legend with unique ID
        const gradientId = `legend-gradient-${variable}`;
        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");

        // Add color stops using the correct color scale
        const colorScale = colorScales[variable];
        const numStops = 10;
        for (let i = 0; i <= numStops; i++) {
            const offset = i / numStops;
            linearGradient.append("stop")
                .attr("offset", `${offset * 100}%`)
                .attr("stop-color", colorScale(d3.quantile(values, offset)));
        }

        // Create legend group
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${legendPosition},${height/4})`);

        // Add gradient rectangle
        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", `url(#${gradientId})`);

        // Add legend title with word wrapping
        const title = variable.replace(/_/g, " ").toUpperCase();
        const words = title.split(" ");
        let titleY = -25;  // Increased space for title
        
        words.forEach((word, i) => {
            legend.append("text")
                .attr("class", "legend-title")
                .attr("x", -5)
                .attr("y", titleY + (i * 15))  // Stack words vertically
                .style("text-anchor", "start")
                .style("font-size", "12px")
                .text(word);
        });

        // Add legend labels
        const extent = d3.extent(values);
        const legendScale = d3.scaleLinear()
            .domain(extent)
            .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
            .ticks(5)
            .tickFormat(d3.format(".1f"));

        legend.append("g")
            .attr("class", "legend-axis")
            .attr("transform", `translate(${legendWidth}, 0)`)
            .call(legendAxis);
    }
    
    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    // Function to update map
    function updateMap(variable) {
        const values = data.map(d => d[variable]);
        const colorScale = colorScales[variable]
            .domain([d3.min(values), d3.max(values)]);
        
        svg.selectAll("path")
            .data(geoData.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const value = data.find(item => item.zipcode === d.properties.zcta5)?.[variable];
                return value ? colorScale(value) : "#ccc";
            })
            .on("mouseover", (event, d) => {
                const zipData = data.find(item => item.zipcode === d.properties.zcta5);
                const value = zipData?.[variable];
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    Zip Code: ${d.properties.zcta5}<br/>
                    Neighborhood: ${zipData?.neighborhood}<br/>
                    ${variable.replace(/_/g, " ")}: ${value?.toFixed(2)}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Update legend
        createLegend(variable, values);
    }
    
    // Initial map
    updateMap("sleep_deprivation");
    
    // Handle variable selection
    d3.select("#variable-select")
        .on("change", function() {
            updateMap(this.value);
        });
});