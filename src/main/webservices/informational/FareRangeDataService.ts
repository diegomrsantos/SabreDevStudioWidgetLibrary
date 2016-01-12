define([
          'angular'
        , 'moment'
        , 'lodash'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/WebServicesResourceDefinitions'
        , 'webservices/common/validators/TravelInsightEngineSearchCriteriaValidator'
    ],
    function (
          angular
        , moment
        , _
        , SabreDevStudioWebServicesModule
        , WebServicesResourceDefinitions
        , TravelInsightEngineSearchCriteriaValidator
    ) {
        'use strict';

        var travelInsightEngineSearchCriteriaValidator = new TravelInsightEngineSearchCriteriaValidator();

        return angular.module('sabreDevStudioWebServices')
            .factory('FareRangeDataService', [
                  '$q'
                , 'FareRangeWebService'
                , 'ErrorReportingService'
                , 'ValidationErrorReportingService'
                , 'businessMessagesErrorHandler'
                , function (
                      $q
                    , FareRangeWebService
                    , ErrorReportingService
                    , ValidationErrorReportingService
                    , businessMessagesErrorHandler
                ) {
                    function translateSearchCriteriaIntoRequestParams(searchCriteria, departureDateRangeRange) {
                        return {
                            origin: searchCriteria.getFirstLeg().origin
                            , destination: searchCriteria.getFirstLeg().destination
                            , earliestdeparturedate: departureDateRangeRange.start.format('YYYY-MM-DD')
                            , latestdeparturedate: departureDateRangeRange.end.format('YYYY-MM-DD')
                            , lengthofstay: searchCriteria.getLengthOfStay()
                        };
                    }

                    return {
                        getFareRange: function (searchCriteria, departureDateRangeRange) {
                            return $q(function(resolve, reject) {
                                var validationErrors = travelInsightEngineSearchCriteriaValidator.validate(searchCriteria);
                                if (validationErrors.length > 0) {
                                    ValidationErrorReportingService.reportErrors(validationErrors, 'Unsupported search criteria');
                                    return reject(validationErrors);
                                }
                                var requestParams = translateSearchCriteriaIntoRequestParams(searchCriteria, departureDateRangeRange);
                                FareRangeWebService.get(requestParams).$promise.then(
                                    function (response) {
                                        resolve(response);
                                    },
                                    function (reason) {
                                        ErrorReportingService.reportError('Could not get fare range', searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason);
                                    }
                                );
                            });
                        }
                    };
                }])
    });