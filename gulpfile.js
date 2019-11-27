var es = require('event-stream');
var gulp = require('gulp');
var RevAll = require('gulp-rev-all');
var revdel = require('gulp-rev-delete-original');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var connect = require('gulp-connect');
var templateCache = require('gulp-angular-templatecache');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var fs = require('fs');
var _ = require('lodash');
var gulpSequence = require('gulp-sequence');
var replace = require('gulp-replace');
var gutil = require('gulp-util');
var execSync = require('child_process').execSync;
var path = require('path');
var rootDir = 'src';
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var livereload = require('gulp-livereload');
var fileExists = require('file-exists');

var scripts = require('./app.scripts.json');

var source = {
  js: {
    main: 'src/app/main.js',
    src: [
      // application config
      'src/app.config.js',

      // application bootstrap file
      'src/app/main.js',

      // main module
      'src/app/app.js',
      'src/app/app.run.js',

      // module files
      'src/app/**/module.js',

      // other js files [controllers, services, etc.]
      'src/app/**/!(module)*.js'
    ],
    tpl: 'src/app/**/*.tpl.html',
    css: 'src/styles/**/*.css'
  }
};

var destinations = {
  js: 'src/build'
};

gulp.task('build_info', function() {
  var version = execSync('git rev-parse --verify HEAD --short')
    .toString()
    .trim();
  return string_src(
    'app_version.js',
    'var MERMAID_VERSION="local-' + version + '";'
  ).pipe(gulp.dest(destinations.js));
});

gulp.task('build', function() {
  return (
    es
      .merge(gulp.src(source.js.src), getTemplateStream())
      .pipe(ngAnnotate())
      // .pipe(uglify())
      .pipe(concat('app.js'))
      .pipe(gulp.dest(destinations.js))
  );
});

gulp.task('js', function() {
  return es
    .merge(gulp.src(source.js.src), getTemplateStream())
    .pipe(concat('app.js'))
    .pipe(gulp.dest(destinations.js))
    .pipe(livereload());
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch(source.js.src, ['js']);
  gulp.watch(source.js.tpl, ['js']);
  gulp.watch(source.js.css, ['js']);
});

gulp.task('connect', function() {
  connect.server({
    root: ['src'],
    port: 8888,
    debug: false,
    livereload: false
  });
});

gulp.task('lint', function() {
  return gulp
    .src('./src/build/app.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'));
});

gulp.task('dev-lint', function() {
  return gulp
    .src([
      '!./src/app/_common/**/*.js',
      // '!./src/app/_common/*.js',
      '!./src/app/layout/**/*.js',
      // '!./src/app/_layout/*.js',
      './src/app/**/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('build-files-exist', function() {
  'use strict';

  var filePathExists = function(fileName) {
    var filePath = destinations.js + '/' + fileName + '.js';
    fileExists(filePath, function(err, exists) {
      if (exists === false) {
        console.log(filePath + ' does not exist.');
        process.exit(1);
      }
    });
  };

  // Check if vendor libraries exist
  _.forIn(scripts.chunks, function(chunkScripts, chunkName) {
    filePathExists(chunkName);
  });
  // Check if app code exists
  filePathExists('app');
});

gulp.task('vendor', function() {
  _.forIn(scripts.chunks, function(chunkScripts, chunkName) {
    var paths = [];
    chunkScripts.forEach(function(script) {
      var scriptFileName = scripts.paths[script];

      if (!fs.existsSync(__dirname + '/' + scriptFileName)) {
        throw console.error(
          "Required path doesn't exist: " + __dirname + '/' + scriptFileName,
          script
        );
      }
      paths.push(scriptFileName);
    });
    gulp
      .src(paths)
      .pipe(concat(chunkName + '.js'))
      //.on('error', swallowError)
      .pipe(gulp.dest(destinations.js));
  });
});

// -- SERVICE WORKER --
gulp.task('generate-sw', function(callback) {
  var swPrecache = require('sw-precache');

  swPrecache.write(
    path.join(rootDir, 'sw.js'),
    {
      staticFileGlobs: [
        rootDir +
          '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff,woff2,json,pdf}'
      ],
      stripPrefix: rootDir,
      navigateFallback: '/index.html',
      handler: 'offlineFirst',
      verbose: true,
      maximumFileSizeToCacheInBytes: 5242880
    },
    callback
  );
});

gulp.task('prod', ['vendor', 'build', 'lint']);
gulp.task('dev', ['vendor', 'build', 'lint']);
gulp.task('dev-run', ['vendor', 'js', 'connect']);
gulp.task('local', [
  'build_info',
  'vendor',
  'js',
  'generate-sw',
  'dev-lint',
  'watch',
  'connect'
]);
gulp.task('default', ['local']);

var swallowError = function(error) {
  console.log(error.toString());
  this.emit('end');
};

var getTemplateStream = function() {
  return gulp.src(source.js.tpl).pipe(
    templateCache({
      root: 'src/app/',
      module: 'app'
    })
  );
};

function string_src(filename, string) {
  var src = require('stream').Readable({ objectMode: true });
  src._read = function() {
    this.push(
      new gutil.File({
        cwd: '',
        base: '',
        path: filename,
        contents: new Buffer(string)
      })
    );
    this.push(null);
  };
  return src;
}
