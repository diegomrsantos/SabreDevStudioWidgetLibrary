define([
          'angular'
        , 'lodash'
        , 'util/LodashExtensions'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/common/PromiseUtils'
    ],
    function (
          angular
        , _
        , __
        , SabreDevStudioWebServicesModule
        , PromiseUtilsSrc
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('AirportLookupDataService', [
                      '$q'
                    , 'ShoppingAirportsAndCitiesLookupWebService'
                    , 'FareRangeAirportsAndCitiesLookupWebService'
                    , 'LowFareForecastAirportsAndCitiesLookupWebService'
                    , '$localStorage'
                    , 'ErrorReportingService'
                    , 'businessMessagesErrorHandler'
                    , 'PromiseUtils'
                    , 'pointOfSaleCountry'
                , function (
                      $q
                    , ShoppingAirportsAndCitiesLookupWebService
                    , FareRangeAirportsAndCitiesLookupWebService
                    , LowFareForecastAirportsAndCitiesLookupWebService
                    , $localStorage
                    , ErrorReportingService
                    , businessMessagesErrorHandler
                    , PromiseUtils
                    , pointOfSaleCountry
                ) {

                const GLOBAL_DICTIONARY_KEY = 'SUM_OF_ALL_DICTIONARIES';
                const SHOPPING_DICTIONARY_NAME = 'shoppingAirportsDictionary';
                const FARE_RANGE_DICTIONARY_NAME = 'fareRangeAirportsDictionary';
                const LOW_FARE_FORECAST_DICTIONARY_NAME = 'lowFareForecastAirportsDictionary';

                initializeDictionariesInLocalStorage();

                function updateDictionary(dictionary, entry) {
                    var airportCode = entry.AirportCode;
                    updateDictionaryForKey(dictionary, entry, airportCode);
                }

                function updateDictionaryForKey(dictionary, entry, key) {
                    if (!dictionary[key]) {
                        dictionary[key] = {
                            AirportName: entry.AirportName
                            , CityName: entry.CityName
                            , CountryCode: entry.CountryCode
                            , CountryName: entry.CountryName
                        };
                    }
                }

                function parseAirportLookupResponse(response) {
                    return response.OriginDestinationLocations.reduce(function (dictionary, entry) {
                        var originEntry = entry.OriginLocation;
                        updateDictionary(dictionary, originEntry);
                        var destinationEntry = entry.DestinationLocation;
                        updateDictionary(dictionary, destinationEntry);
                        return dictionary;
                    }, {});
                }

                function getAirportsDictionary(dictionaryName, webServiceResource, posCountry = pointOfSaleCountry, updateGlobalDictionaryEnabled = false) {

                    return $q(function (resolve, reject) {
                        if ($localStorage[dictionaryName][posCountry]) {
                            return resolve($localStorage[dictionaryName][posCountry]);
                        }
                        var requestParameters = {
                            pointofsalecountry: posCountry
                        }
                        webServiceResource.get(requestParameters).$promise.then(
                            function (response) {
                                var airportsDictionary = parseAirportLookupResponse(response);
                                $localStorage[dictionaryName][posCountry] = airportsDictionary;
                                if (updateGlobalDictionaryEnabled) {
                                    updateGlobalDictionary(dictionaryName, airportsDictionary);
                                }
                                resolve(airportsDictionary);
                            }
                            , function (reason) {
                                ErrorReportingService.reportError('Cannot get airports dictionary ' + dictionaryName + ' for POS country ' + posCountry);
                                businessMessagesErrorHandler.handle(reject, reason);
                            }
                        );
                    });
                }

                function getShoppingAirportsDictionary(posCountry = pointOfSaleCountry) {
                    return getAirportsDictionary(SHOPPING_DICTIONARY_NAME, ShoppingAirportsAndCitiesLookupWebService, posCountry);
                }

                function getFareRangeAirportsDictionary(posCountry = pointOfSaleCountry) {
                    return getAirportsDictionary(FARE_RANGE_DICTIONARY_NAME, FareRangeAirportsAndCitiesLookupWebService, posCountry);
                }

                function getLowFareForecastAirportsDictionary(posCountry = pointOfSaleCountry) {
                    return getAirportsDictionary(LOW_FARE_FORECAST_DICTIONARY_NAME, LowFareForecastAirportsAndCitiesLookupWebService, posCountry);
                }

                function initializeDictionariesInLocalStorage() {
                    if (_.isUndefined($localStorage[SHOPPING_DICTIONARY_NAME])) {
                        $localStorage[SHOPPING_DICTIONARY_NAME] = {};
                    }
                    if (_.isUndefined($localStorage[FARE_RANGE_DICTIONARY_NAME])) {
                        $localStorage[FARE_RANGE_DICTIONARY_NAME] = {};
                    }
                    if (_.isUndefined($localStorage[LOW_FARE_FORECAST_DICTIONARY_NAME])) {
                        $localStorage[LOW_FARE_FORECAST_DICTIONARY_NAME] = {};
                    }

                    if (_.isUndefined($localStorage[SHOPPING_DICTIONARY_NAME][GLOBAL_DICTIONARY_KEY])) {
                        $localStorage[SHOPPING_DICTIONARY_NAME][GLOBAL_DICTIONARY_KEY] = {};
                    }
                    // global dictionary for fare range and low fare forecast not implemented
                }

                function updateGlobalDictionary(dictionaryName, perPosDictionary) {
                    var globalDictionary = $localStorage[dictionaryName][GLOBAL_DICTIONARY_KEY];
                    _.each(perPosDictionary, function (entry, key) {
                        updateDictionaryForKey(globalDictionary, entry, key);
                    })
                }

                /* returns logical sum of all entries in all per-PoS-dictionaries that were already fetched.
                  Will not return entries for PoS that have not been requested yet (by other call) - gathering these 'sum' dictionary is done by occassion, not thru separate web service call.
                */
                function getShoppingAirportsDictionaryForAllPoS() {
                    var globalDictionary = $localStorage[SHOPPING_DICTIONARY_NAME][GLOBAL_DICTIONARY_KEY];
                    if (_.isEmpty(globalDictionary)) {
                        return $q(function (resolve, reject) {
                            getShoppingAirportsDictionary().then(resolve, reject);
                        });
                    }
                    return $q.when(globalDictionary);
                }

                function getFareRangeAirportsDictionaryForAllPoS() {
                    // returning promise, not value, for consistence of return types from this module functions
                    return $q.when($localStorage[FARE_RANGE_DICTIONARY_NAME][GLOBAL_DICTIONARY_KEY]);
                }

                function getLowFareForecastAirportsDictionaryForAllPoS() {
                    // returning promise, not value, for consistence of return types from this module functions
                    return $q.when($localStorage[LOW_FARE_FORECAST_DICTIONARY_NAME][GLOBAL_DICTIONARY_KEY]);
                }

                function containsAirport(airportCode) {
                    return $q(function (resolve, reject) {
                        getAirportData(airportCode).then(function (airportData) {
                            resolve(__.isDefined(airportData));
                        }, function (reason) {
                            ErrorReportingService.reportError('Cannot determine if airport dictionary contains airport' + reason);
                            businessMessagesErrorHandler.handle(reject, reason);
                        });
                    });
                }

                function getAirportData(airportCode) {
                    return $q(function (resolve, reject) {
                        getShoppingAirportsDictionary().then(function (dictionary) {
                            resolve(dictionary[airportCode]);
                        }, reject);
                    });
                }

                function getAirportDataWithAirportCode(airportCode) {
                    return $q(function (resolve, reject) {
                        getAirportData(airportCode).then(function (airportData) {
                            airportData = _.clone(airportData);
                            resolve(_.extend(airportData, {airportCode: airportCode}));
                        }, reject);
                    });
                }

                /*  Performance optimisation: all private functions in this package return the very result object (not its clone, so in particular they return the very local storage object.
                    Public functions always return clone.
                    We could also return clone directly from all private functions (as in all other methods in code that read from local storage),
                    but we want to avoid excessive cloning big objects within invocations local to this package.
                */
                return {
                      getShoppingAirportsDictionary: PromiseUtils.addResolvedObjectCloning(getShoppingAirportsDictionary)
                    , getShoppingAirportsDictionaryForAllPoS: PromiseUtils.addResolvedObjectCloning(getShoppingAirportsDictionaryForAllPoS)
                    , getFareRangeAirportsDictionary: PromiseUtils.addResolvedObjectCloning(getFareRangeAirportsDictionary)
                    , getFareRangeAirportsDictionaryForAllPoS: PromiseUtils.addResolvedObjectCloning(getFareRangeAirportsDictionaryForAllPoS)
                    , getLowFareForecastAirportsDictionary: PromiseUtils.addResolvedObjectCloning(getLowFareForecastAirportsDictionary)
                    , getLowFareForecastAirportsDictionaryForAllPoS: PromiseUtils.addResolvedObjectCloning(getLowFareForecastAirportsDictionaryForAllPoS)
                    , containsAirport: containsAirport
                    , getAirportData: PromiseUtils.addResolvedObjectCloning(getAirportData.bind(this))
                    , getAirportDataWithAirportCode: getAirportDataWithAirportCode
                };

            }])
            .factory('AirportsDictionaryFetchFnFactory', ['AirportLookupDataService', function (AirportLookupDataService) {
                return {
                    /*jshint maxcomplexity: 7*/
                    selectAirportsDictionaryFetchFn: function(selectableAirportsDictionary, selectableAirportsForThisPosOnly = false) {
                        switch (selectableAirportsDictionary) {
                            case 'fareRange': {
                                return (selectableAirportsForThisPosOnly)? AirportLookupDataService.getFareRangeAirportsDictionary: AirportLookupDataService.getFareRangeAirportsDictionaryForAllPoS;
                            }
                            case 'lowFareForecast': {
                                return (selectableAirportsForThisPosOnly)? AirportLookupDataService.getLowFareForecastAirportsDictionary: AirportLookupDataService.getLowFareForecastAirportsDictionaryForAllPoS;
                            }
                            default: {
                                return (selectableAirportsForThisPosOnly)? AirportLookupDataService.getShoppingAirportsDictionary: AirportLookupDataService.getShoppingAirportsDictionaryForAllPoS;
                            }
                        }
                    }
                }
            }])
    });
