define([
          'angular'
        , 'lodash'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'util/GeoLocationService'
    ],
    function (
          angular
        , _
        , SabreDevStudioWebServicesModule
        , GeoLocationServiceSrc
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('GeoSearchDataServiceRequestFactory', function () {
                return {
                    buildRequest: function (geoCoordinates, maxResults, maxDistance) {
                        var DEFAULT_MAX_RADIUS_FOR_AIRPORT_SEARCH_MILES = 50; // by default, when max distance is not specified the web service looks in the radius of 0 miles which is not enough for airport search
                        maxDistance = maxDistance || DEFAULT_MAX_RADIUS_FOR_AIRPORT_SEARCH_MILES;
                        var request = {
                            "GeoSearchRQ":{
                                "ForPlaces":{
                                    "OfCategory":[{
                                            "name":"AIR"
                                        }]
                                },
                                "Around": {
                                    "PlaceByLatLong":{
                                        "latitude":geoCoordinates.latitude,
                                        "longitude":geoCoordinates.longitude
                                    }
                                }
                            }
                        };
                        if (maxResults) {
                            request.GeoSearchRQ['ResultSetConfig'] = {
                                maxResults: maxResults
                            };
                        }
                        if (maxDistance) {
                            request.GeoSearchRQ.Around['distance'] = maxDistance;
                        }
                        return request;
                    }
                }
            })
            .factory('GeoSearchDataService', [
                      '$q'
                    , 'GeoSearchWebService'
                    , 'GeoSearchDataServiceRequestFactory'
                    , 'GeoLocationService'
                    , 'AirportLookupDataService'
                    , '$localStorage'
                    , 'ErrorReportingService'
                    , 'businessMessagesErrorHandler'
                , function (
                      $q
                    , GeoSearchWebService
                    , GeoSearchDataServiceRequestFactory
                    , GeoLocationService
                    , AirportLookupDataService
                    , $localStorage
                    , ErrorReportingService
                    , businessMessagesErrorHandler
                ) {

                function parseWebServiceResponse(response) {
                    return response.GeoSearchRS.Found.Place.map(function (item) {
                        return item.Id;
                    });
                }

                function getClosestAirports(maxResults, maxDistance) {
                    return $q(function (resolve, reject) {
                        GeoLocationService.getCurrentPosition().then(function (geoCoordinates) {
                                getClosestAirportsForGeo(geoCoordinates, maxResults, maxDistance).then(resolve, reject)
                        }, reject);
                    });
                }

                function getAPISupportedClosestAirports(maxResults, maxDistance) {
                    return $q(function (resolve, reject) {
                        GeoLocationService.getCurrentPosition().then(function (geoCoordinates) {
                            getAPISupportedClosestAirportsForGeo(geoCoordinates, maxResults, maxDistance).then(resolve, reject)
                        }, reject);
                    });
                }

                function getAPISupportedClosestAirportsForGeo(geoCoordinates, maxResults, maxDistance) {
                    return $q(function (resolve, reject) {
                        getClosestAirportsForGeo(geoCoordinates, maxResults, maxDistance).then(function (airports) {
                            // intersect closest airports from geo api call with the airports supported by flights search apis
                            $q.mapSettled(airports, AirportLookupDataService.getAirportData).then(function (results) {
                                return resolve(airports.filter(function (airportCode, index) {
                                    return results[index].value;
                                }));
                            }, reject);
                        }, reject);
                    });
                }

                function getClosestAirportsForGeo(geoCoordinates, maxResults, maxDistance) {
                    return $q(function (resolve, reject) {
                        var foundInLocalStorage = getFromLocalStorage(geoCoordinates, maxResults, maxDistance);
                        if (foundInLocalStorage) {
                            return resolve(_.clone(foundInLocalStorage));
                        }
                        var request = GeoSearchDataServiceRequestFactory.buildRequest(geoCoordinates, maxResults, maxDistance);
                        GeoSearchWebService.sendRequest(request).then(
                            function (response) {
                                var closestAirports = parseWebServiceResponse(response);
                                persistInLocalStorage(geoCoordinates, maxResults, maxDistance, closestAirports);
                                resolve(closestAirports);
                            }
                            , function (reason) {
                                ErrorReportingService.reportError('Cannot get closest airports', geoCoordinates);
                                businessMessagesErrorHandler.handle(reject, reason);
                            }
                        );
                    });
                }

                function getFromLocalStorage(geoCoordinates, maxResults, maxDistance) {
                    // as geo coordinates from browser differ minimally across subsequent API calls even without device move, then we round by 1 digit after comma, which equals to several miles, to have any hits from the local storage cache
                    var cacheKey = JSON.stringify([_.round(geoCoordinates.latitude, 1), _.round(geoCoordinates.longitude, 1), maxResults, maxDistance]);
                    return $localStorage.closestAirportsForGeo && $localStorage.closestAirportsForGeo[cacheKey];
                }

                function persistInLocalStorage(geoCoordinates, maxResults, maxDistance, closestAirports) {
                    if (_.isUndefined($localStorage.closestAirportsForGeo)) {
                        $localStorage.closestAirportsForGeo = {};
                    }
                    var cacheKey = JSON.stringify([_.round(geoCoordinates.latitude, 1), _.round(geoCoordinates.longitude, 1), maxResults, maxDistance]);
                    $localStorage.closestAirportsForGeo[cacheKey] = closestAirports;
                }

                return {
                      getClosestAirport: _.partial(getClosestAirports, 1)
                    , getClosestAirports: getClosestAirports
                    , getClosestAirportsForGeo: getClosestAirportsForGeo
                    , getAPISupportedClosestAirport: _.partial(getAPISupportedClosestAirports, 1)
                    , getAPISupportedClosestAirports: getAPISupportedClosestAirports
                    , getAPISupportedClosestAirportsForGeo: getAPISupportedClosestAirportsForGeo
                };
            }])
    });
