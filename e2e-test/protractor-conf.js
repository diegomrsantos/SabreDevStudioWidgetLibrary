exports.config = {
    allScriptsTimeout: 6000,

    specs: [
        '*.js'
    ],

    //suites: {
    //    smoke: 'spec/smoketests/*.js',
    //    full: 'spec/*.js'
    //},

    multiCapabilities: [
    {
        browserName: 'chrome',
        maxInstances: 1
    }
    //,{
    //    browserName: 'firefox',
    //    maxInstances: 2
    //}
    ],

    baseUrl: 'http://localhost:63342/SabreDevStudioDemo/www/',
    //baseUrl: 'http://localhost:63342/SabreDevStudioDemo/e2e-test/www/',

    framework: 'jasmine',

    jasmineNodeOpts: {
        defaultTimeoutInterval: 30000
    }
};