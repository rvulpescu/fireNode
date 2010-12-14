var http = require('http');
var sys = require('sys');

var fireNode = require('./lib/fireNode');

var _port = 8080;

function checkUsage() {
    if(process.argv.length != 3) {
        sys.puts('usage: node example.js <port>');
        process.exit(1);
    }

    var port = parseInt(process.argv[2], 10);

    if('NaN' == port.toString()) {
        sys.puts('usage: node example.js <port>');
        process.exit(1);
    }
    fireNode.INFO("Logs are stored as they are registered.", "And printed when headers are sent out.");
    _port = port;
};

checkUsage();

http.createServer( function (req, res) {
    //Just checking server is accesible
    sys.log(req.connection.remoteAddress + ": " + req.method + " " + req.url);
    //Connect fireNode to an output response to be able to send the headers
    fireNode.register(res);
       
    fireNode.LOG("Log Label", "Logged string");
    fireNode.ERROR("Error Label", {"Logged":"Object", test: function() { return "Muah"; }});
        
    fireNode.WARN("large objects are truncated", [[[[[[[[1]]]]]]]]);    
    
    fireNode.WARN("Warn Label", [{"Logged":"Object 1"}, {"Logged":"Object 2"}]);
    
    fireNode.TABLE("Table Label", [["Head 1","Head 2"], ["Data A1","Data A2"],["Data B1","Data B2"], ["Data C1","Data C2"]]);
        
    fireNode.TRACE("Trace Label");
    fireNode.EXCEPTION("Exception Label");
        
    res.writeHead(200, {'Content-Type': 'text/plain'});    
    
    res.end('All ok, see firebug for error messages.');

}).listen(_port, "127.0.0.1");
console.log('Server running at http://127.0.0.1:' + _port+'/');