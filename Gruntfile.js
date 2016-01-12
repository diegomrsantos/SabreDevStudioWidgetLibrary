module.exports = function (grunt) {
    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        'git-describe': {
            options: {},
            me: {}
        },

        clean: {
              dist: [
                    'dist/**/*'
                  , 'build/**/*'
                  , 'build-js/**/*'
              ]
            , 'dist-no-compile': [
                  'dist/widgets/css'
                , 'dist/widgets/fonts'
                , 'dist/widgets/img'
                , 'dist/www'
                , 'dist/index.html'
                , 'build/**/*'
                , 'build-js/**/*'
            ]
        },

        lodash: {
            build: {
                dest: 'build/lodash/lodash.custom.build.js',
                options: {
                    exports: ['amd'],
                    modifier: 'modern'
                }
            }
        },
        lodashAutobuild: {
            customBuild: {
                src: ['build-js/main/**/*.js'],
                // Default options:
                options: {
                    // The name(s) of the lodash object(s)
                    lodashObjects: [ '_' ],
                    lodashTargets: [ 'build' ]
                }
            }
        },

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            all: {
                src: ['src/**/*.ts']
            }
        },

        typescript: {
            app: {
                src: ['src/**/*.ts'],
                dest: 'build-js',
                options: grunt.file.readJSON('tsconfig.json').compilerOptions
            },
            'watch-src': {
                src: ['src/main/**/*.ts'],
                dest: 'build-js/main',
                options: (function () {
                    var optionsFromConfigFile = grunt.file.readJSON('tsconfig.json').compilerOptions;
                    optionsFromConfigFile.watch = true;
                    optionsFromConfigFile.atBegin = true;
                    optionsFromConfigFile.references = ["typings/tsd.d.ts"];
                    return optionsFromConfigFile;
                })()
            },
            'watch-all': {
                src: ['src/**/*.ts'],
                dest: 'build-js',
                options: (function () {
                    var optionsFromConfigFile = grunt.file.readJSON('tsconfig.json').compilerOptions;
                    optionsFromConfigFile.watch = true;
                    optionsFromConfigFile.atBegin = true;
                    optionsFromConfigFile.references = ["typings/tsd.d.ts"];
                    return optionsFromConfigFile;
                })()
            }
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: {
                src: ['build-js/**/*.js']
            }
        },

        compass: {
            dist: {
                options: {
                    config: 'config.rb'
                }
            }
        },

        csslint: {
            options: {
                csslintrc: '.csslintrc'
            },
            src: ['widgets/stylesheets/**/*.css']
        },

        bootlint: {
            options: {
                stoponerror: false,
                relaxerror: ['W001', 'W002', 'W003', 'W005', 'E001', 'W012']
            },
            files: ['widgets/view-templates/**/*.tpl.html']
        },

        autoprefixer: {
            options: {
                browsers: ['> 1%'] // more codenames at https://github.com/ai/autoprefixer#browsers
            },
            css: {
                src: 'widgets/stylesheets/**/*.css'
            }
        },

        copy: {
            widgets_img: {
                expand: true,
                cwd: 'widgets/',
                src: ['img/airlineLogos/**/*', 'img/icons/**/*', 'img/sabre.png', 'img/sabre2.png'],
                dest: 'dist/widgets/',
                options: {
                    nonull: true
                }
            },
            page_img: {
                expand: true,
                src: ['www/img/**/*'],
                dest: 'dist/',
                options: {
                    nonull: true
                }
            },
            bootstrap_glyphicons_fonts: {
                expand: true,
                cwd: 'bower_components/bootstrap/',
                src: ['fonts/*'],
                dest: 'dist/widgets/',
                options: {
                    nonull: true
                }
            },
            'cdnify-inline-style-images-urls': { // cannot use grunt-cdnify because it does not support inline css styles which we use
                expand: true,
                src: 'widgets/view-templates/**/*.html',
                dest: 'build/templates_cdnified/',
                options: {
                    nonull: true,
                    process: function (content, srcpath) {
                        var cdnBase = 'http://analytics.sabre.com/sdsdemo/dslab/widgets/static';

                        var localToCdnPathMappings = {
                            '/widgets/img/destinations/': '/destinations/' // no rewrite needed if CDN resources structure is the same as local.
                        };

                        function rewriteRelativeLink(path) {
                            // find first mapping that matches the provided path
                            var keyFound = Object.keys(localToCdnPathMappings).filter(function (localPath) {
                                return (path.indexOf(localPath) > -1);
                            })[0];
                            if (keyFound) {
                                var cdnPath = localToCdnPathMappings[keyFound];
                                return path.replace(new RegExp("(.*)(" + keyFound + ")(.*)"), cdnPath + "$3"); // also all parent directory references (like .., ../..) that may exist in the relative path will be removed.
                            }
                            return path;
                        }

                        var INLINE_STYLE_BACKGROUND_IMAGE_REGEX = /(url\(\')([^\']+)(\'\))/gi; // url('../widgets/img/destinations/{{destination}}.jpg')
                        return content.replace(INLINE_STYLE_BACKGROUND_IMAGE_REGEX, function (wholeMatchedString, urlPart, pathPart, closePart) {
                            return urlPart + cdnBase + rewriteRelativeLink(pathPart) + closePart;
                        });
                    }
                }
            },
            copyHtmlUpdatingLinksAndIncludes: {
                expand: true,
                cwd: 'build/www/',
                src: ['**/*'],
                dest: 'dist/',
                options: {
                    nonull: true,
                    process: function (content, srcpath) {
                        var replaceRequireJSEntryWithMinifiedJS = function(content) {
                            return content.replace(/<script.*src=\".*require.js\".*<\/script>/g
                                , '<script async src="../widgets/SDSWidgets.min.js"></script>');
                        };
                        var replaceCSSImportsWithOneCSSBundleImport = function (content, srcpath) {
                            return content.replace(/<link\W+rel=\"stylesheet\"[\s\S]*css\">/g // all particular stylesheet imports must be placed next to each other (in one block, not separated by import of other types).
                                , '<link rel="stylesheet" type="text/css" href="widgets/css/SDS.min.css">');
                        };
                        /*  based on baseDir and filePath calculates the path prefix to navigate from filePath to the baseDir directory level
                            for example: buildToParentDirectoryPathElement('build/www', 'build/www/www/someFile.html') returns '../'.
                            For more files nested more deeply it returns for example '../../../'
                            This is needed to correct relative paths to local resources that were inserted automatically.
                        */
                        var buildToParentDirectoryPathElement = function (baseDir, filePath) {
                            var relativeFilePath = filePath.replace(new RegExp("^" + baseDir), '');
                            var dirNestingLevel = (relativeFilePath.match(/\//g) || []).length;

                            var toParentDirectoryPathElement = '';
                            for (var i = 0; i < dirNestingLevel; i++) {
                                toParentDirectoryPathElement += '../';
                            }
                            return toParentDirectoryPathElement;
                        };
                        var correctDirNestingInLinksFromPartials = function (content, srcpath) {
                            var baseDir = 'build/www/';
                            var toParentDirectoryPathElement = buildToParentDirectoryPathElement(baseDir, srcpath);

                            var HTML_LINKS_TO_LOCAL_HTML_FILES_REGEX = /(href=\")(.+\.html)(\")/gi;
                            var IMG_LINKS_TO_LOCAL_IMG_FILES_REGEX = /(\<img\s+src=\")(.+)(\")/gi;
                            var STYLESHEET_LINKS_TO_LOCAL_CSS_REGEX = /(\<link\s+rel=\"stylesheet\".*href=\")(.+)(\"\>)/gi;

                            return content.replace(HTML_LINKS_TO_LOCAL_HTML_FILES_REGEX, "$1" + toParentDirectoryPathElement + "$2$3")
                                            .replace(IMG_LINKS_TO_LOCAL_IMG_FILES_REGEX, "$1" + toParentDirectoryPathElement + "$2$3")
                                            .replace(STYLESHEET_LINKS_TO_LOCAL_CSS_REGEX, "$1" + toParentDirectoryPathElement + "$2$3");
                        };
                        return correctDirNestingInLinksFromPartials(replaceCSSImportsWithOneCSSBundleImport(replaceRequireJSEntryWithMinifiedJS(content), srcpath), srcpath);
                    }
                }
            }
        },

        image_resize: { //WARN: along with installing grunt-image-resize, you HAVE to install manually imagemagick on your operating system. That grunt plugin depends on it. Without it installed you will be getting errors. See http://stackoverflow.com/questions/11703973/imagemagick-with-nodejs-not-working
            dist: {
                options: {
                      width: 260
					  , height: 170
                      , parallel: 2
                },
                src: 'widgets/img/destinations_orig/*.jpg',
                dest: 'widgets/img/destinations_resized/'
            }
        },

        imagemin: {
            options: {
                progressive: true
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'widgets/img/destinations_resized',
                    src: ['*.{png,jpg,gif}'],
                    dest: 'widgets/img/destinations'
                }]
            }
        },

        karma: {
            'unit-Chrome': {
                configFile: 'karma.conf.js',
                singleRun: true,
                browsers: ['Chrome'],
                logLevel: 'ERROR'
            },
            'unit-all-browsers': {
                configFile: 'karma.conf.js',
                singleRun: true,
                browsers: ['Chrome', 'IE', 'IE9', 'Firefox', 'Safari'],
                logLevel: 'ERROR',
                customLaunchers: {
                    IE9: {
                        base: 'IE',
                        'x-ua-compatible': 'IE=EmulateIE9'
                    }
                }
            }
        },

        watch: {
            compass: {
                files: ['widgets/style/*.scss'],
                tasks: ['compass'],
                options: {
                    spawn: false
                }
            },
            'css-pipeline': {
                files: ['widgets/style/*.scss'],
                tasks: ['css-pipeline'],
                options: {
                    spawn: false,
                    livereload: true
                }
            }
        },

        ngtemplates: {
            sdsWidgets: {
                cwd: 'build/templates_cdnified/src',
                src: '../widgets/view-templates/**/*.html',
                dest: 'build/ngtemplates/templateCacheCharger.js',
                options: {
                    bootstrap:  function(module, templateCacheChargingScript) {
                        return 'define(["angular", "widgets/SDSWidgets"], function(angular, SDSWidgets) { ' +
                            'angular.module("' + module + '").run(["$templateCache", function($templateCache) {' +
                                 templateCacheChargingScript + ' ' +
                            '}]);' +
                            '});';
                    }
                    , htmlmin: {
                        collapseBooleanAttributes:      true,
                        collapseWhitespace:             true,
                        removeAttributeQuotes:          true,
                        removeComments:                 true, // Only if you don't use comment directives!
                        removeEmptyAttributes:          true,
                        removeRedundantAttributes:      true,
                        removeScriptTypeAttributes:     true,
                        removeStyleLinkTypeAttributes:  true,
                        keepClosingSlash:               true // needed for HTML5 closing slashes. Also for svg <line />. Wiout this option the SVG is broken, see https://github.com/kangax/html-minifier/pull/122
                    }
                }
            }
        },

        requirejs: {
            'compile-standalone-app': {
                options: grunt.file.readJSON('r.compiler.options.json')
            },
            'compile-library-only': {
                options: (function () {
                    var config = grunt.file.readJSON('r.compiler.options.json');
                    config.pragmas.excludeWhenBuiltAsLibraryOnly = true;
                    config.out = "dist/widgets/SDSWidgets.lib.min.js";
                    return config;
                })()
            }
        },

        cssmin: {
            options: {
                roundingPrecision: -1
            },
            cssbundle: {
                files: {
                    'dist/widgets/css/SDS.min.css': [
                          'widgets/stylesheets/**/*.css'
                        , 'www/css/**/*.css'
                        , 'bower_components/bootstrap/dist/css/bootstrap.css'
                        , 'bower_components/angular-ui-select/dist/select.css'
                        , 'bower_components/angular-rangeslider/angular.rangeSlider.css'
                        , 'bower_components/titatoggle/dist/titatoggle-dist.css'
                    ]
                }
            }
        },

        includereplace: {
            htmlPartials: {
                options: {
                    prefix: '<partial command="',
                    suffix: '"></partial>'
                },
                src: ['index.html', 'www/**/*.html', '!www/partials/**/*'],
                dest: 'build/www/'
            }
        },

        jsdoc : {
            dist : {
                src: ['build-js/main/**/*.js', 'README.md'],
                options: {
                    destination: 'doc'
                }
            }
        }

    });

    grunt.registerTask('saveRevision', function() {
        grunt.event.once('git-describe', function (rev) {
            grunt.option('gitRevision', rev);
            grunt.file.write('build/version/version.js', 'define([], function () {return {version: function () {return ' + JSON.stringify({
                    version: grunt.config('pkg.version'),
                    revision: grunt.option('gitRevision'),
                    date: grunt.template.today()
                })+ '}}});'
            );
        });
        grunt.task.run('git-describe');
    });

    grunt.registerTask('dist-standalone-app', [
          'clean:dist'
        //, 'lodashAutobuild:customBuild' // skipped lodash custom builds to save build time
        , 'typescript-pipeline'
        , 'unit-test'
        , 'copy:cdnify-inline-style-images-urls'
        , 'ngtemplates'
        , 'saveRevision'
        , 'requirejs:compile-standalone-app'
        , 'css-pipeline'
        , 'copy-static-resources'
    ]);

    grunt.registerTask('dist-standalone-no-UT', [
        'clean:dist'
        //, 'lodashAutobuild:customBuild' // skipped lodash custom builds to save build time
        , 'typescript-pipeline'
        , 'copy:cdnify-inline-style-images-urls'
        , 'ngtemplates'
        , 'saveRevision'
        , 'requirejs:compile-standalone-app'
        , 'css-pipeline'
        , 'copy-static-resources'
    ]);

    grunt.registerTask('dist-standalone-app-fast', [
        'clean:dist'
        //, 'lodashAutobuild:customBuild' // skipped lodash custom builds to save build time
        , 'typescript:app'
        , 'copy:cdnify-inline-style-images-urls'
        , 'ngtemplates'
        , 'requirejs:compile-standalone-app'
        , 'css-pipeline'
        , 'copy-static-resources'
    ]);

    grunt.registerTask('dist-library-only', [
        'clean:dist'
        //, 'lodashAutobuild:customBuild' // skipped lodash custom builds to save build time
        , 'typescript-pipeline'
        , 'unit-test'
        , 'copy:cdnify-inline-style-images-urls'
        , 'ngtemplates'
        , 'saveRevision'
        , 'requirejs:compile-library-only'
        , 'css-pipeline'
        , 'copy-static-resources'
    ]);

    grunt.registerTask('dist-all', [
        'clean:dist'
        //, 'lodashAutobuild:customBuild' // skipped lodash custom builds to save build time
        , 'typescript-pipeline'
        , 'unit-test'
        , 'copy:cdnify-inline-style-images-urls'
        , 'ngtemplates'
        , 'saveRevision'
        , 'requirejs:compile-standalone-app'
        , 'requirejs:compile-library-only'
        , 'css-pipeline'
        , 'copy-static-resources'
    ]);

    grunt.registerTask('dist-no-compile', [
          'clean:dist-no-compile'
        , 'css-pipeline'
        , 'copy-static-resources'
    ]);

    grunt.registerTask('unit-test', 'karma:unit-Chrome');

    grunt.registerTask('typescript-pipeline', ['tslint', 'typescript:app', 'jshint']);

    grunt.registerTask('css-pipeline', ['compass', 'bootlint', 'csslint', 'autoprefixer', 'cssmin:cssbundle']);

    grunt.registerTask('copy-static-resources', [
        'copy:bootstrap_glyphicons_fonts'
        , 'includereplace:htmlPartials'
        , 'copy:copyHtmlUpdatingLinksAndIncludes'
        , 'copy:widgets_img'
        , 'copy:page_img'
    ]);

    grunt.registerTask('default', 'dist-all');

};