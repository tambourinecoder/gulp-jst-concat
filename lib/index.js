"use strict";

var gUtil = require('gulp-util')
  , PluginError = gUtil.PluginError
  , File = gUtil.File
  , through = require('through')
  , _ = require('lodash')
  , printf = require('util').format


function pluginError (message) {
  return new PluginError('gulp-jst-concat', message)
}

function compile (file, renameKeys) {
  var name = file.path.replace(new RegExp(renameKeys[0]), renameKeys[1])
    , contents = String(file.contents)

  return {
    name: name,
    fnSource: _.template(contents, null, { 'variable': 'data' }).source
  }
}

function buildJSTString(files, renameKeys) {
  function compileAndRender (file) {
    var template = compile(file, renameKeys)
    return printf('"%s": %s', template.name, template.fnSource)
  }

  return printf('this.JST = {%s};', files.map(compileAndRender).join(',\n'))
}

module.exports = function jstConcat(fileName, _opts) {
  if (!fileName) throw pluginError('Missing fileName')

  var defaults = { renameKeys: ['.*', '$&'] }
    , opts = _.extend({}, defaults, _opts)
    , files = []

  function write (file) {
    /* jshint validthis: true */
    if (file.isNull()) return
    if (file.isStream()) return this.emit('error', pluginError('Streaming not supported'))

    files.push(file)
  }

  function end () {
    /* jshint validthis: true */
    var jstString = buildJSTString(files, opts.renameKeys)

    this.queue(new File({
      path: fileName,
      contents: new Buffer(jstString)
    }))

    this.queue(null)
  }

  return through(write, end)
}
