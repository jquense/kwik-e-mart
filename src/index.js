var Dispatcher = require('flux').Dispatcher


function ActionCreator(boutique){
  this.boutique
}

module.exports = class Boutique {

  constructor(){
    this.dispatcher = new Dispatcher()
  }

  dispatch(action, data){
    this.dispatcher.dispatch({ action, data })
  }

  createStore(){

  }

  generateActions(actions){
    if ( "production" !== process.env.NODE_ENV && !Array.isArray(actions))
      throw new Error("Expected an Array to be passed to `generateActions()`, but got: " + typeof actions)

    return transform(actions, (o, action) => o[action] = function(...args) {
      if ( "production" !== process.env.NODE_ENV && !this.dispatch)
        throw new Error("the result of `generateActions()` must be passed to `createActions()` and not called directly")

      this.dispatch(...args)
    }, {})
  }

  createActions(actions){

    return transform(actions, 
      (actions, val, key) =>
        actions[key] = val.bind({ actions, dispatch: (...data) => this.dispatch(key, data) })
    )
  }

}


// createActions({ 
//   ...boutique.generateActions('create')

//   )


function transform(obj, cb, seed){
  cb = cb.bind(null, seed = seed || (Array.isArray(obj) ? [] : {}))

  if( Array.isArray(obj)) 
    obj.forEach(cb)
  else
    for(var key in obj) if( obj.hasOwnProperty(key) ) 
      cb(obj[key], key, obj)

  return seed
}

function map(obj, cb){
  return transform(obj)
}