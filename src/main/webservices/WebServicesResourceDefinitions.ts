define([
          'lodash'
        , 'angular'
        , 'angular_resource'
        , 'Configuration'
        , 'webservices/SabreDevStudioWebServicesModule'
    ],
    function (
          _
        , angular
        , angular_resource
        , Configuration
        , SabreDevStudioWebServicesModule

    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('requestHeadersFactory', [
                'apiSpecificHeaders',
                function (
                    apiSpecificHeaders
                ) {
                    const generalHeaders = {
                        'Content-Type' : 'application/JSON'
                    };
                    const headers = _.extend({}, generalHeaders, apiSpecificHeaders);
                    return {
                        getHeaders: () => headers
                    }
                }
            ])
            .factory('CachingDecorator', [
                      '$q'
                    , '$cacheFactory'
                , function (
                      $q
                    , $cacheFactory
                ) {
                    var uniqueId = 0;

                    return {
                        /**
                         * This function adds caching feature to the resource. Angular allows to configure caching for resources only for GET service.
                         * If you need to use caching for other HTTP methods (like Sabre Dev Studio POST that is actually a 'get' method)
                         * then you have to handle it manually - and this wrapper adds this functionality to your resource.
                         *
                         *
                         * It is also possible (the optional second parameter) to instruct the wrapper to cache responses not only for successful HTTP responses, but also for HTTP error responses (like 404).
                         * This might be useful when we assume that next call to endpoint will not return any different data (like most probably we get another 404 again).
                         *
                         * @param resourceMethod NG resource method to wrap
                         * @param [httpErrorCodesToCacheResponseFor] array of HTTP error codes to cache response for (for example [404])
                         * @returns {Function} wrapped function
                         */
                        addCaching: function (resourceMethod, httpErrorCodesToCacheResponseFor) {
                            var responseCache = $cacheFactory('CachingDecoratorCache_' + uniqueId++);
                            return function (request) {
                                var cacheKey = JSON.stringify(request);
                                return $q(function(resolve, reject) {
                                    var cached = responseCache.get(cacheKey);
                                    if (cached && cached.success) {
                                        return resolve(cached.success);
                                    }
                                    if (cached && cached.error) {
                                        return reject(cached.error);
                                    }
                                    resourceMethod({}, request).$promise.then(
                                        function (response) {
                                            responseCache.put(cacheKey, {
                                                success: response
                                            });
                                            return resolve(response);
                                        },
                                        function (error) {
                                            if (_.contains(httpErrorCodesToCacheResponseFor, error.status)) {
                                                responseCache.put(cacheKey, {
                                                    error: error
                                                });
                                            }
                                            return reject(error);
                                        }
                                    );
                                });
                                };
                        }
                    };

            }])
            .factory('AdvancedCalendarSearchService', [
                      '$resource'
                    , 'apiURL'
					, 'requestHeadersFactory'
                    , 'CachingDecorator'
                , function (
                      $resource
                    , apiURL
					, requestHeadersFactory
                    , CachingDecorator
                ) {
                    var endpointURL = apiURL + '/v1.9.4/shop/calendar/flights';

                    var resource = $resource(endpointURL, null, {
                        sendRequest: {
                              method: 'POST'
                            , headers: requestHeadersFactory.getHeaders()
                            , timeout: 15000
                        }
                    });
                    return {
                        sendRequest: CachingDecorator.addCaching(resource.sendRequest, [404])
                    };
             }])
            .factory('BargainFinderMaxWebService', [
                      '$resource'
                    , 'apiURL'
					, 'requestHeadersFactory'
                    , 'CachingDecorator'
                , function (
                      $resource
                    , apiURL
					, requestHeadersFactory
                    , CachingDecorator
                ) {
                    var endpointURL = apiURL + '/v1.9.5/shop/flights?mode=live';

                    var resource = $resource(endpointURL, null, {
                        sendRequest: {
                              method: 'POST'
                            , headers: requestHeadersFactory.getHeaders()
                            , timeout: 30000
                        }
                    });
                    return {
                        sendRequest: CachingDecorator.addCaching(resource.sendRequest, [404])
                    };
                }])
            .factory('BargainFinderMaxAlternateDateWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , 'CachingDecorator'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                    , CachingDecorator
                ) {
                    var endpointURL = apiURL + '/v1.8.6/shop/altdates/flights?mode=live';

                    var resource = $resource(endpointURL, null, {
                        sendRequest: {
                            method: 'POST'
                            , headers: requestHeadersFactory.getHeaders()
                            , timeout: 30000
                        }
                    });
                    return {
                        sendRequest: CachingDecorator.addCaching(resource.sendRequest, [404])
                    };
                }])
            .factory('InstaFlightsWebService', [
                      '$resource'
                    , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                      $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/shop/flights';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
             }])
            .factory('LeadPriceCalendarWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/shop/flights/fares';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
            }])
            .factory('FareForecastWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/forecast/flights/fares';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
            }])
            .factory('FareRangeWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/historical/flights/fares';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
             }])
            .factory('LowFareHistoryWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/historical/shop/flights/fares';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('DestinationPricerWebService', [ // aka Flights To
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/shop/flights/cheapest/fares/:destination';
                    return $resource(endpointURL, {destination: '@_destination'}, {
                        get: {
                              method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('DestinationFinderWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v2/shop/flights/fares/';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('AirlineLookupWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/lists/utilities/airlines/';
                    return $resource(endpointURL, {}, {
                        get: {
                              method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('EquipmentLookupWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/lists/utilities/aircraft/equipment/';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('AirlineLookupWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/lists/utilities/airlines/';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('PointOfSaleCountryLookupWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/lists/supported/pointofsalecountries/';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('ShoppingAirportsAndCitiesLookupWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/lists/supported/shop/flights/origins-destinations/';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('FareRangeAirportsAndCitiesLookupWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/lists/supported/historical/flights/origins-destinations/';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('LowFareForecastAirportsAndCitiesLookupWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/lists/supported/forecast/flights/origins-destinations/';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('TravelThemeLookupWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/lists/supported/shop/themes/';
                    return $resource(endpointURL, {}, {
                        get: {
                            method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('TravelSeasonalityWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                ) {
                    var endpointURL = apiURL + '/v1/historical/flights/:destination/seasonality';
                    return $resource(endpointURL, {destination: '@_destination'}, {
                        get: {
                              method:'GET'
                            , cache: true
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                }])
            .factory('GeoSearchWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , 'CachingDecorator'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                    , CachingDecorator
                ) {
                    var endpointURL = apiURL + '/v1/lists/utilities/geosearch/locations';
                    var resource = $resource(endpointURL, null, {
                        sendRequest: {
                              method:'POST'
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                    return {
                        sendRequest: CachingDecorator.addCaching(resource.sendRequest, [404])
                    };
                }])
            .factory('GeoCodeWebService', [
                '$resource'
                , 'apiURL'
					, 'requestHeadersFactory'
                , 'CachingDecorator'
                , function (
                    $resource
                    , apiURL
					, requestHeadersFactory
                    , CachingDecorator
                ) {
                    var endpointURL = apiURL + '/v1/lists/utilities/geocode/locations';
                    var resource = $resource(endpointURL, null, {
                        sendRequest: {
                            method:'POST'
                            , headers: requestHeadersFactory.getHeaders()
                        }
                    });
                    return {
                        sendRequest: CachingDecorator.addCaching(resource.sendRequest, [404])
                    };
                }])


    });
