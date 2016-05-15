# gulp-jst-concat [![Build Status](https://travis-ci.org/tambourinecoder/gulp-jst-concat.png?branch=master)](https://travis-ci.org/tambourinecoder/gulp-jst-concat)
> A [gulp](http://gulpjs.com/) plugin to compile
[underscore](http://underscorejs.org/#template) / [lodash](http://lodash.com/docs#template)
views to a single JST file.


## Install
Install using [npm](https://npmjs.org/package/gulp-jst-concat).

    $ npm install gulp-jst-concat


## Usage
```javascript
var jade = require('gulp-jade')
  , jstConcat = require('gulp-jst-concat')

gulp.task('JST', function () {
  gulp.src('client/app/views/**/*jade')
    .pipe(jade())
    .pipe(jstConcat('jst.js', {
      renameKeys: ['^.*views/(.*).html$', '$1'],
      exportString: "this.JST"
    }))
    .pipe(gulp.dest('public/assets'))
})
```
This compiles all of your client-side views into a single file `jst.js`,
defining `this.JST = { /* template fns */ }`.

Let's say we have views located at
- `client/app/views/foo.jade` and
- `client/app/views/bar/baz.jade`.

Given the example's option `renameKeys: ['^.*views/(.*).html$', '$1']` those views
will now be accessible as compiled [lodash](http://lodash.com/docs#template) template functions via
- `JST['foo']` and
- `JST['bar/baz']`.

The `exportString` option makes it possible to put your compiled JST on to any object within your compiled template file. You can specify any object that is accessible to the file, `window.JST` or `module.exports` if you want to use it with browserify.

(Please note that `gulp-jst-concat` doesn't have to be used in conjunction with `gulp-jade`. Any input-stream emitting html-ish file contents will do.)


## Options

renameKeys
----------
Type `[String, String]`

Control your `JST` keys by RegExp-replacing the input file's `path` property.

This will default to `['.*', '$&']` (i.e. a template's key will just be it's input file's `path`).


## License
MIT
