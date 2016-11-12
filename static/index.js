var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);
$(document).ready(function() {
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
		else
		{
		$('#review').append('<p class="review">' + event.data + '</p>')
		}
	}
})
function submitQuery() {
	if($("#comment").val() == "")
		return "";
	var query = {symbols: 'AAPL', start: '2/1/2015 00:00:00.000', end: '2/5/2015 00:00:00.000'}
	//$("#comment").val();
	$("#comment").val("");
	ws.send("quote::" + JSON.stringify(query));
	console.log("emitted " + JSON.stringify(query));
}