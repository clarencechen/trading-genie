
console.log('app started')
var querystring = require('querystring')
var express = require('express')
var http = require('http')
var xmldoc = require("xmldoc")
var Module = require('./a.out.js')
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
					var low = +(stuff['low'])
					var high = +(stuff['high'])
					var data = querystring.stringify({	'_Token' : 'BC2B181CF93B441D8C6342120EB0C971',
										'Symbols' : stuff['symbols'],
										'StartDateTime' : stuff['start'],
										'EndDateTime' : stuff['end'],
										'MarketCenters' : stuff['markets']
									})
					var options = {
						host: 'ws.nasdaqdod.com',
						path: '/v1/NASDAQQuotes.asmx/GetQuotes',
						method: 'POST',
						headers: {
						    'Content-Type': 'application/x-www-form-urlencoded',
						    'Content-Length': Buffer.byteLength(data, 'utf8')
						},
						agent: undefined
					}
					function callback(response) {
						var str = ""
					    console.log("In callback")
						response.on("data", function (chunk) {
							str += chunk
						})
						response.on("end", function () {
							console.log("data received from api")
							var price = {}
							var time = {}
							var info = new xmldoc.XmlDocument(str)
							console.log('parsed')
							info.eachChild(function (stock) {
								if(stock.childNamed('Outcome').val == "RequestError")
								{
									console.log(stock.childNamed('Message').val)
									return;
								}
								var sym = stock.childNamed('Symbol').val
								price[sym] = []
								time[sym] = []
								ws.send('stock::' + sym)
								arr = stock.childNamed('Quotes').childrenNamed('Quote')
								Module.setLen(arr.length)
								var j = 0
								while (arr.length > 0)
								{
									console.log(arr.length)
									for (var i = 0; i <  100; i++) {
										datum = arr.splice(0, 1)[0]
										if(!datum)
											break;
										price[sym][i] = +(datum.childNamed('BidPrice').val)
										time[sym][i] = datum.childNamed('EndTime').val
									}
									var analys = [price[sym], time[sym]]
									if(analys.length === 100)
									{
										var pricepos = Module._malloc(8*analys.length)
										//var timepos = Module._malloc(8*analys.length)
										for(var i = 0; i < analys.length; i++)
										{
											Module.setValue(pricepos +8*i, analys[0][i], 'double')
											//Module.setValue(timepos +8*i, analys[0][i], 'double')
										}
										Module.getInputArr(pricepos, j)
										console.log(JSON.stringify(analys))
									}
									ws.send(JSON.stringify([price, time]))
									price[sym] = []
									time[sym] = []
									j++;
								}
							})
							ws.send('end')
							var LMApointer = Module.SMAlow(low)
							var HMApointer = Module.SMAhigh(high)
							var profit = Module.Net(low)

							var lavg, havg = []
							for(i = 1; i <= Module.getValue(LMApointer, 'double'); i++)
								lavg[i -1] = Module.getValue(LMApointer +8*i, 'double')
								console.log(lavg[i -1])
							for(i = 1; i <= Module.getValue(HMApointer, 'double'); i++)
								havg[i -1] = Module.getValue(HMApointer +8*i, 'double')
							ws.send("lavg::" +JSON.stringify(lavg))
							ws.send("havg::" +JSON.stringify(havg))
							ws.send("profit::" +profit.toString())
							Module.delArr()

						})
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
			}, 50)
		})
		ws.on("open", function() {
			setInterval(function timeout() {
				ws.send('pong')
			}, 50)
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