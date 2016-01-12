/// <reference path="../../typings/tsd.d.ts" />

interface Window {
    __karma__?: any;
}

/*global requirejs */
var tests = [];
for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/Test.js$/.test(file)) {
            tests.push(file);
        }
    }
}

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base/build-js/main',

    paths: {
        text: '../../node_modules/requirejs-text/text',
        moment: '../../bower_components/moment/moment',
        moment_range: '../../bower_components/moment-range/dist/moment-range',
        lodash: '../../bower_components/lodash/lodash',
        angular: '../../bower_components/angular/angular',
        'angular_resource': '../../bower_components/angular-resource/angular-resource',
        'angular_bootstrap': '../../bower_components/angular-bootstrap/ui-bootstrap-tpls',
        'angular-ui-select': '../../bower_components/angular-ui-select/dist/select',
        'angular-sanitize': '../../bower_components/angular-sanitize/angular-sanitize',
        'angular-img-fallback': '../../bower_components/angular-img-fallback/angular.dcb-img-fallback',
        'angular-rangeslider': '../../bower_components/angular-rangeslider/angular.rangeSlider',
        'ngStorage': '../../bower_components/ngstorage/ngStorage',
        'ngPromiseExtras': '../../bower_components/angular-promise-extras/angular-promise-extras',
        'chartjs': '../../bower_components/Chart.js/Chart',
        angularMocks: '../../bower_components/angular-mocks/angular-mocks'
    },
    map: {
        '*': {
            'chartjs': 'util/chartjs-noConflict'
        }
        , 'util/chartjs-noConflict': { 'chartjs': 'chartjs'}
    },
    shim: {
        // angular does not support AMD out of the box, put it in a shim
        'angular': {
            exports: 'angular'
        },
        'angularMocks': {
            deps: ['angular']
        },
        angular_resource: {
            deps: ['angular'], 'exports': 'ngResource'
        },
        angular_bootstrap: {
            deps: ['angular']
        },
        'angular-ui-select': {
            deps: ['angular']
        },
        'angular-sanitize': {
            deps: ['angular']
        },
        'angular-img-fallback': {
            deps: ['angular']
        },
        'angular-rangeslider': {
            deps: ['angular']
        },
        'ngStorage': {
            deps: ['angular']
        },
        'ngPromiseExtras': {
            deps: ['angular']
        }
    },
    config: {
        moment: {
            noGlobal: true
        }
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});