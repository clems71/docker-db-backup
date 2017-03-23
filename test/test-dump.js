/* global describe it before */
'use strict'

const _ = require('lodash')
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient
const mysql = require('mysql2/promise')
const wait = require('co-wait')
const pgp = require('pg-promise')()

const {dump, restore} = require('../src/dump-to-file')

function * mysqlConnect (opts) {
  for (let i = 0; i < 10; i++) {
    try {
      return yield mysql.createConnection(opts)
    } catch (err) { }
    yield wait(1500)
  }
}

before(function * () {
  this.db = {
    mongodb: yield MongoClient.connect('mongodb://mongodb'),
    mysql: yield mysqlConnect({ host: 'mysql' })
  }
})

describe('dump url', function () {
  it('empty url sould throw an exception', function * () {
    let raised = false
    try {
      yield dump('')
    } catch (err) {
      raised = true
    }
    raised.should.equal(true)
  })

  it('invalid url sould throw an exception', function * () {
    let raised = false
    try {
      yield dump('foobar')
    } catch (err) {
      raised = true
    }
    raised.should.equal(true)
  })

  it('not supported scheme sould throw an exception', function * () {
    let raised = false
    try {
      yield dump('mariadb://user:pass@host')
    } catch (err) {
      raised = true
    }
    raised.should.equal(true)
  })

  it('bad directory for `file` sould throw an exception', function * () {
    let raised = false
    try {
      yield dump('file:///unknown-dir?dumpName=dumpfile')
    } catch (err) {
      raised = true
    }
    raised.should.equal(true)
  })

  it('bad host for `mongodb` sould throw an exception', function * () {
    let raised = false
    try {
      yield dump('mongodb://test')
    } catch (err) {
      raised = true
    }
    raised.should.equal(true)
  })

  it('bad host for `mysql` sould throw an exception', function * () {
    let raised = false
    try {
      yield dump('mysql://test')
    } catch (err) {
      raised = true
    }
    raised.should.equal(true)
  })

  it('bad host for `postgres` sould throw an exception', function * () {
    let raised = false
    try {
      yield dump('postgres://test')
    } catch (err) {
      raised = true
    }
    raised.should.equal(true)
  })
})

const FAKE_DATA = _.times(2000, _id => {
  return {
    _id,
    data: `this is the dummy data with id = ${_id}`
  }
})

describe('dump local directory', function () {
  it('dump properly', function * () {
    const file = yield dump(`file://${__dirname}?dumpName=test-dir-backup`)
    let stats = fs.statSync(file)
    stats.size.should.greaterThan(128)
  })

  it('restore properly', function * () {
    const restoredDir = `${__dirname}.restored`
    const dumpFile = yield dump(`file://${__dirname}?dumpName=test-dir-backup`)
    yield restore(dumpFile, `file://${restoredDir}`)
    const origContent = fs.readFileSync(__filename)
    const restoredContent = fs.readFileSync(`${restoredDir}/test-dump.js`)
    _.isEqual(origContent, restoredContent).should.be.ok()
  })
})

describe('dump MongoDB', function () {
  before(function * () {
    try {
      yield this.db.mongodb.collection('test').drop()
    } catch (err) {}
    yield this.db.mongodb.collection('test').insertMany(FAKE_DATA)
  })

  it('dump properly', function * () {
    const file = yield dump('mongodb://mongodb')
    let stats = fs.statSync(file)
    stats.size.should.greaterThan(1600)
  })

  it('restore properly', function * () {
    const file = yield dump('mongodb://mongodb')
    yield this.db.mongodb.collection('test').drop();
    (yield this.db.mongodb.collection('test').count()).should.equal(0)
    yield restore(file, 'mongodb://mongodb')
    const data = yield this.db.mongodb.collection('test').find().toArray()
    _.isEqual(FAKE_DATA, data).should.be.ok()
  })
})

describe('dump MySQL', function () {
  before(function * () {
    const db = this.db.mysql
    yield db.query('DROP DATABASE IF EXISTS testbase')
    yield db.query('CREATE DATABASE testbase')
    yield db.query('USE testbase')
    yield db.query('CREATE TABLE test (id INT, data VARCHAR(100))')
    yield db.query('INSERT INTO test (id, data) VALUES ?', [_.map(FAKE_DATA, x => [x._id, x.data])])
  })

  it('works properly', function * () {
    const file = yield dump('mysql://mysql')
    let stats = fs.statSync(file)
    stats.size.should.greaterThan(1600)
  })
})

describe('dump Postgres', function () {
  before(function * () {
    const postgresDb = pgp('postgres://postgres:secret@postgres/testbase')
    this.db = {
      postgresql: yield postgresDb.connect()
    }
    const db = this.db.postgresql
    yield db.query('DROP TABLE IF EXISTS test')
    yield db.query('CREATE TABLE test (_id INT, data VARCHAR(100))')
    for (let entry of FAKE_DATA) {
      yield db.query('INSERT INTO test( _id, data ) values($1,$2)', [entry._id, entry.data])
    }
  })

  it('dump properly', function * () {
    const file = yield dump('postgres://postgres:secret@postgres/testbase')
    let stats = fs.statSync(file)
    stats.size.should.greaterThan(1600)
  })

  it('restore properly', function * () {
    const file = yield dump('postgres://postgres:secret@postgres/testbase')
    const db = this.db.postgresql
    yield db.query('DROP TABLE test')
    yield restore(file, 'postgres://postgres:secret@postgres/testbase')
    const data = _.map(yield db.any('SELECT * from test'), _.toPlainObject)
    FAKE_DATA.should.be.deepEqual(data)
  })
})
