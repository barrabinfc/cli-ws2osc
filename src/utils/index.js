/*
 * Helper functions somewhat equivalent to ramda
 */
export const constant = x => () => x
export const identity = x => x
export const nil = () => (undefined)
export const log = identifier => (...args) => {
  console.log(`${identifier}`, args)
}

export const clone = obj => Object.assign(obj.constructor(), obj)
export const merge = (obj, ...src) => Object.assign({}, obj, ...src)
export const includes = (arr, element) => (arr.indexOf(element) !== -1)
export const pluck = (arr, prop) => arr.map(c => getit(c, prop))

export const flatten = function(arr, result = []) {
  for (let i = 0, length = arr.length; i < length; i++) {
    const value = arr[i];
    if (Array.isArray(value)) {
      flatten(value, result);
    } else {
      result.push(value);
    }
  }
  return result;
};

// either( getit(object,'luke.father') , 'anakin' )
export const hasKey = (obj, key) => key in obj
export function getit(obj, key) {
  return key.split('.').reduce((nestedObject, key) => {
    if (nestedObject && key in nestedObject) {
      return nestedObject[key]
    }
    return undefined
  }, obj)
}

/**
 * swear( A , ...args) 
 *  returns A in a Promise.
 *    fulfilled if A != undefined or A(args) != undefined
 *    rejected if A == undefined or A(args) == undefined or exception
 */
export function swear( condition , args ) {
  let response = undefined
  if(condition == undefined){ response = Promise.reject(condition)
  } else if (! isType(condition, Function)) { response = Promise.resolve(condition) 
  } else { response = swear( condition(...args) ) }

  return response
}

/**
 * Transform a synchronous fn, that may trigger exception in a 
 * simple to use Promise.
 */
export function doit( fn, ...args ){
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

// either return A or B. if a is true, return A, else B
export const either = (val, fallback) => ((val === undefined || !val) ?
                                           fallback : val)


export const isObject = obj => obj && typeof obj === 'object'
export const isArray = arr => Array.isArray(arr)
export const isString = uvar => (typeof uvar === 'string' || uvar instanceof String)
export function isType( v , t ) {
  return (v !== null && v !== undefined 
          && v.constructor === t || v instanceof t);
}


/**
 * converts `obj` into an array of pairs [key, value]
 * @param  {Object} obj [description]
 * @return {Array}      Array of [key,value], ...
 */
export function toPairs( obj ) {
  let asPairs = []
  for( var key in obj ) {
    var pair = [key, obj[key]]
    asPairs.push( pair )
  }
  return asPairs
}

/**
 * converts Array of pairs to an Object
 * @param  {Array} array of [key, value] , ...
 * @return {Object}
 */
export function fromPairs( arrayPairs ) {
  let obj = {}
  for (var i = 0; i < arrayPairs.length; i++) {
    var [key,value] = arrayPairs[i]
    obj[key] = value
  }
  return obj
}


/**
 * Converts `p` to a true array, that can be mapped/reduced.
 * @param  {*} p
 * @return {Array}
 */
export function toArray( p ) {
  if( isType( p, Number) ||
      isType( p, Boolean) ) return [p]
  if( isType( p, NodeList) ) return [].slice.call( p )
  if( isType( p , Object) ) return toPairs( p )

  return [...p]
}



// Composition two or more functions (left to right)
const _pipe = (f, g) => (...args) => g(f(...args))
export const pipe = (...fns) => fns.reduce(_pipe)


/* Does A matches Regexp in candidates? */
export function matches(a, candidates) {
  return candidates.map((c) => c.exec(a) != null )
                         .reduce( (a,b) => (a || b))
}

