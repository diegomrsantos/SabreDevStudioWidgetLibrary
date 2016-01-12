define([
          'angular'
        , 'moment'
        , 'lodash'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/WebServicesResourceDefinitions'
    ],
    function (
          angular
        , moment
        , _
        , SabreDevStudioWebServicesModule
        , WebServicesResourceDefinitions
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('DestinationPricerDataService', [
                  '$q'
                , 'DestinationPricerWebService'
                , 'pointOfSaleCountry'
                , 'ErrorReportingService'
                , 'businessMessagesErrorHandler'
                , function (
                      $q
                    , DestinationPricerWebService
                    , pointOfSaleCountry
                    , ErrorReportingService
                    , businessMessagesErrorHandler
                ) {
                    function translateSearchCriteriaIntoRequestParams(searchCriteria) {
                        var requestedPointOfSaleCountry = (searchCriteria.pointOfSaleCountry) && searchCriteria.pointOfSaleCountry || (pointOfSaleCountry.length > 0) && pointOfSaleCountry;
                        var requestOptions = {
                            destination: searchCriteria.destination
                        };
                        if (requestedPointOfSaleCountry) {
                            _.extend(requestOptions, {
                                pointofsalecountry: requestedPointOfSaleCountry
                            });
                        }
                        return requestOptions;
                    }

                    return {
                        getPricesToDestination: function (searchCriteria) {
                            return $q(function(resolve, reject) {
                                var requestParams = translateSearchCriteriaIntoRequestParams(searchCriteria);
                                DestinationPricerWebService.get(requestParams).$promise.then(
                                    function (response) {
                                        resolve(response);
                                    },
                                    function (reason) {
                                        ErrorReportingService.reportError('Could not get cheapest flights to destination', searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason);
                                    }
                                );
                            });
                        }
                    };
                }]);

    });