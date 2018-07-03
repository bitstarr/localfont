module.exports = function(grunt) {
    'use strict';

    // Load Grunt tasks automatically
    require('load-grunt-tasks')(grunt, { scope: ['devDependencies', 'dependencies'] });

    var browsers = [
        'last 2 version',
        'ie >= 11',
        'Firefox ESR',
        'Android > 4'
    ];

    /* config grunt
    ------------------------------------------------- */
    grunt.initConfig({
        project: {
            dist: {
                css:    'dist/css/',
                js:     'dist/js/',
            },
            less:       'assets/less/',
            js:         'assets/js/',
        },


        watch: {
            less: {
                files: [
                    '<%=project.less%>**/*.less'
                ],
                tasks: [
                    'less:build',
                    'postcss:dev'
                ],
                options: {
                    livereload: {
                        port: 9001
                    }
                }
            },
            fonts: {
                files: [
                    '<%=project.less%>fonts/*.less',
                    '<%=project.js%>localfont.js'
                ],
                tasks: ['lf']
            }
        },

        /* CSS
        ------------------------------------------------- */
        less: {
            build: {
                options: {
                    paths: ['<%=project.less%>']
                },
                files: {
                    '<%=project.dist.css%>main.css': '<%=project.less%>main.less'
                }
            },
            localFonts: {
                options: {
                    paths: ['<%=project.less%>'],
                    ieCompat: false
                },
                files: {
                    '<%=project.dist.css%>woff.css': '<%=project.less%>fonts/woff.less',
                    '<%=project.dist.css%>woff2.css': '<%=project.less%>fonts/woff2.less'
                }
            }
        },
        postcss: {
            dev: {
                options: {
                    map: true,

                    processors: [
                        require('autoprefixer')({
                            browsers: browsers,
                            cascade: true
                        }),
                    ]
                },
                src: '<%=project.dist.css%>*.css'
            },
            build: {
                options: {
                    map: false,

                    processors: [
                        require('autoprefixer')({
                            browsers: browsers,
                            cascade: true
                        }),
                        require('cssnano')({
                            sourcemap: false,
                            discardUnused: {
                                fontFace: false
                            }
                        })
                    ]
                },
                src: '<%=project.dist.css%>*.css'
            }
        },

        /* JS
        ------------------------------------------------- */
        concat: {
            localFonts: {
                src: [
                    'node_modules/woff2-feature-test/woff2.js',
                    '<%=project.js%>fontHash.js',
                    '<%=project.js%>localfont.js'
                ],
                dest: '<%=project.dist.js%>localfont.js',
                nonull: true,
            }
        },

        uglify: {
            build: {
                files: [{
                    expand: true,
                    cwd: '<%=project.dist.js%>',
                    src: '**/*.js',
                    dest: '<%=project.dist.js%>'
                }]
            }
        },

        /* Shell
        ------------------------------------------------- */
        shell: {
            localFonts: {
                cwd: '<%=project.less%>fonts/',
                command: 'sh hash.sh'
            },
            options: {
                stdout: true
            }
        }

    });

    /* register tasks
    ------------------------------------------------- */
    grunt.registerTask( 'default', ['watch'] );

    grunt.registerTask( 'lf',  [
        'shell:localFonts',
        'concat:localFonts',
        'uglify',
        'less:localFonts',
        'postcss:build',
    ]);

    grunt.registerTask( 'css',  [
        'less:build',
        'postcss:build',
    ]);

    grunt.registerTask( 'build',  [
        'css',
        'lf'
    ]);
};
