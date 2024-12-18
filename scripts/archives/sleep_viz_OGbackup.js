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
        .attr("width", width)
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
                const value = data.find(item => item.zipcode === d.properties.zcta5)?.[variable];
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    Zip Code: ${d.properties.zcta5}<br/>
                    ${variable.replace(/_/g, " ")}: ${value}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }
    
    // Initial map
    updateMap("sleep_deprivation");
    
    // Handle variable selection
    d3.select("#variable-select")
        .on("change", function() {
            updateMap(this.value);
        });
});