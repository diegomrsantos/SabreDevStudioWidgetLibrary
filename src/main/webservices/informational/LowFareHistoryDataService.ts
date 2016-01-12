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
            .factory('LowFareHistoryDataService', [
                  '$q'
                , 'LowFareHistoryWebService'
                , 'pointOfSaleCountry'
                , 'ErrorReportingService'
                , 'ValidationErrorReportingService'
                , 'businessMessagesErrorHandler'
                , function (
                      $q
                    , LowFareHistoryWebService
                    , pointOfSaleCountry
                    , ErrorReportingService
                    , ValidationErrorReportingService
                    , businessMessagesErrorHandler
                ) {

                    function translateSearchCriteriaIntoRequestParams(searchCriteria) {
                        var requestOptions = {
                              origin: searchCriteria.getFirstLeg().origin
                            , destination: searchCriteria.getFirstLeg().destination
                            , departuredate: searchCriteria.getTripDepartureDateTime().format('YYYY-MM-DD')
                            , returndate: searchCriteria.getTripReturnDateTime().format('YYYY-MM-DD')
                        };
                        if (pointOfSaleCountry.length > 0) {
                            _.extend(requestOptions, {
                                pointofsalecountry: pointOfSaleCountry
                            });
                        }
                        return requestOptions;
                    }

                    function parseResponse(rs) {
                        var historicalPrices = rs.FareInfo.map(function (fareInfo) {
                            return {
                                lowestFare: fareInfo.LowestFare
                                , lowestNonStopFare: fareInfo.LowestNonStopFare
                                , dateOfShopping: moment(fareInfo.ShopDateTime, moment.ISO_8601)
                            };
                        });
                        return {
                            origin: rs.OriginLocation
                            , destination: rs.DestinationLocation
                            , currency: rs.FareInfo[0].CurrencyCode
                            , historicalPrices: historicalPrices
                        };
                    }

                    return {
                        getLowFareHistory: function (searchCriteria) {
                            return $q(function(resolve, reject) {
                                var validationErrors = travelInsightEngineSearchCriteriaValidator.validate(searchCriteria);
                                if (validationErrors.length > 0) {
                                    ValidationErrorReportingService.reportErrors(validationErrors, 'Unsupported search criteria');
                                    return reject(validationErrors);
                                }
                                var requestParams = translateSearchCriteriaIntoRequestParams(searchCriteria);
                                LowFareHistoryWebService.get(requestParams).$promise.then(
                                    function (response) {
                                        var lowFareHistory = parseResponse(response);
                                        resolve(lowFareHistory);
                                    },
                                    function (reason) {
                                        ErrorReportingService.reportError('Could not get low fare history', searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason);
                                    }
                                );
                            });
                        }
                    };
                }]);
    });