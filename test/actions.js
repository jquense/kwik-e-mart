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

    spy.should.have.been.calledWithExactly(actions.action.ACTION_ID, 'hi')
  })

  it('should generate actions', ()=> {
    var actions = btq.generateActions(['actionA', 'actionB'])

    actions.should.have.keys(['actionA', 'actionB'])

    ;(() => actions.actionA())
      .should.throw("the result of `generateActions()` must be passed to `createActions()` and not called directly");

    ;(() => btq.generateActions('actionA', 'actionB'))
      .should.throw("Expected an Array to be passed to `generateActions()`, but got: string");
  })

  it('should auto create async actions', ()=> {
    var spy = sinon.spy(btq, 'dispatch')
      , actions = btq.createActions({
          displayName: 'users',
          ...btq.generateActions(['updateUser'])
        })

    actions.updateUser.should.contain.keys(['success', 'failure'])

    actions.updateUser.success('hello')
    spy.should.have.been.calledWithExactly('users_updateUser__success', 'hello')

    actions.updateUser.failure('hello')
    spy.should.have.been.calledWithExactly('users_updateUser__failure', 'hello')
  })


  it('should create async responses in actions', done => {
    var spy = sinon.spy(btq, 'dispatch')
      , actions = btq.createActions({ 
          displayName: 'users',
          updateUser(data){ 
            this.success.should.be.a('function')
            this.failure.should.be.a('function')
            
            this.success('hello')
            spy.should.have.been.calledWithExactly('users_updateUser__success', 'hello')

            this.failure('hello')
            spy.should.have.been.calledWithExactly('users_updateUser__failure', 'hello')

            done()
          }
        })

      actions.updateUser()
  })
})