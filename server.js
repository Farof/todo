#!/usr/bin/env /usr/local/bin/node

var frisbee = require('./script/lib/frisbee/');

var server = frisbee()
              .use(frisbee.static({ folder: __dirname,
                                    cache: true }))
              .listen(8001);
