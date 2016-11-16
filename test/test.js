const api = require('../src/backup')
const mysql = require('mysql')
const fs = require('fs')
const mongoc = require('mongodb').MongoClient

'use strict'

describe('backupDb url test:', function () {
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
      this.timeout(15000)
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

describe('backupDb test:', function () {
  describe('backup mysql', function () {
    before(function * () {
      let client = mysql.createConnection({
        host: 'db1',
        user: 'root',
        password: '12345'
      })
      client.query('DROP DATABASE IF EXISTS testbase')
      client.query('CREATE DATABASE testbase')
      client.changeUser({database: 'testbase'})
      client.query('CREATE TABLE test (id INT,data VARCHAR(100))')
      client.query('INSERT INTO test VALUES (?),(?)', [[`0`, `foo`], [`1`, `bar`]])
      client.end()
    })
    it('is done', function * () {
      this.timeout(15000)
      let raised = false
      let backupInfo
      try {
        backupInfo = yield api.backupDb('mysql://root:12345@db1')
      } catch (err) {
        raised = true
      }
      raised.should.equal(false)
      let stats = fs.statSync(backupInfo.file)
      let fileSizeInBytes = stats['size']
      fileSizeInBytes.should.greaterThan(4000000)
    })
  })
  describe('backup mongodb', function () {
    before(function * () {
      let db = yield mongoc.connect('mongodb://db2')
      yield db.collection('test').insertMany(
        [{a: 0, b: 'foo'},
        {a: 1, b: 'bar'}])
      db.close()
    })
    after(function * () {
      let db = yield mongoc.connect('mongodb://db2')
      yield db.collection('test').drop()
      db.close()
    })
    it('is done', function * () {
      this.timeout(15000)
      let raised = false
      let backupInfo
      try {
        backupInfo = yield api.backupDb('mongodb://db2')
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
