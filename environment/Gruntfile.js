module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-wiredep');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bower: {
            install: {
                options: {
                    targetDir: "./public/libs/",
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
            task: {
                src: [
                    './app/views/header.jade',
                    './app/views/layout.jade'
                ],
                options: {
                    'directory':'./public/libs/'
                }
            }
        }
    });

    grunt.registerTask('deps',['bower','wiredep']);

};