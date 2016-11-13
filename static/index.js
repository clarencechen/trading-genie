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
		{
			console.log('staying alive')
		}
		else if(event.data == 'pong')
		{
			console.log('still staying alive')	
		}
		else if(event.data.split("::")[0] == 'stock')
		{
			stock = event.data.split("::")[1]	
		}
		else if(event.data.split("::")[0] == 'lavg')
		{
			lavg = JSON.parse(event.data.split("::")[1])
			$('#lavg').text(JSON.stringify(lavg))
		}
		else if(event.data.split("::")[0] == 'havg')
		{
			havg = JSON.parse(event.data.split("::")[1])
			$('#havg').text(JSON.stringify(havg))
		}
		else if(event.data.split("::")[0] == 'profit')
		{
			profit = +(event.data.split("::")[1])
			console.log('profit: ' + profit)
		}
		else if(event.data.split("::")[0] == 'price')
		{
			$.extend(price, JSON.parse(event.data.split("::")[1]))
		}
		else if(event.data = 'end')
		{
			$('#charttitle').text('<h2>Strategy results for ' + stock + '</h2>')
			plot(lavg, "blue", "Low Moving Average");
			plot(havg, "red", "High Moving Average");
			plot(price, "green", "Instantaneos Price");
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