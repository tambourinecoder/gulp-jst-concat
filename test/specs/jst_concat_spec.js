/* jshint -W068 */
/* global expect, describe, context, it */
"use strict";

var Vinyl = require('vinyl')
  , vm = require('vm')

function runInSandbox (str) {
  var sandbox = { _: require('lodash') }
  vm.runInNewContext(str, sandbox)
  return sandbox
}

function makeFile (path, contents) {
  var buffer = new Buffer(String(contents))
  return new Vinyl({ path: path, contents: buffer })
}

function writeFiles (stream, files, callback) {
  stream.on('data', callback)

  files.forEach(stream.write)
  stream.end()
}


describe('jstConcat', function () {
  var jstConcat = require('../../lib')

  it('blows up when no fileName is specified', function () {
    (function() { jstConcat() }).should.throw(/^Missing fileName$/)
  })

  it('returns a gulp file', function (done) {
    var stream = jstConcat('file.html')

    writeFiles(stream, [], function onData (file) {
      file.path.should.equal('file.html')
      file.contents.should.be.ok
      done()
    })
  })

  describe('JST keys', function () {
    var file1 = makeFile('/abs/path/views/one/foo.html')
      , file2 = makeFile('/abs/path/views/two/bar.html')

    context('when the renameKeys option is not present', function () {
      it('it uses unmodified file paths', function (done) {
        var stream = jstConcat('file.html')

        writeFiles(stream, [file1, file2], function onData (file) {
          var JST = runInSandbox(file.contents).JST
          expect(JST).to.have.keys(['/abs/path/views/one/foo.html', '/abs/path/views/two/bar.html'])
          done()
        })
      })
    })

    context('when the renameKeys option is present', function () {
      it('respects the specified regex pattern', function (done) {
        var stream = jstConcat('file.html', {
          renameKeys: ['^.*views/(.*).html$', '$1']
        })

        writeFiles(stream, [file1, file2], function onData (file) {
          var JST = runInSandbox(file.contents).JST
          expect(JST).to.have.keys(['one/foo', 'two/bar'])
          done()
        })
      })
    })
  })

  it('compiles file contents to underscore/lodash template functions', function (done) {
    var stream = jstConcat('file.html')
      , file1 = makeFile('foo', '<h1>Template1: <%= val %></h1>')
      , file2 = makeFile('bar', '<h2>Template2: <%= val %></h2>')

    writeFiles(stream, [file1, file2], function onData (file) {
      var JST = runInSandbox(file.contents).JST

      JST.foo({ val: 'one' }).should.equal('<h1>Template1: one</h1>')
      JST.bar({ val: 'two' }).should.equal('<h2>Template2: two</h2>')
      done()
    })
  })
})
