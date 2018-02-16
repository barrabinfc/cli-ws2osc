const OSC = require('osc-js')
  
let osc_bridge = undefined
function  createBridge(options){
    osc_bridge = new OSC({ plugin: new OSC.BridgePlugin(options) })
    osc_bridge.open()

    return osc_bridge
}

module.exports = {}
module.exports.createBridge = createBridge