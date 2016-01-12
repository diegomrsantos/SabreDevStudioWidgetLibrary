define([
          'util/LodashExtensions'
        , 'angular'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/advancedCalendar/AdvancedCalendarService'
    ],
    function (
          _
        , angular
        , SDSWebServices
        , AdvancedCalendarService
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('AlternateDatesSearchStrategyFactory', [
                  'AdvancedCalendarDataService'
                , 'LeadPriceCalendarDataService'
                 ,'BargainFinderMaxDataService'
            , function (
                   AdvancedCalendarDataService
                 , LeadPriceCalendarDataService
                 , BargainFinderMaxDataService
            ) {
                return {
                    createSearchStrategy: function (activeSearchWebService) {
                        activeSearchWebService = activeSearchWebService || 'bfmAltDates';

                        switch (activeSearchWebService) {
                            case 'bfmAltDates':
                                return {
                                    getAlternateDatesPriceMatrix: function (searchCriteria, successCallback, failureCallback) {
                                        BargainFinderMaxDataService.getAlternateDatesPriceMatrix(searchCriteria).then(successCallback, failureCallback);
                                    }
                                };
                            case 'advancedCalendar':
                                return {
                                    getAlternateDatesPriceMatrix: function (searchCriteria, successCallback, failureCallback) {
                                        AdvancedCalendarDataService.getAlternateDatesPriceMatrix(searchCriteria).then(successCallback, failureCallback);
                                    }
                                };
                            case 'leadPriceCalendar':
                                return {
                                    getAlternateDatesPriceMatrix: function (searchCriteria, successCallback, failureCallback) {
                                        LeadPriceCalendarDataService.getAlternateDatesPriceMatrix(searchCriteria).then(successCallback, failureCallback);
                                    }
                                };
                            default:
                                throw new Error('unrecognized web service: ' + activeSearchWebService);
                        }
                    }
                };
            }
        ]);

    });
