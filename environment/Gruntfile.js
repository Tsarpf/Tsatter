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
                    'app/views/header.jade',
                    'app/views/layout.jade'
                ]
            }
        },


        useminPrepare: {
            jade: ['dist/app/views/*.jade'],
            options: {
                dest: 'dist',
                patterns: {
                    jade: require('usemin-patterns').jade
                }
            }
        },
        usemin:{
            jade: ['dist/app/views/*.jade'],
            options: {
                patterns: {
                    jade: require('usemin-patterns').jade
                },
                blockReplacements: {
                    css: function (block) {
                        return "link(rel='stylesheet', href='" + block.dest.replace('public/', '') + "')";
                    },
                    js: function (block) {
                        return "script(src='" + block.dest.replace('public/', '') + "')";
                    }
                }
            }
        },
        filerev: {
            stylesheets: {
                src: 'dist/assets/css/styles.min.css'
            },
            js: {
                src: 'dist/js/*.js'
            }
        },
        copy:{
            app: {
                expand: true,
                src: ['app/**/*.js', 'app/**/*.jade'],
                dest: 'dist/'
            },
            server: {
                expand: true,
                src: ['server/**/*.js'],
                dest: 'dist/'
            },
            runjs: {
                src: ['run.js'],
                dest: 'dist/'
            }
        },
        clean: {
            dist: ['dist']
        }

    });

    grunt.registerTask('deps',['bower','wiredep']);

    grunt.registerTask('build', [
        'clean:dist',
        'copy',
        'useminPrepare',
        'concat:generated',
        'cssmin:generated',
        'uglify:generated',
        'filerev',
        'usemin'
    ]);

};
