define([
        'angular'
      , 'util/BaseServices'
      , 'util/CommonDirectives'
      , 'util/CommonGenericFilters'
      , 'util/CommonDisplayFilters'
      , 'webservices/SabreDevStudioWebServicesModule'
      , 'webservices/Interceptors'
      , 'angular-ui-select'
      , 'angular-sanitize'
      , 'util/LookupFilters'
      , 'angular-img-fallback'
      , 'angular-rangeslider'
      , 'angular_iso_currency'
      , 'angular-touch'
    ],
    function (
          NG
        , BaseServices
        , CommonDirectives
        , CommonGenericFilters
        , CommonDisplayFilters
        , SabreDevStudioWebServicesModule
        , Interceptors
        , angular_ui_select
        , angular_sanitize
        , LookupFilters
        , angular_img_fallback
        , angular_rangeslider
        , angular_iso_currency
        , angular_touch
    ) {
        'use strict';

        return angular.module('sdsWidgets', [
                  'baseServices'
                , 'sabreDevStudioWebServices'
                , 'commonDirectives'
                , 'commonFilters'
                , 'ui.bootstrap'
                , 'ngSanitize'
                , 'ui.select'
                , 'sDSLookups'
                , 'dcbImgFallback'
                , 'ui-rangeSlider'
                , 'isoCurrency'
                , 'ngTouch'
            ])
            .constant('newSearchCriteriaEvent', 'newSearchCriteria')
            .constant('newInspirationalSearchCriteriaEvent', 'newInspirationalSearchCriteriaEvent')
            .constant('filteringCriteriaChangedEvent', 'filteringCriteriaChangedEvent')
            .constant('itinerariesStatisticsUpdateNotification', 'itinerariesStatisticsUpdateNotification')
            .constant('resetAllFiltersEvent', 'resetAllFiltersEvent')
            .constant('dateSelectedEvent', 'dateSelectedEvent')
            .constant('noResultsFoundEvent', 'noResultsFoundEvent')
            .config(['datepickerConfig', function (datepickerConfig) {
                datepickerConfig.showWeeks = false;
                datepickerConfig.startingDay = 1;
                datepickerConfig.yearRange = 2;
                datepickerConfig.showButtonBar = false;
            }])
            .config(['$compileProvider', function($compileProvider) {
                // we need debug enabled effectively to true for development, as these information is needed for the tools (Protractor, Batarang)
                // for production we will cut off the later setting to true, with requirejs pragmas, to have it effectively disabled on production
                $compileProvider.debugInfoEnabled(false);
                //>>excludeStart('appBuildExclude', pragmas.appBuildExclude);
                $compileProvider.debugInfoEnabled(true);
                //>>excludeEnd('appBuildExclude');
            }])
            .config(['$provide', function ($provide) {
                $provide.decorator('currencyFilter', ['$delegate', '$filter', 'iso4217', function ($delegate, $filter, iso4217) {
                    var ngCurrencyFilter = $delegate;
                    // copy of function from iso-currency bower dependency.
                    // Cannot decorate isoCurrency filter from iso-currency, as it itself depends on NG currency filter (and we are modifying NG filter here).
                    return function (amount, currencyCode, fraction) {
                        var currency = iso4217.getCurrencyByCode(currencyCode);

                        if (!currency) {
                            return amount;
                        }

                        var fractionSize = (fraction === void 0) ? currency.fraction : fraction;
                        return ngCurrencyFilter(amount, currency.symbol || (currencyCode + ' '), fractionSize);
                    };
                }]);
            }])
            .service('SearchCriteriaBroadcastingService', [
                  '$rootScope'
                , 'newSearchCriteriaEvent'
            , function ($rootScope, newSearchCriteriaEvent) {
                var service  = {
                    searchCriteria: undefined,
                    broadcast: function () {
                        $rootScope.$broadcast(newSearchCriteriaEvent);
                    }
                };
                return service;
            }])
            .service('InspirationalSearchCriteriaBroadcastingService', [
                '$rootScope'
                , 'newInspirationalSearchCriteriaEvent'
                , function ($rootScope, newInspirationalSearchCriteriaEvent) {
                    var service = {
                        searchCriteria: undefined,
                        broadcast: function () {
                            $rootScope.$broadcast(newInspirationalSearchCriteriaEvent);
                        }
                    };
                    return service;
                }])

            .service('DateSelectedBroadcastingService', [
                '$rootScope'
                , 'dateSelectedEvent'
                , function ($rootScope, dateSelectedEvent) {
                    var service = {
                          originalDataSourceWebService: undefined
                        , newSearchCriteria: undefined
                        , broadcast: function () {
                            $rootScope.$broadcast(dateSelectedEvent);
                        }
                    };
                    return service;
            }])
            .service('NoResultsFoundBroadcastingService', [
                '$rootScope'
                , 'noResultsFoundEvent'
                , function ($rootScope, noResultsFoundEvent) {
                    var service = {
                        broadcast: function () {
                            $rootScope.$broadcast(noResultsFoundEvent);
                        }
                    };
                    return service;
                }])
            .service('ItineraryStatisticsBroadcastingService', [
                '$rootScope'
                , 'itinerariesStatisticsUpdateNotification'
                , function ($rootScope, itinerariesStatisticsUpdateNotification) {
                    var service = {
                        statistics: undefined,
                        broadcast: function () {
                            $rootScope.$broadcast(itinerariesStatisticsUpdateNotification);
                        }
                    };
                    return service;
            }])
            .service('FilteringCriteriaChangedBroadcastingService', [
                '$rootScope'
                , 'filteringCriteriaChangedEvent'
                , function ($rootScope, filteringCriteriaChangedEvent) {
                    var service = {
                          filteringFunctions: undefined
                        , broadcast: function () {
                            $rootScope.$broadcast(filteringCriteriaChangedEvent);
                          }
                    };
                    return service;
            }])
            .factory('StatisticsGatheringRequestsRegistryService', function () {
                var registry = [];
                return {
                    register: function (statisticDescription) {
                        registry.push(statisticDescription);
                    },
                    getAll: function () {
                        return registry;
                    }
                };
            })
    });
