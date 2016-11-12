console.log('app started')

var express = require('express')
var http = require('http')

var app = express()

app.use('/', express.static(__dirname+"/static"))

var port = (process.env.PORT || 5000);
var server = http.createServer(app)
server.listen(port)

app.post('/', function(req, res) {
	res.send('Hey')
})