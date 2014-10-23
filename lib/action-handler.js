'use strict';
var Clank = require('clank')

module.exports = Clank.Object.extend({

  constructor: function ActionHandler(listensFor, fn){
    this.listensFor = [].concat(listensFor)
    this.fn = fn
  },

  matches: function(actionType){
    return this.listensFor.indexOf(actionType) !== -1
  },

  execute: function(thisArg, data){
    this.fn.apply(thisArg, [].concat(data))
  }

})