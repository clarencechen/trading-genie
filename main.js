console.log('app started')

var express = require('express')
var http = require('http')

var app = express()

app.use('/', express.static(__dirname+"/static"))

var port = (process.env.PORT || 5000);
app.listen(port, function () {
  console.log('Example app listening on port 3000!')
})

app.get('/', function(req, res) {
	res.send('Hey')
})