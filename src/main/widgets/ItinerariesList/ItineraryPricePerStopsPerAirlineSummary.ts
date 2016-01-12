define([
          'util/LodashExtensions'
        , 'angular'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
    ],
    function (
          _
        , angular
        , angular_bootstrap
        , SDSWidgets
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('itinerarySummaryPricePerStopsPerAirline', function () {
                return {
                    scope: {
                        summary: '='
                    },
                    templateUrl: '../widgets/view-templates/widgets/ItineraryPricePerStopsPerAirlineSummary.tpl.html',
                    controller: ['$scope', function ($scope) {

                        $scope.isAnyDataToDisplayAvailable = function () {
                            return (_.isDefined($scope.summary));
                        };
                    }]
                }
            });
    });
