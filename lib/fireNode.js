/**
 * *** BEGIN LICENSE BLOCK *****
 * Copyright 2010 Radu Vulpescu. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 *    1. Redistributions of source code must retain the above copyright notice, this list of
 *       conditions and the following disclaimer.
 *
 *    2. Redistributions in binary form must reproduce the above copyright notice, this list
 *       of conditions and the following disclaimer in the documentation and/or other materials
 *       provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY Radu Vulpescu. ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Radu Vulpescu . OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * The views and conclusions contained in the software and documentation are those of the
 * authors and should not be interpreted as representing official policies, either expressed
 * or implied, of Radu Vulpescu.
 * ***** END LICENSE BLOCK *****
 */
var enabled = true;
var response = null;
var headers = {};

var recursiveLimit = 3;
var count = 0;

/*
 * Private function, splits headers if needed and sotres them.
 */
function appendMessage(msg) {
    var length = msg.length;
    while(msg.length > 0) {
        var toSend;
        var to;
        var lineEnd = '|';
        //As mentioned in the Firebug's Wildfire protocol FAQ.
        if (msg.length > 5000) {
            to = 4999;
            lineEnd = '|\\';
        } else {
            to = msg.length;
        }
        toSend = msg.substring(0, to);
        msg = msg.substring(to, msg.length);
        count++;
        headers['X-Wf-1-1-1-'+count] = length + '|'+toSend+lineEnd;
        length = '';
    }
}

/*
 * Link our logger to an output response stream in order to print the headers.
 * The writeHead function is overloaded to automatically pass the appropriate log headers along.
 */
exports.register = function(res) {
    if(!enabled)
        return;

    response = res;

    if(response===null) {
        throw new Error("We need a response stream to initialize!");
    }

    headers['X-Wf-Protocol-1'] = 'http://meta.wildfirehq.org/Protocol/JsonStream/0.2';
    headers['X-Wf-1-Plugin-1'] = 'http://meta.firephp.org/Wildfire/Plugin/FirePHP/Library-FirePHPCore/0.3';
    headers['X-Wf-1-Structure-1'] = 'http://meta.firephp.org/Wildfire/Structure/FirePHP/FirebugConsole/0.1';

    response._writeHead = res.writeHead;
    response.writeHead = function() {
        var argv = response.writeHead.arguments;
        var argc = argv.length;

        var reasonPhrase;
        var headerSet;

        var code = argv[0];
        if (argc == 3) {
            headerSet = argv[2];
            reasonPhrase = argv[1];
        } else {
            if (argc == 1) {
                headerSet = argv[1];
                reasonPhrase = undefined;
            }
        };
        if (headerSet === undefined) {
            headerSet = {};
        }
        for(var x in headers) {
            headerSet[x] = headers[x];
        }
        if(reasonPhrase!==undefined) {
            response._writeHead(code, reasonPhrase, headerSet);
        } else {
            response._writeHead(code, headerSet);
        }
    }
}
/*
 * Enable or desable the logging.
 */
exports.setEnabled = function(mode) {
    enabled = mode;
}
/*
 * Set the maximum depth level
 */
exports.setDepthLimit = function(limit) {
    recursiveLimit = limit;
}
exports.LOG = function(title, object) {
    myLog('LOG', title, object);
}
exports.ERROR = function(title, object) {
    myLog('ERROR', title, object);
}
exports.WARN = function(title, object) {
    myLog('WARN', title, object);
}
exports.INFO = function(title, object) {
    myLog('INFO', title, object);
}
exports.TABLE = function(title, object) {
    myLog('TABLE', title, object);
}
exports.TRACE = function(title) {
    myTrace('TRACE', title);
}
exports.EXCEPTION = function(title) {
    myTrace('EXCEPTION', title);
}
/*
 * Private function for tracing and exceptions.
 */
function myTrace(type, title) {
    if(!enabled)
        return;
        
    var triggerInfo;
    var trace;
    
    try {
        throw new Error();
    } catch (e) {
        var info = extractTrace(e.stack, 3);
        triggerInfo = info.triggerInfo;
        trace = info.trace;
    }
    if (title===undefined) {
        title = triggerInfo.Function;
    }
    //Build the object to pass back to Firebug
    var traceMsg = [{
        "Type": type,
        "Label": title,
        "File":  triggerInfo.File,
        "Line":  triggerInfo.Line
    },{
        "Class": "",
        "Message": title,
        "File": triggerInfo.File,
        "Line": triggerInfo.Line,
        "Type": '',
        "Function": triggerInfo.Function,
        "Trace": trace
    }]
    //Add the log message to our log stack
    appendMessage(JSON.stringify(traceMsg));
}

/*
 * Private function for general logging
 */
function myLog(type, title, object) {
    if(!enabled)
        return;

    if(!title)
        title = "";

    object = traverse(object, 0);

    var m;
    var l;
    //We need to throw an error, to read it's
    //trace in order to identify where the log function
    //was initially triggered
    try {
        throw new Error();
    } catch (e) {
        var info = extractTrace(e.stack, 3, 0);
        var triggerInfo = info.triggerInfo;
    }

    this.type = type;
    this.title= title;

    //If no object has been logged, show an empty string
    if (object===undefined)
        object = "";
    this.object = object;

    try {
        //Build the object to pass back to Firebug
        var jsError = JSON.stringify([
        {
            "Type":  this.type,
            "Label": this.title,
            "File":  triggerInfo.File,
            "Line":  triggerInfo.Line
        },
        this.object
        ]);
        //Add the log message to our log stack
        appendMessage(jsError);
    } catch(e) {
        myLog('ERROR', e.message);
    }
};

function extractTrace(trace, from, limit) {
    var traceLog = [];
    l = trace.split("\n");
    var il = l.length-1;
    for(var i=3; i<il; i++) {
        m = l[i].match(/    at (.*) \((.*):(.*):(.*)\)/);
        //We read the trace line
        // %1 = the function
        // %2 = the file
        // %3 = the line
        // %4 = the column

        //The triggering functions is "from" functions away + 1 first line.
        //First line, l[0] is the last function called
        if (i==from)
            triggerInfo = {
                "File": m[2],
                "Line": m[3],
                "Function": m[1]
            }
            //Stop if trace depth limit reached
        if (limit !== undefined && i>=limit)
            break;
        traceLog.push({
            "file": m[2],
            "line": m[3],
            "function": m[1],
            "args": ['Arguments not supported']
        });
    }
    return {'triggerInfo' : triggerInfo, 'trace': traceLog};
}

//A function that traverses the logged objects to detect functions and prevent
//very large objects to be logged
function traverse(object, level) {
    if (level > recursiveLimit) {
        return "Output truncated";
    }
    for (i in object) {
        if (typeof object[i] == 'object' || Array.isArray(object[i])) {
            object[i] = traverse(object[i], level+1);
        }
        if (typeof object[i] == 'function') {
            object[i] = "function()";
        }
    }
    return object;
}
