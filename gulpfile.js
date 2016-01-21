var gulp = require('gulp');

var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var jadeConcat = require('gulp-jade-template-concat');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sass = require('gulp-ruby-sass');
var sourcemaps = require('gulp-sourcemaps');
var jade = require('gulp-jade');
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var glob = require('globby');
var through = require('through2');
var connect = require('gulp-connect');

var bowerDir = './vendor/components';
var styleDir = './app/stylesheets';
var srcDir = './app/javascript/';
var destDir = './dist/';

var paths = {
    vendorJs: [
        bowerDir + '/jquery/dist/jquery.js',
        bowerDir + '/underscore/underscore.js',
        bowerDir + '/backbone/backbone.js',
        bowerDir + '/backbone.babysitter/lib/backbone.babysitter.js',
        bowerDir + '/backbone.marionette/lib/backbone.marionette.js'
    ],
    fonts: [
        styleDir + '/fonts/fontello/fontello.*'
    ]
};

var config = {
    sass: {
        src: [styleDir + '/main.scss'],
        watchSrc: [styleDir + '/**/*.scss'],
        options: {
            sourcemap: true,
            lineNumbers: true
        }
    },
    coffee: {
        src: [srcDir + '**/*.coffee'],
        watchSrc: [srcDir + '/**/*.coffee'],
        options: {}
    },
    templates: {
        src: [srcDir + '/**/*.jade'],
        watchSrc: [srcDir + '/**/*.jade'],
        options: {
            client: true,
        }
    },
    index: {
        src: ['./app/index.jade'],
        watchSrc: ['./app/index.jade'],
        options: {}
    }
};

/*
 *        SASS
 */

gulp.task('build-sass', function() {
    sass(config.sass.src, config.sass.options)
        .pipe(autoprefixer('last 3 version'))
        .pipe(plumber())
        .pipe(rename('application.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destDir + '/css/'))
        .pipe(connect.reload());
});

gulp.task('watch-sass', function() {
    gulp.watch(config.sass.watchSrc, ['build-sass']);
});

gulp.task('sass', ['build-sass', 'watch-sass']);

/*
 *        Fonts
 */

gulp.task('build-fonts', function() {
    gulp.src(paths.fonts)
        .pipe(gulp.dest(destDir + '/fonts/'));
});

/*
 *         JavaScript
 */

gulp.task('vendor-js', function() {
    return gulp.src(paths.vendorJs)
        .pipe(sourcemaps.init())
        .pipe(concat('vendor.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destDir + '/js/'));
});

gulp.task('build-js', function (callback) {
    var bundledStream = through();
    bundledStream
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destDir + '/js/'))
        .pipe(connect.reload());

    glob(config.coffee.src).then(function(entries) {
        var b = browserify({
            entries: entries,
            debug: true,
            transform: ['coffeeify'],
            extensions: ['.module.coffee']
        });
        b.bundle().pipe(bundledStream);
    });

    return bundledStream;
});

gulp.task('watch-js', function() {
    gulp.watch(config.coffee.watchSrc, ['build-js']);
});

gulp.task('js', ['build-js', 'watch-js']);

/*
 *         Templates
 */

gulp.task('build-templates', function(){
    gulp.src(config.templates.src)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(jade(config.templates.options))
        .pipe(jadeConcat('templates.js', {templateVariable:"JST"}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destDir + '/js/'))
        .pipe(connect.reload());
});

gulp.task('watch-templates', function() {
    gulp.watch(config.templates.watchSrc, ['build-templates']);
});

gulp.task('templates', ['build-templates', 'watch-templates']);

/*
 *          index
 */

gulp.task('build-index', function(){
    gulp.src(config.index.src)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(jade(config.index.options))
        .pipe(concat('index.html'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destDir))
        .pipe(connect.reload());
});

gulp.task('watch-index', function() {
    gulp.watch(config.index.watchSrc, ['build-index']);
});

gulp.task('index', ['build-index', 'watch-index']);

/*
 *          Server
 */

gulp.task('start', function() {
    connect.server({
        root: 'dist',
        livereload: true,
        fallback: './dist/index.html'
    });
});

/*
 *          Default
 */

gulp.task('watch', ['watch-js', 'watch-templates', 'watch-sass', 'watch-index', 'start']);

gulp.task('default', ['vendor-js', 'build-sass', 'build-js', 'build-templates', 'build-index', 'build-fonts']);