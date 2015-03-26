module.exports = function(grunt) {

    grunt.file.expand('../node_modules/grunt-*/tasks').forEach(grunt.loadTasks);
    //grunt.loadNpmTasks('grunt-bower-task');
    //grunt.loadNpmTasks('grunt-wiredep');

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
        }
    });

    grunt.registerTask('deps',['bower','wiredep']);

};
