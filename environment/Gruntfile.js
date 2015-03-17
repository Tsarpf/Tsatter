module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-wiredep');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bower: {
            install: {
                options: {
                    targetDir: "./src/public/libs/",
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
                    './src/app/views/header.jade',
                    './src/app/views/layout.jade'
                ],
                options: {
                }
            }
        }
    });

    grunt.registerTask('deps',['bower','wiredep']);

};