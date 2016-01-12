/// <reference path="../../typings/tsd.d.ts" />
require.config({
    paths: {
          moment: '../../bower_components/moment/moment'
        , moment_range: '../../bower_components/moment-range/dist/moment-range'
        , lodash: '../../bower_components/lodash/lodash'
        , angular: '../../bower_components/angular/angular'
        , 'angular_resource': '../../bower_components/angular-resource/angular-resource'
        , 'angular_bootstrap': '../../bower_components/angular-bootstrap/ui-bootstrap-tpls'
        , 'angular-ui-select': '../../bower_components/angular-ui-select/dist/select'
        , 'angular-sanitize': '../../bower_components/angular-sanitize/angular-sanitize'
        , 'angular-img-fallback': '../../bower_components/angular-img-fallback/angular.dcb-img-fallback'
        , 'angular-rangeslider': '../../bower_components/angular-rangeslider/angular.rangeSlider'
        , 'angular-touch': '../../bower_components/angular-touch/angular-touch'
        , 'ngStorage': '../../bower_components/ngstorage/ngStorage'
        , 'ngPromiseExtras': '../../bower_components/angular-promise-extras/angular-promise-extras'
        , 'chartjs': '../../bower_components/Chart.js/Chart'
        , 'angular_iso_currency': '../../bower_components/iso-currency/dist/isoCurrency'
        , 'elementQuery': '../../bower_components/elementQuery/elementQuery' //WARN: elementQuery is exposing functions on windows... AMD support already requested, see: https://github.com/tysonmatanich/elementQuery/pull/9/commits
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
        'angular-touch': {
            deps: ['angular']
        },
        'ngStorage': {
            deps: ['angular']
        },
        'ngPromiseExtras': {
            deps: ['angular']
        },
        'angular_currency_filter': {
            deps: ['angular']
        },
        'angular_iso_currency': {
            deps: ['angular']
        },
        'elementQuery': {
            exports: 'elementQuery'
        }
    },
    config: {
        moment: {
            noGlobal: true
        }
    }
});

define([
          'moment'
        , 'datamodel/ItinerariesList'
        , 'webservices/common/validators/BasicSearchCriteriaValidator'
        , 'webservices/instaflights/InstaflightSearchCriteriaValidator'
        , 'lodash'
        , 'angular'
        , 'widgets/calendar/CalendarWidget'
        , 'widgets/AlternateDatesMatrixWidget'
        , 'widgets/leadPriceChart/LeadPriceChartWidget'
        , 'widgets/informational/LowFareHistoryWidget'
        , 'widgets/informational/TravelSeasonalityWidget'
        , 'widgets/searchForm/SearchFormWidget'
        , 'widgets/searchForm/SearchFormInspirationalWidget'
        , 'widgets/searchForm/SearchFormInputControls'
        , 'widgets/searchForm/InputAirport'
        , 'widgets/ItinerariesList/InputSortBy'
        , 'widgets/informational/fareForecast/FareForecastWidget'
        , 'widgets/informational/fareRange/FareRangeWidget'
        , 'widgets/FareNabberWidget'
        , 'widgets/DestinationPricerWidget'
        , 'widgets/inspirational/ThemedDestinationFinderWidget'
        , 'widgets/ItinerariesList/ItinerariesListWidget'
        , 'widgets/filters/FiltersPanelWidget'
        , 'widgets/filters/ValuesFilterDirective'
        , 'widgets/ErrorDisplayWidget'
        , 'widgets/AboutWidget'
        , 'Configuration'
        , 'elementQuery'
        , 'widgets/templateCacheCharger'
        , 'widgets/version'
    ], function (
          moment
        , ItinerariesList
        , BasicSearchCriteriaValidator
        , InstaflightSearchCriteriaValidator
        , _
        , angular
        , CalendarWidget
        , AlternateDatesMatrixWidget
        , LeadPriceChartWidget
        , LowFareHistoryWidget
        , TravelSeasonalityWidget
        , SearchFormWidget
        , SearchFormInspirationalWidget
        , SearchFormInputControls
        , InputAirport
        , InputSortBy
        , FareForecastWidget
        , FareRangeWidget
        , FareNabberWidget
        , DestinationPricerWidget
        , ThemedDestinationFinderWidget
        , ItinerariesListWidget
        , FiltersPanelWidget
        , DiscreteFilterWidget
        , ErrorDisplayWidget
        , AboutWidget
        , Configuration
        , elementQuery
        , templateCacheCharger
        , version
    ) { // we have to list all files with angular components as dependencies, so that they are recognized?
        "use strict";

    //>>excludeStart('excludeWhenBuiltAsLibraryOnly', pragmas.excludeWhenBuiltAsLibraryOnly);
    bootstrapNG();
    //>>excludeEnd('excludeWhenBuiltAsLibraryOnly');

    function bootstrapNG() {
        angular.element(document).ready(function () {
            var beforeNG = performance.now();
            angular.bootstrap(document, ['sdsWidgets'], {
                strictDi: true
            });
            var afterNG = performance.now();
            console.log('NG load: ' + Math.round(afterNG - beforeNG));

            //>>excludeStart('appBuildExclude', pragmas.appBuildExclude);
            var initInjector = angular.injector(["ng"]);
            var $timeout = initInjector.get("$timeout");
            $timeout(function () { // this timeout is a workaround for templates not applied element queries RWD (because they are loaded later, in separate http call for template). This workaround is not needed for prod build, as then templates are loaded as ng module, so are loaded at this point into template cache. This workaround creates bad user experience (page shown for a fraction of second without RWD applied)
            //>>excludeEnd('appBuildExclude');
                parseAllStylesheetsToMakeWidgetsResponsive();
            //>>excludeStart('appBuildExclude', pragmas.appBuildExclude);
            });
            var afterCSS = performance.now();
            console.log('CSS RWD parse: ' + Math.round((afterCSS - afterNG)));
            //>>excludeEnd('appBuildExclude');
        });
    }

    function parseAllStylesheetsToMakeWidgetsResponsive() {
        [].slice.call(document.styleSheets)
            .filter(isOwnStylesheet) // responsive instructions are only in our own CSS, no point to parse other. // WARN becasue of how elementQuery is written now it will parse all stylesheets later anyway itself.
            .forEach(stylesheet => elementQuery(stylesheet, true));
    }

    function isOwnStylesheet(stylesheet) {
        return stylesheet.href && stylesheet.href.indexOf('SDS') > -1; //WARN hardcode: part of name of our css minified file to recognize own stylesheet
    }

    return {
        parseAllStylesheetsToMakeWidgetsResponsive: parseAllStylesheetsToMakeWidgetsResponsive
        , version: version.version
    }

});
