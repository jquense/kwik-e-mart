var Dispatcher = require('flux').Dispatcher

module.exports = class Boutique {

  constructor(){
    this.dispatcher = new Dispatcher()
  }

  dispatch(action, data){
    this.dispatcher.dispatch({ action, data })
  }

  createStore(){

  }

  createActions(actionClass){

    
  }

}