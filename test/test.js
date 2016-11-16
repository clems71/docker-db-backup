/* global describe it before */
'use strict'

const fs = require('fs')
const mongoc = require('mongodb').MongoClient
const mysql = require('mysql2/promise')
const wait = require('co-wait')

const api = require('../src/backup')

describe('backupDb url test', function () {
  describe('empty url ', function () {
    it('sould throw an exception', function * () {
      let raised = false
      try {
        yield api.backupDb('')
      } catch (err) {
        raised = true
      }
      raised.should.equal(true)
    })
  })

  describe('wrong url', function () {
    it('sould throw an exception', function * () {
      let raised = false
      try {
        yield api.backupDb('foobar')
      } catch (err) {
        raised = true
      }
      raised.should.equal(true)
    })
  })

  describe('not supported database format', function () {
    it('sould throw an exception', function * () {
      let raised = false
      try {
        yield api.backupDb('mariadb://user:pass@host')
      } catch (err) {
        raised = true
      }
      raised.should.equal(true)
    })
  })

  describe('invalid mongodb database host', function () {
    it('sould throw an exception', function * () {
      let raised = false
      try {
        yield api.backupDb('mongodb://test')
      } catch (err) {
        raised = true
      }
      raised.should.equal(true)
    })
  })
})

function * mysqlConnect (opts) {
  for (let i = 0; i < 10; i++) {
    try {
      return yield mysql.createConnection(opts)
    } catch (err) { }
    yield wait(1500)
  }
}

describe('backupDb test', function () {
  describe('backup mysql', function () {
    before(function * () {
      const client = yield mysqlConnect({
        host: 'mysql',
        user: 'root',
        password: '12345'
      })
      yield client.query('DROP DATABASE IF EXISTS testbase')
      yield client.query('CREATE DATABASE testbase')
      yield client.query('USE testbase')
      yield client.query('CREATE TABLE test (id INT,data VARCHAR(100))')
      yield client.query('INSERT INTO test VALUES (?),(?)', [[`0`, `foo`], [`1`, `bar`]])
    })

    it('is done', function * () {
      let raised = false
      let backupInfo
      try {
        backupInfo = yield api.backupDb('mysql://root:12345@mysql')
      } catch (err) {
        raised = true
      }
      raised.should.equal(false)
      let stats = fs.statSync(backupInfo.file)
      let fileSizeInBytes = stats.size
      fileSizeInBytes.should.greaterThan(40 * 1024)
    })
  })

  describe('backup mongodb', function () {
    before(function * () {
      let db = yield mongoc.connect('mongodb://mongodb')

      try {
        yield db.collection('test').drop()
      } catch (err) {}
      yield db.collection('test').insertMany(
        [{a: 0, b: 'foo'},
        {a: 1, b: 'bar'}])
      db.close()
    })

    it('is done', function * () {
      let raised = false
      let backupInfo
      try {
        backupInfo = yield api.backupDb('mongodb://mongodb')
      } catch (err) {
        raised = true
      }
      raised.should.equal(false)
      let stats = fs.statSync(backupInfo.file)
      let fileSizeInBytes = stats['size']
      fileSizeInBytes.should.greaterThan(1600)
    })
  })
})
