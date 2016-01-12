define([
          'angular'
        , 'moment'
        , 'lodash'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/WebServicesResourceDefinitions'
        , 'datamodel/FareForecast'
        , 'webservices/common/validators/TravelInsightEngineSearchCriteriaValidator'
    ],
    function (
          angular
        , moment
        , _
        , SabreDevStudioWebServicesModule
        , WebServicesResourceDefinitions
        , FareForecast
        , TravelInsightEngineSearchCriteriaValidator
    ) {
        'use strict';

        var travelInsightEngineSearchCriteriaValidator = new TravelInsightEngineSearchCriteriaValidator();

        return angular.module('sabreDevStudioWebServices')
            .factory('FareForecastResponseParser', function () {
                return {
                    parse: function (response) {
                        var recommendation = response.Recommendation;
                        return new FareForecast(recommendation);
                    }
                };
            })
            .factory('FareForecastDataService', [
                  '$q'
                , 'FareForecastWebService'
                , 'FareForecastResponseParser'
                , 'ErrorReportingService'
                , 'ValidationErrorReportingService'
                , 'businessMessagesErrorHandler'
                , function (
                      $q
                    , FareForecastWebService
                    , FareForecastResponseParser
                    , ErrorReportingService
                    , ValidationErrorReportingService
                    , businessMessagesErrorHandler
                ) {

                    function translateSearchCriteriaIntoRequestParams(searchCriteria) {
                        return {
                            origin: searchCriteria.getFirstLeg().origin
                            , destination: searchCriteria.getFirstLeg().destination
                            , departuredate: searchCriteria.getFirstLeg().departureDateTime.format('YYYY-MM-DD')
                            , returndate: searchCriteria.getSecondLeg().departureDateTime.format('YYYY-MM-DD')
                        };
                    }

                    return {
                        getFareForecast: function (searchCriteria) {
                            return $q(function(resolve, reject) {
                                var validationErrors = travelInsightEngineSearchCriteriaValidator.validate(searchCriteria);
                                if (validationErrors.length > 0) {
                                    ValidationErrorReportingService.reportErrors(validationErrors, 'Unsupported search criteria');
                                    return reject(validationErrors);
                                }
                                var requestParams = translateSearchCriteriaIntoRequestParams(searchCriteria);
                                FareForecastWebService.get(requestParams).$promise.then(
                                    function (response) {
                                        var fareForecast = FareForecastResponseParser.parse(response);
                                        resolve(fareForecast);
                                    },
                                    function (reason) {
                                        ErrorReportingService.reportError('Could not get fare forecast', searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason);
                                    }
                                );
                            });
                        }
                    };
                }])
    });