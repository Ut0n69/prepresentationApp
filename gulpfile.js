var gulp = require('gulp');
var ejs = require('gulp-ejs');
var sass = require('gulp-sass');
var rename = require('gulp-rename');

// ejs
gulp.task('ejs', function() {
  gulp.src(['./src/*.ejs', '!./src/**/_*.ejs'])
    .pipe(ejs())
    .pipe(rename({
      extname: '.html'
    }))
    .pipe(gulp.dest('./public'));
});

gulp.task('ejs:watch', ['ejs'], function() {
  gulp.watch('./src/*.ejs', ['ejs']);
  gulp.watch('./src/view/*.ejs', ['ejs']);
});

// sass
gulp.task('sass', function() {
  gulp.src('./src/sass/style.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('sass:watch', function() {
  gulp.watch('./src/sass/style.scss', ['sass']);
});

gulp.task('default', ['ejs', 'ejs:watch', 'sass', 'sass:watch']);
