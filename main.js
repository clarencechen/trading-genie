
console.log('app started')
var querystring = require('querystring')
var express = require('express')
var http = require('http')
var $ = require('jquery')
var app = express()

app.use('/', express.static(__dirname+"/static"))

var port = (process.env.PORT || 5000);
var server = http.createServer(app)
server.listen(port)

var WebSocket = require("ws")
var ws = new WebSocket('wss://trading-genie.herokuapp.com/')
var WebSocketServer = require("ws").Server
var wss = new WebSocketServer({server: server})
console.log("websocket server created")

function setUpSocket() {
	wss.on("connection", function(ws) {
		console.log("websocket connection open")
		ws.on("message", function(data) {//data from webpage
			console.log('received data')
			var stuff = JSON.parse(data.split("::")[1])
			switch (data.split("::")[0]) {
				case "quote":
				{
					var data = querystring.stringify({	'_Token' : 'BC2B181CF93B441D8C6342120EB0C971',
										'Symbols' : stuff['symbols'],
										'StartDateTime' : stuff['start'],
										'EndDateTime' : stuff['end'],
										'MarketCenters' : '' 
									})
					var options = {
						host: 'ws.nasdaqdod.com',
						path: '/v1/NASDAQQuotes.asmx/GetQuotes',
						method: 'POST',
						headers: {
						    'Content-Type': 'application/x-www-form-urlencoded',
						    'Content-Length': Buffer.byteLength(data, 'utf8')
						}
					}
					function callback(response) {
						var str = ""
					    console.log("In callback")
						response.on("data", function (chunk) {str += chunk})
						response.on("end", function () {console.log('data received')})
					    price = []
					    var xmldoc = $.parseXML(str)
					    xml = $(xmlDoc).find('BidPrice').each(function(i, e){
					    	price[i] = e.text();
					    })
					    str = JSON.stringify(price)
						console.log("body: " + str)
						ws.send(str)
					}
					var req = http.request(options, callback)
					console.log('about to call nasdaq api')
					req.end(data, 'utf8', function() {console.log('called api')})

					break
				}
				default:
				{
					console.log('crap')
				}
			}
				setInterval(function timeout() {
    				ws.send('ping')
    				console.log('staying alive')
    			}, 500)
		})
		ws.on("close", function() {
			console.log("websocket connection closed")
		})
	})
}

setUpSocket()

function callQuery(data, callback) {
	client.post('analyzesentiment', data, function(err, resp) {
		if(err)
		{
			console.log('An error occured! ' + err)
			bail(err, callback)
		}
		else
		{
			console.log('We got ' + JSON.stringify(resp.body))
			callback(resp.body);
		}
	})
}

function bail(err, callback) {
	var error = {isError: true, error: err}
	callback(error)
}




function xmlToJson(xml) {
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
}