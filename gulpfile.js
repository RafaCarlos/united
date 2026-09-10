var gulp = require('gulp');
var sass = require('gulp-sass');
var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

//task para o sass
gulp.task('sass', function () {
    return gulp.src('assets/sass/*.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(gulp.dest('assets/css'));
});

//task para o watch
gulp.task('watch', function () {
    gulp.watch('assets/sass/*.scss', ['sass']);
});

gulp.task('scripts', function() {
    gulp.src(['assets/js/lib/jquery-3.1.1.min.js', 'assets/js/lib/jquery.mask.min.js', 'assets/js/lib/slick.js', 'assets/js/lib/wow.min.js', 'assets/js/lib/detect-mobile.js', 'assets/js/lib/structure.js'])
        .pipe(concat('scripts.js'))
        .pipe(uglify())
        .pipe(gulp.dest('assets/js/dist/'))
});

//task default gulp
gulp.task('default', ['sass', 'watch', 'scripts']);