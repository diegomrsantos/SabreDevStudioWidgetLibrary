define([
        'angular',
        'lodash',
        'util/LodashExtensions',
        'webservices/SabreDevStudioWebServicesModule',
        'webservices/geo/GeoSearchDataService',
        'webservices/lookup/AirportLookupDataService'
    ],
    function (
        angular,
        _,
        __,
        SabreDevStudioWebServicesModule,
        GeoSearchDataServiceSrc,
        AirportLookupDataServiceSrc
    ) {
        'use strict';


        return angular.module('sabreDevStudioWebServices')
            .factory('ClosestAirportGeoService', [
                '$q',
                'GeoSearchDataService',
                'AirportLookupDataService',
                function (
                $q,
                GeoSearchDataService,
                AirportLookupDataService
                ) {

                    function getClosestAirportData(closestAirportOverride) {
                        return $q(function (resolve, reject) {
                            var closestAirportPromise = (__.isDefined(closestAirportOverride))? $q.when(closestAirportOverride): GeoSearchDataService.getAPISupportedClosestAirport();
                            var closestAirportGeoData = {
                                airportCode: undefined,
                                countryCode: undefined
                            };
                            closestAirportPromise
                                .then(function (closestAirport) {
                                    closestAirportGeoData.airportCode = closestAirport;
                                    return AirportLookupDataService.getAirportData(closestAirport)
                                }, reject)
                                .then(function (airportData) {
                                    closestAirportGeoData.countryCode = airportData.CountryCode;
                                    resolve(closestAirportGeoData);
                                }, reject);
                        });
                    }

                    return {
                        getClosestAirportData: getClosestAirportData
                    };
                }
            ]);
    });

