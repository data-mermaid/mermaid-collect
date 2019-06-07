// Karma configuration
// Generated on Thu Feb 21 2019 10:29:58 GMT-0800 (PST)

module.exports = function(config) {
  config.set({
    // plugins: ['karma-ng-html2js-preprocessor'],
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    preprocessors: {
      './src/app/**/*.html': 'ng-html2js',
      './src/styles/**/*.css': 'ng-html2js'
    },
    files: [
      { pattern: './src/build/vendor.js', watch: false },
      { pattern: './src/build/vendor.ui.js', watch: false },
      {
        pattern: 'node_modules/angular-mocks/angular-mocks.js',
        watch: false
      },
      { pattern: './src/auth0-variables.js', watch: false },
      { pattern: './src/build/app_version.js', watch: false },
      {
        pattern:
          './src/standalone_libs/angular-leaflet/dist/angular-leaflet-directive.min.js',
        watch: false
      },
      // { pattern: './src/styles/**/*.css', watch: false, type: 'css' },
      // { pattern: './src/app/**/*.html', watch: false, type: 'html' },
      { pattern: './src/build/app.js', watch: true },

      { pattern: './tests/**/*.spec.js', watch: true }
    ],

    // list of files / patterns to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor

    // ngHtml2JsPreprocessor: {
    //   moduleName: 'templates',
    //   cacheIdFromPath: function(filepath) {
    //     return filepath.replace('src', '');
    //   }
    // },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};
