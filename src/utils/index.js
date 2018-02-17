/*
 * Helper functions somewhat equivalent to ramda
 */
module.exports = {}

/**
 * Transform a synchronous fn, that may trigger exception in a 
 * simple to use Promise.
 */
module.exports.doit = function( fn, ...args ){
  let result = null
  return new Promise( (resolve,reject) => {
    try {
      result = fn(...args)
      resolve(result)
    } catch( error ) {
      reject(error)
    }
  })
}
