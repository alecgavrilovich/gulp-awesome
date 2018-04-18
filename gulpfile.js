const gulp = require('gulp');
const browserSync = require('browser-sync');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const useref = require('gulp-useref');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const gulpIf = require('gulp-if');
const cssnano = require('gulp-cssnano');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const del = require('del');
const runSequence = require('run-sequence');

// List of javascript files (in order) to concatenate
let config = {
  jsConcatFiles: ['./app/src/js/script.js']
};

// Error function - this function prevets browsersync session from crashing on error
let errorlog = err => {
  console.error(err.message);
  this.emit('end');
};

// -----------------
// Development Tasks
// -----------------

gulp.task('html', () => {
  gulp.src('app/*.html').pipe(
    browserSync.reload({
      // Reloading with Browser Sync
      stream: true
    })
  );
});

// Procesing scss files to css
gulp.task('sass', () => {
  gulp
    .src('app/src/scss/*.scss') // Gets all files ending with .scss in app/scss and children dirs
    .pipe(sass().on('error', sass.logError)) // Passes it through a gulp-sass, log errors to console
    .pipe(autoprefixer())
    .pipe(gulp.dest('app/src/css')) // Outputs it in the css folder
    .pipe(
      browserSync.reload({
        stream: true
      })
    );
});

// Compile js files with babel and concat
gulp.task('babel', () => {
  gulp
    .src(config.jsConcatFiles)
    .pipe(concat('temp.js'))
    .pipe(
      babel({
        presets: ['es2015']
      })
    )
    .pipe(rename('app.js'))
    .pipe(gulp.dest('app/src/js'))
    .pipe(
      browserSync.reload({
        stream: true
      })
    );
});

// Start browserSync server
gulp.task('browserSync', () => {
  browserSync({
    server: {
      baseDir: 'app'
    },
    notify: false
  });
});

// task to run build server for testing final app
gulp.task('build:serve', function() {
  browserSync({
    server: {
      baseDir: './dist/'
    }
  });
});

// Watchers
gulp.task('watch', () => {
  gulp.watch('app/src/scss/**/*.scss', ['sass']);
  gulp.watch('app/*.html', ['html']);
  gulp.watch('app/src/js/**/*.js', ['babel']);
});

// -----------------------------------
// Optimization Tasks for production
// -----------------------------------

// Optimizing CSS and JavaScript
gulp.task('useref', () => {
  gulp
    .src('app/*.html')
    .pipe(sourcemaps.init())
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(
      gulpIf(
        '*.html',
        htmlmin({
          collapseWhitespace: true
        })
      )
    )
    .pipe(sourcemaps.write('../maps/'))
    .pipe(gulp.dest('dist'));
});

// Optimizing Images
gulp.task('images', () => {
  gulp
    .src('app/assets/img/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching img that ran through imagemin
    .pipe(
      cache(
        imagemin({
          interlaced: true
        })
      )
    )
    .pipe(gulp.dest('dist/assets/img'));
});

// Copying fonts
gulp.task('fonts', () => {
  gulp.src('app/assets/fonts/**/*').pipe(gulp.dest('dist/assets/fonts'));
});

// Cleaning
gulp.task('clean', () => {
  del.sync('dist').then(cb => {
    cache.clearAll(cb);
  });
});

gulp.task('clean:dist', () => {
  del.sync(['dist/**/*', '!dist/img', '!dist/img/**/*']);
});

// ---------------
// Build Sequences
// ---------------

gulp.task('default', callback => {
  runSequence(['sass', 'babel', 'browserSync'], 'watch', callback);
});

gulp.task('build', callback => {
  runSequence(
    'clean:dist',
    'babel',
    'sass',
    ['useref', 'images', 'fonts'],
    'build:serve',
    callback
  );
});
