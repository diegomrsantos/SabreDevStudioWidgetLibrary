/// <reference path="../../../../typings/tsd.d.ts" />
define([
          'angular'
        , 'lodash'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/inspirational/DestinationFinderSummaryDataService'
        , 'webservices/geo/CachedGeoCodeDataService'
    ],
    function (
          angular
        , _
        , SabreDevStudioWebServicesModule
        , DestinationFinderSummaryDataServiceSrv
        , CachedGeoCodeDataServiceSrc
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('DestinationFinderSummaryServiceGeoCoordsDecorator', [
                '$q',
                'DestinationFinderSummaryDataService',
                'CachedGeoCodeDataService'
                , function (
                  $q,
                  DestinationFinderSummaryDataService,
                  GeoCodeDataService
                ) {

                    function getOffersOrderedSummary(searchCriteria) {
                        return $q(function(resolve, reject) {
                            DestinationFinderSummaryDataService.getOffersOrderedSummary(searchCriteria)
                                .then(function(pricesForDestinations) {
                                    var airportCodesToLookUp = pricesForDestinations.pricesForDestinationsGrouped.map((item) => item.destination);
                                    GeoCodeDataService.getAllAirportsGeoCoordinatesDictionary(airportCodesToLookUp)
                                        .then((airportsGeoCoordinates) => {
                                            var pricesForDestinationsGroupedWithGeoCoords = addGeoCoordinates(pricesForDestinations.pricesForDestinationsGrouped, airportsGeoCoordinates);
                                            var pricesForDestinationsWithGeoCoords = _.extend(pricesForDestinations, {
                                                pricesForDestinationsGrouped: pricesForDestinationsGroupedWithGeoCoords
                                            });
                                            resolve(pricesForDestinationsWithGeoCoords);
                                        });
                                }, reject)
                        });
                    }

                    function addGeoCoordinates(objArray, airportsGeoCoordinates) {
                        return objArray.map(function (item) {
                            var geoCoordinates = airportsGeoCoordinates[item.destination];
                            return _.extend({}, item, {geoCoordinates: geoCoordinates});
                        });
                    }

                    return {
                        getOffersOrderedSummary: getOffersOrderedSummary
                    };
                }]);

    });