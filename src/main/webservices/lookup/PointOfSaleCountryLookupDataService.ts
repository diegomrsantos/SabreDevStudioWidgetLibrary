define([
          'angular'
        , 'lodash'
        , 'webservices/SabreDevStudioWebServicesModule'
    ],
    function (
          angular
        , _
        , SabreDevStudioWebServicesModule
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('PointOfSaleCountryLookupDataService', [
                    'PointOfSaleCountryLookupWebService'
                    , '$q'
                    , '$localStorage'
                    , 'ErrorReportingService'
                    , 'businessMessagesErrorHandler'
                , function (
                      PointOfSaleCountryLookupWebService
                    , $q
                    , $localStorage
                    , ErrorReportingService
                    , businessMessagesErrorHandler
                ) {
                    function parsePointOfSaleCountriesResponse(response) {
                        return response.Countries.map(function (country) {
                            return {
                                  countryCode: country.CountryCode
                                , countryName: country.CountryName
                            };
                        });
                    }

                    return {
                        getPointOfSaleCountries: function () {
                            return $q(function (resolve, reject) {
                                if ($localStorage.pointOfSaleCountries) {
                                    return resolve(_.clone($localStorage.pointOfSaleCountries));
                                }
                                PointOfSaleCountryLookupWebService.get().$promise.then(
                                    function (response) {
                                        var pointOfSaleCountries = parsePointOfSaleCountriesResponse(response);
                                        $localStorage.pointOfSaleCountries = pointOfSaleCountries;
                                        resolve(_.clone(pointOfSaleCountries));
                                    }
                                    , function (reason) {
                                        ErrorReportingService.reportError('Cannot get point of sales dictionary');
                                        businessMessagesErrorHandler.handle(reject, reason);
                                    }
                                );
                            });
                        }
                    };
                }
            ]);
    });
