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
            .factory('AirlineLookupDataService', [
                  '$q'
                , 'AirlineLookupWebService'
                , '$localStorage'
                , 'ErrorReportingService'
                , 'businessMessagesErrorHandler'
                , function (
                    $q
                    , AirlineLookupWebService
                    , $localStorage
                    , ErrorReportingService
                    , businessMessagesErrorHandler
                ) {

                    return {
                        getAirlineAndAirlineCodesList: function () {
                            return $q(function (resolve, reject) {
                                if ($localStorage.airlineAndAirlineCodesList) {
                                    return resolve(_.clone($localStorage.airlineAndAirlineCodesList)); //cloning to protect from client code modifying the collection. For now shallow cloning enough
                                }
                                AirlineLookupWebService.get().$promise.then(
                                    function (response) {
                                        var airlineAndAirlineCodesList = response.AirlineInfo
                                                .map(function (item) {
                                                    return {
                                                        AirlineCode: item.AirlineCode
                                                        , AirlineName: item.AlternativeBusinessName
                                                    };
                                                });
                                        $localStorage.airlineAndAirlineCodesList = airlineAndAirlineCodesList;
                                        resolve(_.clone(airlineAndAirlineCodesList));
                                    }
                                    , function (reason) {
                                        ErrorReportingService.reportError('Cannot get airlines and airline codes dictionary');
                                        businessMessagesErrorHandler.handle(reject, reason);
                                    }
                                );
                            });
                        },
                        getAirlinesDictionary: function () {
                            function parseAirlineLookupResponse(response) {
                                var dictionary = {};
                                response.AirlineInfo.forEach(function (item) {
                                    dictionary[item.AirlineCode] = item.AlternativeBusinessName;
                                });
                                return dictionary;
                            }

                            return $q(function (resolve, reject) {
                                if ($localStorage.airlinesDictionary) {
                                    return resolve(_.clone($localStorage.airlinesDictionary));
                                }
                                AirlineLookupWebService.get().$promise.then(
                                    function (response) {
                                        var airlinesDictionary = parseAirlineLookupResponse(response);
                                        $localStorage.airlinesDictionary = airlinesDictionary;
                                        resolve(_.clone(airlinesDictionary));
                                    }
                                    , function (reason) {
                                        ErrorReportingService.reportError('Cannot get airlines dictionary');
                                        businessMessagesErrorHandler.handle(reject, reason);
                                    }
                                );
                            });
                        }
                    };
                }])
    });
