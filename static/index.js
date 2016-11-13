var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);
$(document).ready(function() {
	var lavg, havg, price = []
	var profit
	var stock = ''
	$("button#submit").click(submitQuery);
	$("#comment").keypress(function(e){
		if(e.which == 13) {
			e.preventDefault()
			submitQuery()
		}
	})
	ws.onmessage = function(event){
		if(event.data == 'ping')
			console.log('staying alive')
		else if(event.data == 'pong')
			console.log('still staying alive')	
		else if(event.data.split("::")[0] == 'stock')
			stock = event.data.split("::")[1]	
		else if(event.data.split("::")[0] == 'lavg')
			lavg = JSON.parse(event.data.split("::")[1])
		else if(event.data.split("::")[0] == 'havg')
			havg = JSON.parse(event.data.split("::")[1])
		else if(event.data.split("::")[0] == 'profit')
		{
			profit = +(event.data.split("::")[1])
			('#profit').append('<h2>Total Profit: ' + profit + '</h2>')
		}
		else if(event.data.split("::")[0] == 'price')
			$.extend(price, JSON.parse(event.data.split("::")[1]))
		else if(event.data = 'end')
		{
			var bottom = d3.min([d3.min(lavg), d3.min(price), d3.min(havg)])
			var top = d3.max([d3.max(lavg), d3.max(price), d3.max(havg)])
			console.log(top + ' ' +bottom);
			$('#charttitle').append('<h2>Strategy results for ' + stock + '</h2>')
			plot([lavg, price, havg], ["blue", "green", "red"], ["Low Moving Average", "Instantaneous Price", "High Moving Average"], top, bottom);
		}
	}
})
function submitQuery() {
	if($("#comment").val() == "")
		return "";
	var query = {low: $('#low').val(), high: $('#high').val(), symbols: $('#symbols').val(), start: ($('#start').val() +':00').replace(/T/g, ' ').replace(/-/g, '/'), end: ($('#end').val() +':00').replace(/T/g, ' ').replace(/-/g, '/'), markets: 'B, Q'}
	//$("#comment").val();
	$('#symbols').val("");
	$('#start').val("");
	$('#end').val("");
	$('#strategy').val("");
	$('#low').val("");
	$('#high').val("");
	ws.send("quote::" + JSON.stringify(query));
	console.log("emitted " + JSON.stringify(query));
}

function plot(data, colors, names, top, bottom) {
	var svg = d3.select("svg"),
		margin = {top: 20, right: 20, bottom: 30, left: 50},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom,
		g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	svg.style("border","1px solid black");
	
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

	x.domain([0, data[1].length]);
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

	for(i = 0; i < 3; i++)
	{
		g.append("path")
			.attr("class", "line")
			.attr("stroke",colors[i])
			.attr("d", line(data[i]));
		svg.append("text")
			.attr("transform", "translate(" + (width+10) + "," + y(data[i][data[i].length-1]-20) + ")")
			.attr("dy", ".35em")
			.attr("text-anchor", "start")
			.style("fill", colors[i])
			.text(names[i]);
	}
}