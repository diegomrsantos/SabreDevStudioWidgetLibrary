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
            .factory('EquipmentLookupDataService', [
                      '$q'
                    , 'EquipmentLookupWebService'
                    , '$localStorage'
                    , 'ErrorReportingService'
                    , 'businessMessagesErrorHandler'
                , function (
                      $q
                    , EquipmentLookupWebService
                    , $localStorage
                    , ErrorReportingService
                    , businessMessagesErrorHandler
                ) {

                function parseEquipmentLookupServiceResponse(response) {
                    var dictionary = {};
                    response.AircraftInfo.forEach(function (item) {
                        dictionary[item.AircraftCode] = item.AircraftName;
                    });
                    return dictionary;
                }

               return {
                   getAircraftDictionary: function () {
                       return $q(function (resolve, reject) {
                           if ($localStorage.aircraftDictionary) {
                               return resolve(_.clone($localStorage.aircraftDictionary));
                           }
                           EquipmentLookupWebService.get().$promise.then(
                               function (response) {
                                   var aircraftDictionary = parseEquipmentLookupServiceResponse(response);
                                   $localStorage.aircraftDictionary = aircraftDictionary;
                                   resolve(_.clone(aircraftDictionary));
                               }
                               , function (reason) {
                                   ErrorReportingService.reportError('Cannot get aircraft dictionary');
                                   businessMessagesErrorHandler.handle(reject, reason);
                               }
                           );
                       });
                   }
               };
            }])
    });
