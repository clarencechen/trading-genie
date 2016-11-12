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
			arr = JSON.parse(event.data)
			arr.forEach(function(e, which) {
				e.forEach(function(entry, i) {
					$('#review').append('<p class="review"> Quote ' + i + (!which ? "'s price: " : "'s time: ") + entry + '</p>')
				})
			})
		}
	}
})
function submitQuery() {
	if($("#comment").val() == "")
		return "";
	var query = {symbols: 'AAPL', start: '11/11/2016 09:30:00.000', end: '11/11/2016 09:35:00.000', markets: 'Q, B'}
	//$("#comment").val();
	$("#comment").val("");
	ws.send("quote::" + JSON.stringify(query));
	console.log("emitted " + JSON.stringify(query));
}