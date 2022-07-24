const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const open = require('open');
const source = require('vinyl-source-stream');
const gulpESLintNew = require('gulp-eslint-new');
const connect = require('gulp-connect');

var config = {
  name: 'XMTP Message Notification',
  root: 'dist',
  port: 8080,
  devBaseUrl: 'http://localhost',
}

gulp.task('lint', function () {
  return gulp.src('./src/**/*.js')
    .pipe(gulpESLintNew())
    .pipe(gulpESLintNew.format())
    .pipe(gulpESLintNew.failAfterError());
});

gulp.task('build', function (done) {
  browserify({ entries: './src/index.js', debug: true }).plugin('css-modulesify', {
    o: config.root + '/app.css'
  }).transform(babelify)
    .bundle()
    .pipe(source('app.bundle.js'))
    .pipe(gulp.dest(config.root))
    .pipe(connect.reload());

  done();
});

gulp.task('copy-static', function (done) {
  gulp.src('./static/**')
    .pipe(gulp.dest(config.root));

  done()
});

gulp.task('connect', function (done) {
  connect.server({
    name: 'XMTP Message Notification',
    root: 'dist',
    port: config.port,
    devBaseUrl: config.devBaseUrl,
    livereload: true
  });

  open(`${config.devBaseUrl}:${config.port}`)

  done();
});

gulp.task('watch', function () {
  gulp.watch('./static/*.*', gulp.series('copy-static'));
  // gulp.watch('./src/*/*.js', gulp.series('lint', 'build'));
  // gulp.watch('./src/**.css', gulp.series('build'));
});

gulp.task('default', gulp.series('copy-static', 'build'));