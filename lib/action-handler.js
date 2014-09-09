

module.exports = Clank.extend({

  constructor: function(listensFor, fn){
    this.listensFor = [].concat(listensFor)
    this.fn = fn
  },

  matches: function(actionType){
    returns _.contains(this.listensFor, type)
  },

  execute: function(data, thisArg){
    this.fn.apply(thisArg, [].concat(data))
  }

})