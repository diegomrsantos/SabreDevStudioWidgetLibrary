define([
          'util/LodashExtensions'
        , 'lodash'
        , 'angular'
        , 'webservices/SabreDevStudioWebServicesModule'
    ],
    function (
          __
        , _
        , angular
        , SDSWebServices
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('ItinerariesSearchStrategyFactory', [
                  'BargainFinderMaxDataService'
                , 'InstaflightsDataService'
                , 'AdvancedCalendarDataService'
            , function (
                  BargainFinderMaxDataService
                , InstaflightsDataService
                , AdvancedCalendarDataService
            ) {

                return {
                    /*jshint maxcomplexity:9*/
                    createSearchStrategy: function (activeSearchWebService) {
                        activeSearchWebService = activeSearchWebService || 'instaflights';

                        switch (activeSearchWebService) {
                            case 'bfm-enable-diversity-swapper': {
                                return {
                                    search: function (searchCriteria, callbacks) {
                                        BargainFinderMaxDataService
                                            .getItineraries(searchCriteria)
                                            .then(callbacks.successCallback, callbacks.failureCallback)
                                            .finally(callbacks.streamEndCallback);
                                    }
                                };
                            }
                            case 'bfm': {
                                return {
                                    search: function (searchCriteria, callbacks) {
                                        var searchCriteriaClone =  _.create(Object.getPrototypeOf(searchCriteria), searchCriteria)
                                        searchCriteriaClone.diversityModelOptions = undefined;
                                        BargainFinderMaxDataService
                                            .getItineraries(searchCriteriaClone)
                                            .then(callbacks.successCallback, callbacks.failureCallback)
                                            .finally(callbacks.streamEndCallback);
                                    }
                                };
                            }
                            case 'instaflights': {
                                return {
                                    search: function (searchCriteria, callbacks) {
                                        InstaflightsDataService
                                            .getItineraries(searchCriteria)
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
                                                        .getItineraries(searchCriteria)
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
                                                .getItineraries(searchCriteria)
                                                .then(callbacks.updateCallback)
                                                .finally(callbacks.streamEndCallback);
                                        };

                                        var instaflightsFailureCallback = function () {
                                            BargainFinderMaxDataService
                                                .getItineraries(searchCriteria)
                                                .then(callbacks.successCallback, callbacks.failureCallback)
                                                .finally(callbacks.streamEndCallback);
                                        };

                                        InstaflightsDataService
                                            .getItineraries(searchCriteria)
                                            .then(instaflightSuccessCallback, instaflightsFailureCallback)
                                    }
                                };
                            }
                            case 'advancedCalendar': {
                                return {
                                    search: function (searchCriteria, callbacks) {
                                        AdvancedCalendarDataService
                                            .getItineraries(searchCriteria)
                                            .then(callbacks.successCallback, callbacks.failureCallback)
                                            .finally(callbacks.streamEndCallback);
                                    }
                                };
                            }
                            case 'first-advancedCalendar-on-errors-bfm': {
                                return {
                                    search: function (searchCriteria, callbacks) {
                                        AdvancedCalendarDataService
                                            .getItineraries(searchCriteria)
                                            .then(function(result) {
                                                callbacks.successCallback(result);
                                                callbacks.streamEndCallback();
                                            }
                                                , function () {
                                                    BargainFinderMaxDataService
                                                        .getItineraries(searchCriteria)
                                                        .then(callbacks.successCallback, callbacks.failureCallback)
                                                        .finally(callbacks.streamEndCallback)
                                                }
                                            )
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
