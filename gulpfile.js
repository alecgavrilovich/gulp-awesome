const gulp            = require('gulp');
const browserSync     = require('browser-sync');
const sass            = require('gulp-sass');
const autoprefixer    = require('gulp-autoprefixer');
const sourcemaps      = require('gulp-sourcemaps');
const useref          = require('gulp-useref');
const babel           = require('gulp-babel');
const uglify          = require('gulp-uglify');
const gulpIf          = require('gulp-if');
const cssnano         = require('gulp-cssnano');
const pug             = require('gulp-pug')
const htmlmin         = require('gulp-htmlmin');
const imagemin        = require('gulp-imagemin');
const cache           = require('gulp-cache');
const del             = require('del');
const runSequence     = require('run-sequence');

// Basic Gulp task syntax
gulp.task('hello', function() {
  console.log('Hello World!');
})

// Development Tasks 
// -----------------

// Start browserSync server
gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: 'app'
    },
    notify: false
  })
})

// Preprocesing pug files to html
gulp.task('pug', function() {
  return gulp.src('app/assets/pug/index.pug') // Gets all files ending with .pug in app/assets/pug and children dirs
    .pipe(pug({
      pretty: true
    })) // Passes it through a gulp-pug, log errors to console
    .pipe(gulp.dest('app/')) // Outputs it in the index.html to app folder
    .pipe(browserSync.reload({ // Reloading with Browser Sync
      stream: true
    }));
})

// Preprocesing scss files to css
gulp.task('sass', function() {
  return gulp.src('app/assets/scss/**/*.scss') // Gets all files ending with .scss in app/scss and children dirs
    .pipe(sass().on('error', sass.logError)) // Passes it through a gulp-sass, log errors to console
    .pipe(gulp.dest('app/assets/css')) // Outputs it in the css folder
    .pipe(browserSync.reload({ // Reloading with Browser Sync
      stream: true
    }));
})


// Watchers
gulp.task('watch', function() {
  gulp.watch('app/assets/scss/**/*.scss', ['sass']);
  gulp.watch('app/assets/pug/index.pug', ['pug']);
  //gulp.watch('app/index.html', browserSync.reload);
  gulp.watch('app/assets/js/**/*.js', browserSync.reload);
})


// Optimization Tasks 
// ------------------

// Optimizing CSS and JavaScript 
gulp.task('useref', function() {
  return gulp.src('app/*.html')
    .pipe(sourcemaps.init())
      .pipe(useref())
      .pipe(gulpIf('*.js', babel({
              presets: ['es2015']
          })))
      .pipe(gulpIf('*.js', uglify()))
      .pipe(gulpIf('*.css', cssnano()))
      .pipe(gulpIf('*.html', htmlmin({collapseWhitespace: true})))
    .pipe(sourcemaps.write('../maps'))
    .pipe(gulp.dest('dist'));
});


// Optimizing Images 
gulp.task('images', function() {
  return gulp.src('app/assets/img/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching img that ran through imagemin
    .pipe(cache(imagemin({
      interlaced: true,
    })))
    .pipe(gulp.dest('dist/assets/img'))
});


// Copying fonts 
gulp.task('fonts', function() {
  return gulp.src('app/assets/fonts/**/*')
    .pipe(gulp.dest('dist/assets/fonts'))
})


// Cleaning 
gulp.task('clean', function() {
  return del.sync('dist').then(function(cb) {
    return cache.clearAll(cb);
  });
})

gulp.task('clean:dist', function() {
  return del.sync(['dist/**/*', '!dist/img', '!dist/img/**/*']);
});


// Build Sequences
// ---------------

gulp.task('default', function(callback) {
  runSequence(['pug', 'sass', 'browserSync'], 'watch',
    callback
  )
})

gulp.task('build', function(callback) {
  runSequence(
    'clean:dist',
    'pug',
    'sass',
    ['useref', 'images', 'fonts'],
    callback
  )
})
