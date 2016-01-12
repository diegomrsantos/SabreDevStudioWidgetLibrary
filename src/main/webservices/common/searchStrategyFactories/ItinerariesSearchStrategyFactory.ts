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
                    /*jshint maxcomplexity:7*/
                    createSearchStrategy: function (activeSearchWebService) {
                        activeSearchWebService = activeSearchWebService || 'instaflights';

                        switch (activeSearchWebService) {
                            case 'bfm': {
                                return {
                                    search: function (searchCriteria, successCallback, failureCallback, updateCallback) {
                                        BargainFinderMaxDataService.getItineraries(searchCriteria).then(successCallback, failureCallback);
                                    }
                                };
                            }
                            case 'instaflights': {
                                return {
                                    search: function (searchCriteria, successCallback, failureCallback, updateCallback) {
                                        InstaflightsDataService.getItineraries(searchCriteria).then(successCallback, failureCallback);
                                    }
                                };
                            }
                            case 'first-instaflights-on-errors-bfm': {
                                return {
                                    search: function (searchCriteria, successCallback, failureCallback, updateCallback) {
                                        InstaflightsDataService.getItineraries(searchCriteria).then(
                                            successCallback
                                            , function () {
                                                BargainFinderMaxDataService.getItineraries(searchCriteria).then(successCallback, failureCallback);
                                            });
                                    }
                                };
                            }
                            case 'instaflights-updated-with-bfm': {
                                return {
                                    search: function (searchCriteria, successCallback, failureCallback, updateCallback) {

                                        var instaflightSuccessCallback = function (value) {
                                            successCallback(value);
                                            BargainFinderMaxDataService.getItineraries(searchCriteria).then(updateCallback);
                                        };

                                        var instaflightsFailureCallback = function () {
                                            BargainFinderMaxDataService.getItineraries(searchCriteria).then(successCallback, failureCallback);
                                        };

                                        InstaflightsDataService.getItineraries(searchCriteria).then(instaflightSuccessCallback, instaflightsFailureCallback);
                                    }
                                };
                            }
                            case 'advancedCalendar': {
                                return {
                                    search: function (searchCriteria, successCallback, failureCallback) {
                                        AdvancedCalendarDataService.getItineraries(searchCriteria).then(successCallback, failureCallback);
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
