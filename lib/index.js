'use strict';

var gUtil = require( 'gulp-util' ),
	PluginError = gUtil.PluginError,
	File = gUtil.File,
	through = require( 'through' ),
	_ = require( 'lodash' ),
	printf = require( 'util' )
	.format;

function pluginError( message ) {
	return new PluginError( 'gulp-jst-concat', message );
}

function compile( file, opts ) {
	var renameKeys = opts.renameKeys;
	var name = file.path.replace( new RegExp( renameKeys[ 0 ] ), renameKeys[ 1 ] ),
		contents = String( file.contents ),
		supplementalSource, templateSource;
	if ( opts.client ) {
		var parts = contents.split( 'function template' );
		supplementalSource = parts[ 0 ];
		templateSource = 'function ' + parts[ 1 ];
	}
	return {
		name: name,
		supplementalSource: supplementalSource,
		fnSource: opts.client ? templateSource : _.template( contents, {
				'variable': 'locals'
			} )
			.source
	};
}

function buildJSTString( files, opts ) {
	function compileAndRender( file ) {
		var template = compile( file, opts );
		var source;
		if ( opts.execTemplateFn ){
			if ( !Array.isArray( opts.execTemplateFn ) ){
				opts.execTemplateFn = [ opts.execTemplateFn ];
			}
			source = eval( template.fnSource ).apply( null, opts.execTemplateFn )
		} else {
			source = template.fnSource
		}


		return {
			supplementalSource: template.supplementalSource,
			source: printf( '"%s": %s', template.name, source )
		};
	}

	var parsed = files.map( compileAndRender );

	return {
		declarations: printf( '%s = {%s};', opts.exportString, parsed.map( ( o ) => o.source )
			.join( ',\n' ) ),
		// hack to grab the longest source instead of overlaying all of the definitions
		supplementalSource: parsed.map( ( o ) => o.supplementalSource )
			.reduce( ( c, s ) => s.length > c.length ? s : c, '' )
	};
}

module.exports = function jstConcat( fileName, _opts ) {
	if ( !fileName ) throw pluginError( 'Missing fileName' );

	var defaults = {
			renameKeys: [ '.*', '$&' ],
			exportString: 'this.JST'
		},
		opts = _.defaults( _opts, defaults ),
		files = [];

	function write( file ) {
		/* jshint validthis: true */
		if ( file.isNull() ) return;
		if ( file.isStream() ) return this.emit( 'error', pluginError( 'Streaming not supported' ) );

		files.push( file );
	}

	function end() {
		/* jshint validthis: true */
		var jstStrings = buildJSTString( files, opts );

		if ( _opts.requireLoDash ) jstStrings.supplementalSource = "var _ = require('lodash');\n".concat( jstStrings.supplementalSource );

		this.queue( new File( {
			path: fileName,
			contents: new Buffer( jstStrings.supplementalSource.concat( '\n', jstStrings.declarations ) )
		} ) );

		this.queue( null );
	}

	return through( write, end );
};
