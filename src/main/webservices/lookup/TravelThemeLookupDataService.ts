define([
          'angular'
        , 'lodash'
        , 'webservices/SabreDevStudioWebServicesModule'
    ],
    function (
          angular
        , _
        , SabreDevStudioWebServicesModule
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('TravelThemeLookupDataService', [
                      '$q'
                    , 'TravelThemeLookupWebService'
                    , '$localStorage'
                    , 'ErrorReportingService'
                    , 'businessMessagesErrorHandler'
                , function (
                      $q
                    , TravelThemeLookupWebService
                    , $localStorage
                    , ErrorReportingService
                    , businessMessagesErrorHandler
                ) {

                function parseWebServiceResponse(response) {
                    return response.Themes.map(function (element) {
                        return element.Theme;
                    });
                }

               return {
                   getTravelThemes: function () {
                       return $q(function (resolve, reject) {
                           if ($localStorage.travelThemesList) {
                               return resolve(_.clone($localStorage.travelThemesList));
                           }
                           TravelThemeLookupWebService.get().$promise.then(
                               function (response) {
                                   var travelThemesList = parseWebServiceResponse(response);
                                   $localStorage.travelThemesList = travelThemesList;
                                   resolve(_.clone(travelThemesList));
                               }
                               , function (reason) {
                                   ErrorReportingService.reportError('Cannot get travel themes dictionary');
                                   businessMessagesErrorHandler.handle(reject, reason);
                               }
                           );
                       });
                   }
               };
            }])
    });
