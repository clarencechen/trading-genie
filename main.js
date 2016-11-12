
console.log('app started')
var querystring = require('querystring')
var express = require('express')
var http = require('http')

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
					var data = querystring.stringify({	'_Token' : '999AEED3D3454B599104F310E15B1CD4',
										'Symbols' : stuff['symbols'],
										'StartDateTime' : stuff['start'],
										'EndDateTime' : stuff['end'],
										'MarketCenters' : '' 
									})
					var options = {
						host: 'http://ws.nasdaqdod.com',
						port: 80,
						path: '/v1/NASDAQQuotes.asmx/GetQuotes',
						method: 'POST',
						headers: {
						    'Content-Type': 'application/x-www-form-urlencoded',
						    'Content-Length': Buffer.byteLength(data, 'utf8')
						}
					}
					console.log('about to call nasdaq api')
					var req = http.request(options, function(res) {
					    res.on('data', function (resp) {
					    	console.log("In callback")
					        console.log("body: " + resp)
							ws.send(resp)
					    })
					})
					req.write(data)
					req.end()
					break
				}
				default:
				{
					console.log('crap')
				}
			}
		});
	
		ws.on("close", function() {
			console.log("websocket connection close")
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