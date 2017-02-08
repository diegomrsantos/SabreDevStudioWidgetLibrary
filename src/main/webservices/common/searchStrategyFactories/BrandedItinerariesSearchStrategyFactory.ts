define([
          'util/LodashExtensions'
        , 'angular'
        , 'webservices/SabreDevStudioWebServicesModule'
    ],
    function (
          __
        , angular
        , SDSWebServices
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('BrandedItinerariesSearchStrategyFactory', [
                  'BargainFinderMaxDataService'
                , 'InstaflightsDataService'
            , function (
                  BargainFinderMaxDataService
                , InstaflightsDataService
            ) {
                return {
                    createSearchStrategy: function (activeSearchWebService) {
                        activeSearchWebService = activeSearchWebService || 'bfm';

                        switch (activeSearchWebService) {
                            case 'bfm': {
                                return {
                                    search: function (searchCriteria, callbacks) {
                                        BargainFinderMaxDataService
                                            .getBrandedItineraries(searchCriteria)
                                            .then(callbacks.successCallback, callbacks.failureCallback)
                                            .finally(callbacks.streamEndCallback);
                                    }
                                };
                            }
                            case 'first-instaflights-on-errors-bfm': {
                                return {
                                    search: function (searchCriteria, callbacks) {
                                        InstaflightsDataService
                                            .getItineraries(searchCriteria)
                                            .then(function(result) {
                                                    callbacks.successCallback(result);
                                                    callbacks.streamEndCallback();
                                                }
                                                , function () {
                                                    BargainFinderMaxDataService
                                                        .getBrandedItineraries(searchCriteria)
                                                        .then(callbacks.successCallback, callbacks.failureCallback)
                                                        .finally(callbacks.streamEndCallback);
                                                }
                                            );
                                    }
                                };
                            }
                            case 'instaflights-updated-with-bfm': {
                                return {
                                    search: function (searchCriteria, callbacks) {

                                        var instaflightSuccessCallback = function (value) {
                                            callbacks.successCallback(value);
                                            BargainFinderMaxDataService
                                                .getBrandedItineraries(searchCriteria)
                                                .then(callbacks.updateCallback)
                                                .finally(callbacks.streamEndCallback);
                                        };

                                        var instaflightsFailureCallback = function () {
                                            BargainFinderMaxDataService
                                                .getBrandedItineraries(searchCriteria)
                                                .then(callbacks.successCallback, callbacks.failureCallback)
                                                .finally(callbacks.streamEndCallback);
                                        };

                                        InstaflightsDataService
                                            .getItineraries(searchCriteria)
                                            .then(instaflightSuccessCallback, instaflightsFailureCallback)
                                    }
                                };
                            }
                            default: {
                                throw new Error('unrecognized search web service: ' + activeSearchWebService);
                            }
                        }
                    }
                };
            }
        ]);

    });
