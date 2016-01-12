define([
          'angular'
        , 'lodash'
        , 'util/LodashExtensions'
        , 'moment'
        , 'moment_range'
        , 'webservices/instaflights/InstaflightResponseParser'
        , 'webservices/common/parsers/OTAResponseParser'
        , 'util/BaseServices'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/WebServicesResourceDefinitions'
        , 'webservices/instaflights/InstaflightSearchCriteriaValidator'
    ],
    function (
          angular
        , _
        , __
        , moment
        , moment_range
        , InstaflightsResponseParser
        , OTAResponseParser
        , BaseServices
        , SabreDevStudioWebServicesModule
        , WebServicesResourceDefinitions
        , InstaflightSearchCriteriaValidator
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('InstaflightsDataService', [
                      '$q'
                    , 'InstaFlightsWebService'
                    , 'dateFormat'
                    , 'pointOfSaleCountry'
                    , 'ErrorReportingService'
                    , 'ValidationErrorReportingService'
                    , 'businessMessagesErrorHandler'
                , function (
                      $q
                    , InstaFlightsWebService
                    , dateFormat
                    , pointOfSaleCountry
                    , ErrorReportingService
                    , ValidationErrorReportingService
                    , businessMessagesErrorHandler
                ) {
                    var parser = new InstaflightsResponseParser();

                    var validator = new InstaflightSearchCriteriaValidator();

                    /*jshint maxcomplexity:6*/
                    function translateSearchCriteriaIntoRequestOptions(searchCriteria) {
                        var requestOptions = {
                              origin: searchCriteria.getFirstLeg().origin
                            , destination: searchCriteria.getFirstLeg().destination
                            , departuredate: searchCriteria.getFirstLeg().departureDateTime.format(dateFormat)
                            , returndate: searchCriteria.getSecondLeg().departureDateTime.format(dateFormat)
                        };
                        if (searchCriteria.preferredAirlines.length > 0) {
                            _.extend(requestOptions, {
                                includedcarriers: searchCriteria.preferredAirlines.join()
                            });
                        }

                        if (__.isDefined(searchCriteria.maxStops)) { //WARN: maxStops may be 0, which will evaluate to false in if(searchCriteria.maxStops)
                            _.extend(requestOptions, {
                                  outboundflightstops: searchCriteria.maxStops
                                , inboundflightstops: searchCriteria.maxStops
                            });
                        }
                        if (searchCriteria.optionsPerDay) {
                            _.extend(requestOptions, {
                                limit: searchCriteria.optionsPerDay
                            });
                        }
                        if (searchCriteria.passengerSpecifications.length > 0) {
                            _.extend(requestOptions, {
                                passengercount: searchCriteria.getTotalPassengerCount()
                            });
                        }
                        if (pointOfSaleCountry.length > 0) {
                            _.extend(requestOptions, {
                                pointofsalecountry: pointOfSaleCountry
                            });
                        }
                        return requestOptions;
                    }

                    return {
                        getItineraries: function(searchCriteria) {
                            return $q(function(resolve, reject) {
                                var validationErrors = validator.validate(searchCriteria);
                                if (validationErrors.length > 0) {
                                    ValidationErrorReportingService.reportErrors(validationErrors, 'Unsupported search criteria');
                                    return reject(validationErrors);
                                }
                                var webServiceRequest = translateSearchCriteriaIntoRequestOptions(searchCriteria);
                                InstaFlightsWebService.get(webServiceRequest).$promise.then(
                                    function (response) {
                                        var itinerariesList = parser.parse(response);
                                        resolve(itinerariesList);
                                    },
                                    function (reason) {
                                        ErrorReportingService.reportError('Instaflights: Could not find itineraries', searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason);
                                    }
                                );
                            });
                        }
                    };

                }]);
});
