var _ = require('lodash')
  , Clank = require('clank')

module.exports = Clank.Object.extend({

  constructor: function(listensFor, fn){
    this.listensFor = [].concat(listensFor)
    this.fn = fn
  },

  matches: function(actionType){
    return _.contains(this.listensFor, actionType)
  },

  execute: function(thisArg, data){
    this.fn.apply(thisArg, [].concat(data))
  }

})