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

                    function correctAirlineName(airlineName) {
                        // removing company legal organization form abbreviations, plus patching several most common and too long airlines names
                        return airlineName.replace(/S\.?A\.?/g, '')
                            .replace(/gmbh/gi, '')
                            .replace(/Ltd\.?/gi, '')
                            .replace(/L\.?L\.?C\.?/gi, '')
                            .replace(/Limited/gi, '')
                            .replace(/Inc\.?/gi, '')
                            .replace(/AG/gi, '')
                            .replace(/Pty/gi, '')
                            .replace(/Co\./gi, '')
                            .replace(/C\.?A\.?/g, '')//WARN Air Canada, American Airlines
                            .replace(/.*Lan.*Ecuador.*/g, 'Lan Ecuador')
                            .replace(/.*Lan.*Equador.*/g, 'Lan Equador')
                            .replace(/.*SWISS.*/g, 'SWISS')
                            .replace(/.*Iberia.*/g, 'Iberia')
                            .replace(/.*Air.*Berlin.*/g, 'Air Berlin')
                            .replace(/.*Malaysian.*Airline.*/g, 'Malaysian Airline')
                            .replace(/.*Ukraine.*International.*/g, 'Ukraine International Airlines')
                            .replace(/.*Virgin.*Australia.*/g, 'Virgin Australia')
                            .replace(/.*Alitalia.*/g, 'Alitalia')
                            .replace(/.*Austrian.*/g, 'Austrian Airlines');
                    }

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
                                                        , AirlineName: correctAirlineName(item.AirlineName)
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
                                    dictionary[item.AirlineCode] = correctAirlineName(item.AirlineName);
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
