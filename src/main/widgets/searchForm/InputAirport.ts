define([
          'angular'
        , 'lodash'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
    ],
    function (
          angular
        , _
        , angular_bootstrap
        , SDSWidgets) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('inputAirport', ['AirportsDictionaryFetchFnFactory', function (AirportsDictionaryFetchFnFactory) {

                return {
                    replace: true,
                    scope: {
                        airport: '='
                        , selectableAirportsForThisPosOnly: '@'
                        , selectableAirportsDictionary: '@'
                    },
                    templateUrl: '../widgets/view-templates/partials/AirportInput.tpl.html',
                    link: function (scope) {
                        var airportsDictionaryFetchFn = AirportsDictionaryFetchFnFactory.selectAirportsDictionaryFetchFn(scope.selectableAirportsDictionary, scope.selectableAirportsForThisPosOnly);
                        airportsDictionaryFetchFn().then(function (dictionary) {
                            var airportsDictionary = _.map(dictionary, function (airportDescription: any, airportCode) {
                                var airportAndCityName = (airportDescription.AirportName === airportDescription.CityName)? airportDescription.CityName: airportDescription.AirportName + ', ' + airportDescription.CityName;
                                return {
                                    fullName: airportAndCityName
                                    , airportCode: airportCode
                                };
                            });
                            scope.airports = airportsDictionary;
                        });
                    }
                }

            }])
    });
