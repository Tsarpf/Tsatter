module.exports = function(grunt) {

    grunt.file.expand('../node_modules/grunt-*/tasks').forEach(grunt.loadTasks);

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        bower: {
            install: {
                options: {
                    targetDir: 'public/libs',
                    layout: "byComponent",
                    install: true,
                    verbose: true,
                    copy: false,
                    cleanTargetDir: false,
                    cleanBowerDir: false,
                    bowerOptions: {}
                }
            }
        },

        wiredep: {
            options: {
                    directory: 'public/libs/',
                    ignorePath: '../../public' 
            },
            task: {
                src: [
                    'app/views/index.html'
                ]
            }
        },


        useminPrepare: {
            html: ['workdir/app/views/index.html'],
            options: {
                dest: 'workdir'
            }
        },
        usemin: {
            html: ['workdir/app/views/index.html']
        },
        filerev: {
            stylesheets: {
                src: 'workdir/assets/css/styles.min.css'
            },
            js: {
                src: 'workdir/js/*.js'
            }
        },
        copy: {
            bootstrapFonts: {
                nonull: true,
                expand: true,
                cwd: 'public/libs/bootstrap/fonts/',
                src: ['**'],
                dest: 'workdir/public/fonts/'
            },
            flatFonts: {
                nonull: true,
                expand: true,
                cwd: 'public/libs/flat-ui/fonts/',
                src: ['**'],
                dest: 'workdir/public/fonts/'
            },
            app: {
                nonull: true,
                expand: true,
                src: ['app/**/*.js', 'app/**/*.html'],
                dest: 'workdir/'
            },
            server: {
                nonull: true,
                expand: true,
                src: ['server/**/*.js'],
                dest: 'workdir/'
            },
            runjs: {
                nonull: true,
                expand: true,
                src: ['server/run.js'],
                dest: 'workdir/'
            },
            toDist: {
                nonull: true,
                expand: true,
                cwd: 'workdir/',
                src: ['**'],
                dest: 'dist/'
            }
        },
        clean: {
            workdir: ['workdir/**'],
            dist: ['dist/app/*', 'dist/public/*', 'dist/server/*']
        },
        watch: {
            everything: {
                files: ['public/**', 'app/views/**'],
                tasks: ['build']
            }
        },
        shell: {
            watch: {
                command: 'grunt watchStatic',
                options: {
                    async: true
                }
            }
        }
    });

    grunt.registerTask('background-watch', ['shell']);

    grunt.registerTask('deps',['bower','wiredep']);

    grunt.registerTask('watchStatic', ['watch']);

    grunt.registerTask('copytest', ['copy:toWork']);

    grunt.registerTask('build', [
        'clean:workdir',
        'copy:bootstrapFonts',
        'copy:flatFonts',
        'copy:app',
        'copy:server',
        'copy:runjs',
        'useminPrepare',
        'concat:generated',
        'cssmin:generated',
        'uglify:generated',
        'filerev',
        'usemin',
        'clean:dist',
        'copy:toDist'
    ]);

};
