var Boutique = require('../src/index')

describe('actions', ()=> {
  var btq;

  beforeEach(()=> {
    btq = new Boutique()
  })

  it('should bind action context', ()=> {
    var spy = sinon.spy(btq, 'dispatch')
      , actions = btq.createActions({ 
          action(data){ 
            this.dispatch.should.be.a('function')
            this.actions.should.equal(actions)
            this.dispatch(data) 
          }
        })

    actions.action('hi')

    spy.should.have.been.calledWithExactly('action', 'hi')
  })

  it('should generate actions', ()=> {
    var actions = btq.generateActions(['actionA', 'actionB'])

    actions.should.have.keys(['actionA', 'actionB'])

    ;(() => actions.actionA())
      .should.throw("the result of `generateActions()` must be passed to `createActions()` and not called directly");

    ;(() => btq.generateActions('actionA', 'actionB'))
      .should.throw("Expected an Array to be passed to `generateActions()`, but got: string");
  })
})