#! /usr/bin/env node

var http = require('http');
var httpProxy = require('http-proxy');
var debug = require('debug')('stub-proxy:index');
var Mock = require('monkeyjs');

var TEST_MODE = false;
var server, mount;

if (module.parent) {
    // unit test
    module.exports = function(mount) {
        TEST_MODE = true;
        return createServer(new Mock(mount), httpProxy.createProxyServer());
    };
} else {
    // standalone
    var argv = require('optimist').argv,

    mount = argv._[0];
    if (!mount) {
        console.log('Usage ./stub-proxy [-p port] [-a address] <mock-data-dir>');
        process.exit(1);
    }
    server = createServer(new Mock(mount), httpProxy.createProxyServer());

    var port = argv.p || 80;
    var address = argv.a || '0.0.0.0';
    console.log('Listen %s at port %d', address, port);
    server.listen(port, address);
}

function createServer(mock, proxy) {
    var server = http.createServer(function(req, res) {
        var request, response, status = 200, content, type = 'application/json';

        request = {
            uri: req.url,
            method: req.method,
        };
        debug('request', request);

        try {
            response = mock.get(request);
            debug('response', response);

            if (!response) {
                // proxy to real server
                // Only support http proxy right now
                if (TEST_MODE) {
                    response = {
                        status: 404,
                        body: 'This is unit test only case',
                    };
                } else {
                    return proxy.web(req, res, { target: 'http://' + req.headers.host });
                }
            }
            status = response.status;
            content = JSON.stringify(response.body);
            type = response.type || type;
        } catch (err) {
            status = 500;
            content = err.stack;
            type = 'text/plain';

        } finally {
            if (response || TEST_MODE) {
                res.writeHead(status, {
                    'Content-Length': Buffer.byteLength(content, 'utf8'),
                    'Content-Type': type,
                });
                res.end(content);
            }
        }
    });
    return server;
}
