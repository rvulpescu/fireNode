fireNode
========

A simple implementation of Firebug's Wildfire protocol[1] for node.js

How does it work
----------------

After importing the fireNode module the regular logging functions are available.

  var fireNode = require('./lib/fireNode');
  
  fireNode.setEnabled(bool mode);
  //Enable or disable the logging, default mode is enabled
  fireNode.setDepthLimit(int limit);
  //Set the maximum depth limit for large objects, 3 by default
    
  fireNode.LOG(string title, mixed object)
  fireNode.ERROR (string title, mixed object)
  fireNode.WARN(string title, mixed object) 
  fireNode.INFO(string title, mixed object)
  fireNode.TABLE(string title, array object)

For trace and exception, see the Known issues section
  
  fireNode.TRACE(string title, mixed object)    
  fireNode.EXCEPTION(string title)

Messages can be logged at any time. They will be stored in memory.
When finished the logged messages need to be passed to the client.
First the fireNode logger needs to hook to a server response.
  
  fireNode.register(http.ServerResponse res);
  
The logger will be linked to the specified server response. The linking
process overloads the regular "writeHead" function of the server response
with a custom function that appends the Wildfire protocol's headers to the 
regular payload.


Example
-------

See the example.js attached

Known issues
------------

1. Node.js doesn't provide function arguments in it's trace
2. Node.js doesn't allow converting to json self referencing objects.


## Author

Radu Vulpescu
[radu.vulpescu@gmail.com](mailto:radu.vulpescu@gmail.com)

  [1]: http://www.firephp.org/Wiki/Reference/Protocol