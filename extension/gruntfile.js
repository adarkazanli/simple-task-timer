module.exports = function(grunt) {
    var manifest = grunt.file.readJSON('public/manifest.json');
    grunt.config.init({
        uglify: {
            dist: {
                expand: true,
                src: '**/*.js',
                cwd: 'dist/',
                dest: 'dist/',
                compress: true,
                preserveComments: false
            }
        },
        copy: {
            src_to_dist: {
                expand: true,
                cwd: 'public',
                src: ['**/*'],
                dest: 'dist'
            },
            src_to_build: {
                expand: true,
                cwd: 'public',
                src: '**/*',
                dest: './build/' + manifest.version + '/src'
            },
            global_to_dist: {
                expand: true,
                cwd: '../../',
                src: ['CHANGELOG.txt', 'README.txt', 'LICENSE.txt'],
                dest: 'dist'
            }
        },
        'json-minify': {
            dist: {
                files: 'dist/**/*.json'
            }
        },
        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: '**/*.css',
                    dest: 'dist/'
                }]
            }
        },
        imagemin: {
            dynamic: {
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: '**/*.{png,jpg,gif}',
                    dest: 'dist/'
                }]
            }
        },
        compress: {
            pack_chrome: {
                options: {
                    archive: './build/' + manifest.version + '/' + manifest.version + '_chrome.zip',
                    mode: 'zip'
                },
                files: [{
                    expand: true,
                    cwd: 'dist',
                    dest: '',
                    src: './**'
                }]
            }
        },
        crx: {
            project: {
                "src": [
                    "dist/**/*"
                ],
                "dest": './build/' + manifest.version + '/' + manifest.version + '_chrome.crx',
                "zipDest": './build/' + manifest.version + '/' + manifest.version + '_chrome.zip',
                "options": {
                    "privateKey": "private/key.pem"
                }
            }
        },
        clean: {
            remove_dist: ['dist']
        },
        webstore_upload: {
            accounts: {
                default: {
                    publish: true,
                    client_id: '',
                    client_secret: '',
                    refresh_token: ''
                }
            },
            extensions: {
                default: {
                    appID: '',
                    zip: 'build/' + manifest.version + '/' + manifest.version + '_chrome.zip'
                }
            }
        },
        semver: {
            project: {
                files: [{
                    src: 'package.json',
                    dest: 'package.json'
                }]
            },
        },
    });
    grunt.registerTask('update-manifest', function() {
        var projectFilePath = 'public/manifest.json';
        var projectManifest = grunt.file.readJSON(projectFilePath);
        var packageFilePath = 'package.json';
        var packageManifest = grunt.file.readJSON(packageFilePath);
        projectManifest.version = packageManifest.version;
        grunt.file.write(projectFilePath, JSON.stringify(projectManifest, null, 2));
    });
    grunt.registerTask('bump', function(releaseType) {
        if (releaseType == null || !releaseType.match(/(major|minor|patch)/i)) {
            throw grunt.util.error('Usage: grunt bump:[major|minor|patch]');
        } else {
            grunt.task.run(['semver:project:bump:' + releaseType.toLowerCase(), 'update-manifest']);
        }
    });
    grunt.registerTask('pack', function(browser) {
        if (browser == null || !browser.match(/(chrome|firefox)/i)) {
            throw grunt.util.error('Usage: grunt pack:[chrome|firefox]');
        } else {
            switch (browser.toLowerCase()) {
                case 'chrome':
                    grunt.task.run(['crx']);
                    break;
            }
        }
    });
    grunt.registerTask('build', function() {
        grunt.task.run(['copy', 'json-minify', 'uglify', 'cssmin', 'imagemin', 'pack:chrome', 'clean']);
    });
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-modify-json');
    grunt.loadNpmTasks('grunt-webstore-upload');
    grunt.loadNpmTasks('grunt-json-minify');
    grunt.loadNpmTasks('grunt-semver');
    grunt.loadNpmTasks('grunt-crx');
    grunt.registerTask('upload', ['webstore_upload']);
};