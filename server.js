#!/usr/bin/env /usr/local/bin/node

var http, frisbee, app, server, PORT;

http    = require('http');
frisbee = require('./script/lib/frisbee/');


/****** CONF ******/

PORT = 8001;

/**** END CONF ****/


/****** APP *******/
app = frisbee()
        .use(frisbee.static({ folder: __dirname,
                              cache: true,
                              expires: 1000 * 60 * 60 * 24 }));


/*** INSTANCIATE ***/
server = http.createServer(app);
server.listen(PORT);