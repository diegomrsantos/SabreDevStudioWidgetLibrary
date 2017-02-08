define([
    'angular',
    'lodash',
    'util/LodashExtensions',
    'webservices/SabreDevStudioWebServicesModule'
    ],
    function (
    angular,
    _,
    __,
    SabreDevStudioWebServicesModule
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('GeoCodeDataServiceRequestFactory', function () {

                function buildRequestElementForAirportCode(airportCode) {
                    return {
                        GeoCodeRQ: {
                            PlaceById: {
                                Id: airportCode,
                                BrowseCategory: {
                                    name: "AIR"
                                }
                            }
                        }
                    };
                }

                return {
                    buildRequest: function (airportCodes) {
                        return airportCodes.map(buildRequestElementForAirportCode);
                    }
                }
            })
            .factory('GeoCodeDataService', [
                '$q'
                , 'GeoCodeWebService'
                , 'GeoCodeDataServiceRequestFactory'
                //, '$localStorage'
                , 'ErrorReportingService'
                , 'businessMessagesErrorHandler'
                , function ($q
                    , GeoCodeWebService
                    , GeoCodeDataServiceRequestFactory
                            //, $localStorage
                    , ErrorReportingService
                    , businessMessagesErrorHandler) {

                    const MAX_ITEMS_PER_WEBSERVICE_REQUEST = 10;

                    function parseWebServiceResponse(response) {
                        var airportsGeoCoords = {};
                        response.Results.map((locationResult) => {
                            var locationGeoData = locationResult.GeoCodeRS.Place[0];
                            var airportCode = locationGeoData.Id;
                            airportsGeoCoords[airportCode] = {
                                latitude: locationGeoData.latitude,
                                longitude: locationGeoData.longitude
                            };
                        });
                        return airportsGeoCoords;
                    }

                    function splitIntoRequestChunks(airportCodes) {
                        return _.chunk(airportCodes, MAX_ITEMS_PER_WEBSERVICE_REQUEST);
                    }

                    function mergeObjectsProperties(first, second) {
                        return _.extend({}, first, second);
                    }

                    function errorsMergingFn(first, second) {
                        first = first || [];
                        return _.unique(__.pushAll(first, second));
                    }

                    function processOneChunk(chunk) {
                        var request = GeoCodeDataServiceRequestFactory.buildRequest(chunk);
                        return $q(function (resolve, reject) {
                            GeoCodeWebService.sendRequest(request)
                                .then((response) => {
                                    var airportsGeoCoordinates = parseWebServiceResponse(response);
                                    //persistInLocalStorage(airportCodes, geoCoordinates);
                                    resolve(airportsGeoCoordinates);
                                }, function (reason) {
                                    businessMessagesErrorHandler.handle(reject, reason);
                                });
                        });
                    }

                    function getAllAirportsGeoCoordinatesDictionary(airportCodes) {
                        return $q(function (resolve, reject) {
                            var requestChunks = splitIntoRequestChunks(airportCodes);
                            var chunkResultsPromises = requestChunks.map(processOneChunk);
                            var allDictionariesMergedPromise = $q.mergePromises(chunkResultsPromises, mergeObjectsProperties, errorsMergingFn);
                            allDictionariesMergedPromise
                                .then((dict) => resolve(dict))
                                .catch(function (reason) {
                                    ErrorReportingService.reportError('Cannot get geo coordinates for airports', reason);
                                    reject(reason);
                                });
                        });
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
