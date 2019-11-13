var gulp = require('gulp');
var ts = require('gulp-typescript');
var merge = require('merge2');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglifyjs');

gulp.task('scripts', function() {
  gulp.src(['./public/scripts/*.js', './public/scripts/**/*.js', './public/scripts/**/**/*.js'])
    .pipe(concat('main.js'))
    .pipe(gulp.dest('./public/release/js'));
});

gulp.task('sass', function () {
  gulp.src('./public/scss/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./public/css'));
});
 
gulp.task('watch', function () {
  gulp.watch('./public/scss/*.scss', ['sass']);
  gulp.watch(['./public/scripts/*.js', './public/scripts/**/*.js', './public/scripts/**/**/*.js'], ['scripts']);
});