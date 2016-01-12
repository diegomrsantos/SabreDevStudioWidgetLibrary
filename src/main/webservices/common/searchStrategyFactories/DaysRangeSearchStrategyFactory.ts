define([
          'util/LodashExtensions'
        , 'angular'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/leadPriceCalendar/LeadPriceCalendarWebService'
    ],
    function (
          _
        , angular
        , SDSWebServices
        , LeadPriceCalendarWebService
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('DaysRangeSearchStrategyFactory', [
                  'AdvancedCalendarDataService'
                , 'LeadPriceCalendarDataService'
            , function (
                  AdvancedCalendarDataService
                , LeadPriceCalendarDataService
            ) {
                return {
                    createSearchStrategy: function (activeSearchWebService) {
                        activeSearchWebService = activeSearchWebService || 'leadPriceCalendar';

                        switch (activeSearchWebService) {
                            case 'advancedCalendar':
                                return AdvancedCalendarDataService;
                            case 'leadPriceCalendar':
                                return LeadPriceCalendarDataService;
                            default:
                                throw new Error('unrecognized web service: ' + activeSearchWebService);
                        }
                    }
                };
            }
        ]);

    });
