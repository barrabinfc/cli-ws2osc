#!/usr/bin/env node
'use strict';

const pkg = require('../package.json')
const os = require('os')

const meow = require('meow') 
const chalk = require('chalk')
const osc = require('osc-js')
const ip = require('ip')
const fs = require('fs')
const https = require('https')
const cors = require('cors')

const express = require('express');

const oscbridge = require('../src/oscbridge')
const f = require( '../src/utils/index' )

let cli_usage = `
Usage:
$ osc2browsers 

Options:
--wsAddr, -a       Interface with port, generally localhost or 0.0.0.0:8080
--udpServer, -d    Server:Port to send OSC Messages. Can be multicast

--friendness       Say your local area IP

--mdns, -m         Use .local(LAN) address? Overides wsAddr

Examples:
$ osc2browsers -d localhost:8080
............................
. Connecting to OSC Server:8080 ... OK !🌈
. The WS Address is:
. 
. === http://machine.local:9090 ==
.
. Thats it! Just let it in the background.
.
. Press <Ctrl-C> to quit.
`
let cli_flags = {
        'friendness': { type: 'boolean', default: false },
        'mdns': {
            type: 'boolean',
            alias: 'm',
            default: false 
        },
		'wsAddr': {
			type: 'string',
            alias: 'a',
            default: '0.0.0.0:8080',
        },
        'udpClient': {
            type: 'string',
            alias: 'd',
            default: 'localhost:41234',
        },
        'privateKey': {
            type: 'string',
	    alias: 'k',
            default: 'sslcert/key.pem'
        },
        'certificate': {
            type: 'string',
	    alias: 'c',
            default: 'sslcert/cert.pem'
        }
}

const defaultOptions = {
    udpServer: {
      host: 'localhost',
      port: 41235,
      exclusive: false
    },
    udpClient: {
        host: 'localhost',    // @param {string} Hostname of udp client for messaging
        port: 41234           // @param {number} Port of udp client for messaging
    },
    wsServer: {
        host: '0.0.0.0',      // @param {string} Hostname of WebSocket server
        port: 8080            // @param {number} Port of WebSocket server
    },
    httpServer: {
        enabled: true,
        port: 8080,
        privateKey:  'sslcert/key.pem',
        certificate: 'sslcert/cert.pem', 
    }
}

/**
 * 
    var privateKey  = fs.readFileSync('sslcert/key.pem', 'utf8');
    var certificate = fs.readFileSync('sslcert/cert.pem', 'utf8');
 
    var credentials = {key: privateKey, cert: certificate};
 */

function parse_options(cli){
    let [ws_host, ws_port] = cli.flags.wsAddr.split(':')
    let [udp_host, udp_port] = cli.flags.udpClient.split(':')

    defaultOptions.wsServer.host = ws_host
    defaultOptions.wsServer.port = ws_port
    defaultOptions.udpClient.host = udp_host
    defaultOptions.udpClient.port = udp_port

    defaultOptions.httpServer.privateKey = cli.flags.privateKey    
    defaultOptions.httpServer.certificate = cli.flags.certificate
    
    return defaultOptions
}

/**
 * The bridge between Websocket and UDP, using osc-js.
 * Use it as a dropin tool for Max/Msp/SuperCollider & other apps. 
 * 
 * This will bind a websocket,
 *          and forward every message to the 'udpServer'. 
 * And back and forth. Every message by udpServer is received by ws and forwarded.
 *    
 */

let cli = meow(cli_usage, {flags: cli_flags, autoHelp: true, version: pkg.version})
let options = parse_options(cli)

let localIP = ip.address()
let localName = ( os.hostname() + '.local' )
let listenAddr   = ( cli.flags.mdns ? localName : localIP )

let bridge = undefined

/* Start a HTTPS server, if needed */
if(options.httpServer.enabled){
    var privateKey  = fs.readFileSync( options.httpServer.privateKey, 'utf8');
    var certificate = fs.readFileSync( options.httpServer.certificate, 'utf8');
 
    var credentials = {key: privateKey, cert: certificate};
    var app = express();
 
    //... Express static files and CORS
    let static_dirname = process.cwd()
    app.use(express.static( static_dirname ))
    app.use(cors())
    app.get('/', (req, res) => res.send('Hello OSCBridge World!'))

    //pass in your express app and credentials to create an https server
    console.log(`Creating https server... ${chalk.green(`OK`)}`);
    console.log(`Serving static files...  ${chalk.cyan(static_dirname)}`)
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen( options.httpServer.port );

    /** Use the server concurrently with wss */
    options.wsServer.server = httpsServer
}

/* Guard agains all exceptions */
process.on('uncaughtException', (err) => {
    fs.writeSync(1, `Caught exception: ${err}\n`);
    console.log(err.stack)
    bridge.close()
    setTimeout(retry, 1000)
});

function printAddresses(){
    let osc_p = `${chalk.green(`osc://${options.udpClient.host}:${options.udpClient.port}`)}`
    let ws_p  = `${chalk.green(`http://${listenAddr}:${options.wsServer.port}`)}`

    console.log(` 🌈       ${osc_p} <-> ${ws_p}

Thats it! Just let it in the background.

Press ${chalk.red('<Ctrl-C>')} to quit.`)
}

function retry(tries=1){
    // Please avoid infinite loop. Or not if tries < 0
    if(tries==0) return

    f.doit( function() {

        console.log('Creating bridge .... \n')
        bridge = oscbridge.createBridge( options )

        if(options.wsServer.server){
            printAddresses()
       } else {
            bridge.on('open', printAddresses)
       }
       
        bridge.on('error', console.error )
        bridge.on('close', () => {
            console.info("Bye bye (close)...")
        })

    }).catch( function(e) {
        bridge = undefined
        console.error("Error",e)
        retry(tries-1)
     })
}

retry(2)
