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
        , 'elementQuery': '../../bower_components/css-element-queries/src/ElementQueries'
        , 'ResizeSensor': '../../bower_components/css-element-queries/src/ResizeSensor'
        , 'angular_google_maps': '../../bower_components/angular-google-maps/dist/angular-google-maps'
        , 'angular-simple-logger': '../../bower_components/angular-simple-logger/dist/angular-simple-logger'
        , 'nsPopover': '../../bower_components/nsPopover/src/nsPopover'
        , 'WidgetsFilterPanel': '../../bower_components/WidgetsFilterPanel/dist/WidgetsFilterPanel'
        , 'usSpinnerService': '../../bower_components/angular-spinner/angular-spinner'
        , 'spin': '../../bower_components/spin.js/spin'
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
        'angular-simple-logger': {
            deps: ['angular']
        },
        'angular_google_maps': {
            deps: ['angular', 'angular-simple-logger', 'lodash']
        },
        'elementQuery': {
            deps: ['ResizeSensor']
        },
        'nsPopover': {
            deps: ['angular']
        },
        'WidgetsFilterPanel': {
            deps: ['angular']
        },
        'usSpinnerService': {
            deps: ['angular', 'spin']
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
        , 'widgets/searchForm/DiversitySwapper'
        , 'widgets/ItinerariesList/InputSortBy'
        , 'widgets/informational/fareForecast/FareForecastWidget'
        , 'widgets/informational/fareRange/FareRangeWidget'
        , 'widgets/FareNabberWidget'
        , 'widgets/DestinationPricerWidget'
        , 'widgets/inspirational/InspirationalWidgets.mod'
        , 'widgets/ItinerariesList/ItinerariesListWidget'
        , 'widgets/ItinerariesFilterPanel.drv'
        , 'widgets/errorDisplays/ErrorDisplays.mod'
        , 'widgets/AboutWidget'
        , 'widgets/SpinnerContainer'
        , 'widgets/util/TranscludeWithInheritedScope'
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
        , DiversitySwapper
        , InputSortBy
        , FareForecastWidget
        , FareRangeWidget
        , FareNabberWidget
        , DestinationPricerWidget
        , InspirationalWidgetsModule
        , ItinerariesListWidget
        , ItinerariesFilterPanelDirective
        , ErrorDisplaysModule
        , AboutWidget
        , SpinnerContainer
        , TranscludeWithInheritedScope
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
            angular.bootstrap(document, ['sdsWidgets'], {
                strictDi: true
            });
        });
    }

    return {
         version: version.version
    }

});
