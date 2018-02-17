#!/usr/bin/env node

/**
 * This plays movies and responds to remote control OSC
 */
const appname = 'SmartyVideoClient'
const OSC = require('osc-js')


let clientSID = 0

let config = {}
let osc = new OSC({plugin: new OSC.DatagramPlugin({open: {port: 41234}})})
osc.open()

osc.on('open',_ => {
    console.log(`Listening at: 41234`)
    console.log(`${appname} is remote enabled. `)

}) // default port 41234

osc.on('/', console.log )
osc.on('/hi/world', (m) => {
    console.log("Oh hello ", clientSID++,m );

    setTimeout( _ => {
	    var message = new OSC.Message('/hi/mate')
	    osc.send(message)
    }, 1000);
})
osc.on('close', console.log )
osc.on('error', console.error )
