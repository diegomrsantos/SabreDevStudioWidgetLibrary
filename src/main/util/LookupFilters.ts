interface StatefulFunction {
    (): string;
    $stateful: boolean;
}

interface Lookup {
    (string, ...args:string[]): any;
    $stateful: boolean;
}

define([
          'angular'
        , 'lodash'
        , 'webservices/lookup/AirlineLookupDataService'
        , 'webservices/lookup/AirportLookupDataService'
        , 'webservices/lookup/EquipmentLookupDataService'
        , 'webservices/lookup/PointOfSaleCountryLookupDataService'
    ],
    function (
          angular
        , _
        , AirlineLookupDataServiceSrc
        , AirportLookupDataServiceSrc
        , EquipmentLookupDataServiceSrc
        , PointOfSaleCountryLookupDataServiceSrc
    ) {
        'use strict';

        /**
         * Utility factory that builds a filter that depends in asynchronous response from other service.
         * The filter lazy-loads the web service response. If response is not yet available then it schedules its loading.
         * Till response from asynchronous service is not available, it just returns the provided value (pass thru).
         */
        function buildFilter(getDictionaryFromWebServicePromise) {
            var dictionary = null;
            var dictionaryLoadingAlreadyScheduled = false;
            var filter: StatefulFunction = <StatefulFunction>function (valueToBeLookedUp: string) {
                if (dictionary === null) {
                    if (!dictionaryLoadingAlreadyScheduled) {
                        dictionaryLoadingAlreadyScheduled = true;
                        getDictionaryFromWebServicePromise.then(function (dictionaryFromWebService) {
                            dictionary = dictionaryFromWebService;
                        });
                    }
                    return valueToBeLookedUp; // if dictionary is not loaded yet, then just pass thru the value to be filtered.
                }
                var entryFound = dictionary[valueToBeLookedUp];
                return (entryFound)? entryFound: valueToBeLookedUp;
            };
            filter.$stateful = true; // this is stateful filter so we have to let NG know that it needs to keep executing it on every digest cycle. (Normally filters are executed only if the filtered value changes).
            return filter;
        }

        var perPosFilters = {};

        function getFilterInstance(dictionaryName, getDictionaryPromiseFn, ...getDictionaryPromiseFnArguments) {
            if (_.isUndefined(perPosFilters[dictionaryName])) {
                perPosFilters[dictionaryName] = {};
            }
            if (_.isUndefined(perPosFilters[dictionaryName][getDictionaryPromiseFnArguments.join()])) {
                var dictionaryPromise = getDictionaryPromiseFn.apply(null, getDictionaryPromiseFnArguments);
                perPosFilters[dictionaryName][getDictionaryPromiseFnArguments.join()] = buildFilter(dictionaryPromise);
            }
            return perPosFilters[dictionaryName][getDictionaryPromiseFnArguments.join()];
        }

        return angular.module('sDSLookups', ['sabreDevStudioWebServices'])
            /**
             * given airline IATA code, like 'AA', returns airline full name: like 'American Airlines'
             */
            .filter('airlineFullName', ['AirlineLookupDataService', function (AirlineLookupDataService) {
                return buildFilter(AirlineLookupDataService.getAirlinesDictionary());
            }])
            /**
             * Accepts IATA airport or city code, for example 'LON'.
             * If the value passed is airport and the airport name is different than the city it is located in, then returns bot airport name and city name (comma separated). If they are same returns just one.
             */
            .filter('cityFullName', ['AirportLookupDataService', function (AirportLookupDataService) {
                var filterFromBuilder: Lookup = buildFilter(AirportLookupDataService.getShoppingAirportsDictionary());
                var cityFullNameDecorator = <StatefulFunction>function (airportCode: string) {
                    var entryFound = filterFromBuilder(airportCode);
                    return (entryFound.CityName)? entryFound.CityName: entryFound;
                }
                cityFullNameDecorator.$stateful = true;
                return cityFullNameDecorator;
            }])
            .filter('cityAndAirportFullName', ['AirportLookupDataService', function (AirportLookupDataService) {
                var allPosCountriesFilter: Lookup = getFilterInstance('AirportLookupDataService.getShoppingAirportsDictionaryForAllPoS', AirportLookupDataService.getShoppingAirportsDictionaryForAllPoS);
                var createCityAndAirportNameFilterDecorator = <StatefulFunction>function (airportCode, posCountry) {
                    var perPosCountryFilter: Lookup = getFilterInstance('AirportLookupDataService.getShoppingAirportsDictionary', AirportLookupDataService.getShoppingAirportsDictionary, posCountry);
                    var perPosEntry = perPosCountryFilter(airportCode);
                    if (perPosEntry === airportCode) {
                        let globalEntry = allPosCountriesFilter(airportCode);
                        if (globalEntry === airportCode) {
                            return globalEntry;
                        }
                        perPosEntry = globalEntry;
                    }
                    if (perPosEntry.AirportName !== perPosEntry.CityName) {
                        return perPosEntry.AirportName + ', ' + perPosEntry.CityName;
                    } else {
                        return perPosEntry.AirportName;
                    }
                };
                createCityAndAirportNameFilterDecorator.$stateful = true; // protectively setting true, as filters are selected at runtime (getFilterInstance), and we do now know if stateful or stateless filters will be used (BTW currently filters produced are stateful).
                return createCityAndAirportNameFilterDecorator;
            }])
            /**
             * Given airport/city code, returns the country name (for example Germany) this airport/city is located.
             */
            .filter('airportCountry', ['AirportLookupDataService', function (AirportLookupDataService) {
                var filterFromBuilder: Lookup = buildFilter(AirportLookupDataService.getShoppingAirportsDictionary());

                var getCountryNameFilterDecorator = <StatefulFunction>function (airportCode) {
                    var entryFound = filterFromBuilder(airportCode);
                    if (entryFound === airportCode) {
                        return entryFound;
                    }
                    return entryFound.CountryName
                };
                getCountryNameFilterDecorator.$stateful = filterFromBuilder.$stateful;
                return getCountryNameFilterDecorator;
            }])
            /**
             * Given aircraft code, returns full aircraft full name
             */
            .filter('aircraftName', ['EquipmentLookupDataService', function (EquipmentLookupService) {
                return buildFilter(EquipmentLookupService.getAircraftDictionary());
            }]);
    });
