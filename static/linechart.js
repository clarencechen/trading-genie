var svg = d3.select("svg"),
		margin = {top: 20, right: 20, bottom: 30, left: 50},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom,
		g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.style("border","1px solid black");

var parseTime = d3.timeParse("%b %Y");


var x = d3.scaleTime()
		.rangeRound([0, width]);

var y = d3.scaleLinear()
		.rangeRound([height, 0]);

var line = d3.line()
		.x(function(d, i) {
		 return x(i); })
		.y(function(d) { 
			return y(d); })
		.curve(d3.curveLinear);

var xAxis = d3.axisBottom()
		.scale(x).ticks(0);

var bottom = d3.min([d3.min(lavg), d3.min(price), d3.min(havg)])
var top = d3.max([d3.max(lavg), d3.max(price), d3.max(havg)])
console.log("top", top);
console.log("bottom", bottom);



function plot(data,color) {
	x.domain([0, data.length]);
	y.domain([bottom,top]);

	g.append("g")
			.attr("class", "xaxis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

	g.append("g")
			.attr("class", "yaxis")
			.call(d3.axisLeft(y))
			.append("text")
			.attr("fill", "#333")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", "0.71em")
			.style("text-anchor", "end")
			.text("Price ($)");

	g.append("path")
			.attr("class", "line")
			.attr("stroke",color)
			.attr("d", line(data));

	svg.append("text")
			.attr("transform", "translate(" + (width+10) + "," + y(data[data.length-1].value-20) + ")")
			.attr("dy", ".35em")
			.attr("text-anchor", "start")
			.style("fill", color)
			.text(name);
}