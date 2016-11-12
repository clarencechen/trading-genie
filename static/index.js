var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);
$(document).ready(function() {
	var arr = [{},{}]
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
			arr.forEach(function(e) {event.data.split("::")[1] = []})	
		}
		else if(event.data == 'end')
		{
			arr.forEach(function(e, which) {
				for(var stock in e)
				{
					e[stock].forEach(function(entry, i) {
						$('#review').append('<p class="review">' + stock + ' Quote ' + i + (!which ? "'s price: " : "'s time: ") + entry + '</p>')
					})
				}
			})
			arr = [{},{}]
		}
		else
		{
			arr.forEach(function(e, which) {
				for(var stock in e)
				{
					e[stock] += JSON.parse(event.data[which][stock])
				}
			})
		}
	}
})
function submitQuery() {
	if($("#comment").val() == "")
		return "";
	var query = {symbols: $('#symbols').val(), start: ($('#start').val() +':00').replace(/T/g, ' ').replace(/-/g, '/'), end: ($('#end').val() +':00').replace(/T/g, ' ').replace(/-/g, '/'), markets: 'B, Q'}
	//$("#comment").val();
	$('#symbols').val("");
	$('#start').val("");
	$('#end').val("");
	ws.send("quote::" + JSON.stringify(query));
	console.log("emitted " + JSON.stringify(query));
}