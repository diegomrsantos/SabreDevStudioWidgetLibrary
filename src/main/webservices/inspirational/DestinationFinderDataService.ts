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
            .factory('DestinationFinderDataService', [
                  '$q'
                , 'dateFormat'
                , 'DestinationFinderWebService'
                , 'pointOfSaleCountry'
                , 'ErrorReportingService'
                , 'businessMessagesErrorHandler'
                , function (
                      $q
                    , dateFormat
                    , DestinationFinderWebService
                    , pointOfSaleCountry
                    , ErrorReportingService
                    , businessMessagesErrorHandler
                ) {
                    function translateSearchCriteriaIntoRequestParams(searchCriteria) {
                        var requestParams = _.extend({}, searchCriteria);
                        requestParams.earliestdeparturedate = searchCriteria.earliestdeparturedate.format(dateFormat);
                        requestParams.latestdeparturedate = searchCriteria.latestdeparturedate.format(dateFormat);

                        var requestedPointOfSaleCountry = (searchCriteria.pointOfSaleCountry) && searchCriteria.pointOfSaleCountry || (pointOfSaleCountry.length > 0) && pointOfSaleCountry;
                        if (requestedPointOfSaleCountry) {
                            requestParams.pointofsalecountry = requestedPointOfSaleCountry;
                        }
                        return requestParams;
                    }

                    return {
                        getPricesForDestinations: function (searchCriteria) {
                            return $q(function(resolve, reject) {
                                var requestParams = translateSearchCriteriaIntoRequestParams(searchCriteria);
                                DestinationFinderWebService.get(requestParams).$promise.then(
                                    function (response) {
                                        resolve(response);
                                    },
                                    function (reason) {
                                        ErrorReportingService.reportError('Could not get prices for destinations', searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason);
                                    }
                                );
                            });
                        }
                    };
                }]);

    });