define([
    'angular',
    'lodash',
    'util/LodashExtensions',
    'webservices/SabreDevStudioWebServicesModule',
    'webservices/geo/GeoCodeDataService'
    ],
    function (
    angular,
    _,
    __,
    SabreDevStudioWebServicesModule,
    GeoCodeDataServiceSrc
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('CachedGeoCodeDataService', [
                '$q',
                'GeoCodeDataService',
                '$localStorage'
                , function (
                $q,
                GeoCodeDataService,
                $localStorage
                ) {

                    function getAllAirportsGeoCoordinatesDictionary(airportCodes) {
                        return $q(function (resolve, reject) {
                            var itemsFoundInLocalStorage = getFromLocalStorageForAll(airportCodes);
                            if (_.size(itemsFoundInLocalStorage) === _.size(airportCodes)) {
                                return resolve(itemsFoundInLocalStorage);
                            }
                            var itemsToBeLookedUpInWebservice = _.difference(airportCodes, _.keys(itemsFoundInLocalStorage));
                            GeoCodeDataService.getAllAirportsGeoCoordinatesDictionary(itemsToBeLookedUpInWebservice)
                                .then((mappingsFromWebservice) => {
                                    persistInLocalStorageForAll(mappingsFromWebservice);
                                    var localAndWebserviceMappingsMerged = _.extend({}, itemsFoundInLocalStorage, mappingsFromWebservice);
                                    return resolve(localAndWebserviceMappingsMerged);
                                })
                                .catch(reject);
                        });
                    }

                    function getFromLocalStorageForAll(airportCodes) {
                        var allFoundAirportDictionary = {};
                        _.each(airportCodes, (airportCode) => {
                            var airportGeoMapping = getFromLocalStorage(airportCode);
                            _.extend(allFoundAirportDictionary, airportGeoMapping);
                        });
                        return allFoundAirportDictionary;
                    }

                    function getFromLocalStorage(airportCode) {
                        var geoCoordinatesFound = $localStorage.airportsGeoCoordinates && $localStorage.airportsGeoCoordinates[airportCode];
                        if (!geoCoordinatesFound) {
                            return;
                        }
                        var coordsForAirport = {};
                        coordsForAirport[airportCode] = {
                            latitude: geoCoordinatesFound[0],
                            longitude: geoCoordinatesFound[1]
                        };
                        return coordsForAirport;
                    }

                    function persistInLocalStorageForAll(mappingsDictionary) {
                        _.each(mappingsDictionary, (geoCoordinates, airportCode) => {
                            persistInLocalStorage(airportCode, geoCoordinates);
                        });
                    }

                    function persistInLocalStorage(airportCode, geoCoordinates) {
                        if (_.isUndefined($localStorage.airportsGeoCoordinates)) {
                            $localStorage.airportsGeoCoordinates = {};
                        }
                        $localStorage.airportsGeoCoordinates[airportCode] = [geoCoordinates.latitude, geoCoordinates.longitude];
                    }

                    function getAirportGeoCoordinates(airportCode) {
                        return $q(function (resolve, reject) {
                            getAllAirportsGeoCoordinatesDictionary([airportCode]).then((airportsCoordsDict) => {
                                resolve(airportsCoordsDict[airportCode]);
                            }, reject);
                        });
                    }

                    return {
                        getAllAirportsGeoCoordinatesDictionary: getAllAirportsGeoCoordinatesDictionary,
                        getAirportGeoCoordinates: getAirportGeoCoordinates
                    };
                }])
    });
