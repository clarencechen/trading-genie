
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
			ws.send('loading::Server has received data, please wait.')
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
					    ws.send("loading::Receiving data from API in chunks, please wait.")
						response.on("data", function (chunk) {
							str += chunk
						})
						response.on("end", function () {
							ws.send("loading::Need to parse data received from api")
							var price = {}
							var time = {}
							var info = new xmldoc.XmlDocument(str)
							info.eachChild(function (stock) {
								if(stock.childNamed('Outcome').val == "RequestError")
								{
									ws.send('loading::' + stock.childNamed('Message').val)
									return;
								}
								var sym = stock.childNamed('Symbol').val
								price[sym] = []
								time[sym] = []
								ws.send('stock::' + sym)
								arr = stock.childNamed('Quotes').childrenNamed('Quote')
								totallength = arr.length
								Module.setLen(arr.length)
								var j = 0
								while (arr.length > 0)
								{
									for (var i = 0; i <  100; i++) {
										datum = arr.splice(0, 1)[0]
										if(!datum)
											break;
										price[sym][i] = +(datum.childNamed('BidPrice').val)
										time[sym][i] = datum.childNamed('EndTime').val
									}
									var analys = [price[sym], time[sym]]
									if(analys[0].length === 100 && analys[1].length === 100)
									{
										var pricepos = Module._malloc(8*analys[0].length)
										//var timepos = Module._malloc(8*analys[1].length)
										for(var i = 0; i < analys[0].length; i++)
										{
											Module.setValue(pricepos +8*i, analys[0][i], 'double')
											//Module.setValue(timepos +8*i, analys[1][i], 'double')
										}
										Module.getInputArr(pricepos, j)
										Module._free(pricepos)
									}
									ws.send("price::" +JSON.stringify(price[sym]))
									price[sym] = []
									time[sym] = []
									j++;
								}
							})
							ws.send('loading::Currently analyzing parsed data, please wait.')
							var LMApointer = Module.SMAlow(low)
							var HMApointer = Module.SMAhigh(high)
							var optimalpointer = Module.Optimal(high, low)
							var lavg = []
							var havg = []
							for(i = 1; i <= Module.getValue(LMApointer, 'double'); i++)
								lavg[i -1] = Module.getValue(LMApointer +8*i, 'double')
							for(i = 1; i <= Module.getValue(HMApointer, 'double'); i++)
								havg[i -1] = Module.getValue(HMApointer +8*i, 'double')
							var optimals = [Module.getValue(optimalpointer, 'double'), Module.getValue(optimalpointer +8, 'double')]

							var profit = Module.Net(low)
							ws.send("lavg::" +JSON.stringify(lavg))
							ws.send("havg::" +JSON.stringify(havg))
							ws.send("profit::" +profit.toString())
							ws.send("optimals::" +JSON.stringify(optimals))
							Module.delArr()
							Module._free(LMApointer)
							Module._free(HMApointer)
							Module._free(optimalpointer)
							ws.send('end')
						})
					}
					var req = http.request(options, callback)
					ws.send('loading::Calling API, please wait.')
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
