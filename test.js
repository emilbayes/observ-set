'use strict'

var test = require('tape')
var ObservWeakSet = require('.')
var Observ = require('observ')

test('ObservWeakSet is a function', function (assert) {
  assert.equal(typeof ObservWeakSet, 'function')
  assert.end()
})

test('ObservWeakSet has Set API', function (assert) {
  var set = ObservWeakSet()

  assert.equal(typeof set.add, 'function')
  assert.equal(typeof set.delete, 'function')
  assert.equal(typeof set.has, 'function')

  assert.end()
})

test('ObservWeakSet initial array', function (assert) {
  var foo = {}
  var bar = {}
  var baz = {}
  var set = ObservWeakSet([foo, bar, foo])

  assert.ok(set.has(foo))
  assert.ok(set.has(bar))
  assert.notOk(set.has(baz))
  assert.end()
})
test('ObservWeakSet custom hash function', function (assert) {
  var foo = {id: 1}
  var bar = Observ({id: 1})
  var baz = {id: 2}
  var set = ObservWeakSet([foo], function (obj) {
    return obj.id
  })

  assert.ok(set.has(foo))
  assert.ok(set.has(bar))
  assert.notOk(set.has(baz))
  assert.end()
})
test('ObservWeakSet mutations', function (assert) {
  var set = ObservWeakSet(null, function (obj) {
    return obj.id
  })
  var nChanges = 0

  var removeListener = set(function () {
    nChanges++
  })

  set.add({id: 1})
  set.add({id: 3})
  set.add(Observ({id: 2}))
  set.delete({id: 1})
  set.has({id: 3})
  set.add({id: 2}) // Already in the set
  set.add({id: 4})
  set.delete({id: 2})
  set.has({id: 4})
  set.has({id: 2})
  set.delete({id: 3})
  set.has({id: 3})

  removeListener()

  set.add({id: 2})
  set.delete({id: 1})

  assert.equal(nChanges, 7)
  assert.end()
})
test('ObservWeakSet set', function (assert) {
  var foo = {}
  var bar = {}
  var baz = {}
  var set = ObservWeakSet([foo, bar, foo])

  var nChanges = 0

  set(function () {
    nChanges++
  })

  set.set([baz])

  assert.notOk(set.has(foo))
  assert.notOk(set.has(bar))
  assert.ok(set.has(baz))
  assert.equal(nChanges, 1)
  assert.end()
})
test('ObservWeakSet transactions', function (assert) {
  var set = ObservWeakSet(null, function (obj) {
    return obj.id
  })

  var nChanges = 0
  set(function () {
    nChanges++
  })

  set.transaction(function (rawSet) {
    rawSet.add({id: 1})
    rawSet.add({id: 3})
    rawSet.add({id: 2})
    rawSet.add({id: 2})
    rawSet.add({id: 2})
    rawSet.add(Observ({id: 2}))
    rawSet.delete({id: 1})
    rawSet.add({id: 4})
    rawSet.delete({id: 2})
    rawSet.delete({id: 3})

    rawSet.forEach(function (value, _, nestedSet) {
      nestedSet.has(value)
    })
  })

  assert.notOk(set.has({id: 1}))
  assert.notOk(set.has({id: 2}))
  assert.notOk(set.has({id: 3}))
  assert.ok(set.has({id: 4}))

  assert.equal(nChanges, 1)
  assert.end()
})
