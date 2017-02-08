define([
          'util/LodashExtensions'
        , 'angular'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
    ],
    function (
          __
        , angular
        , angular_bootstrap
        , SDSWidgets
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('itinerarySummaryPricePerStopsPerAirline', function () {
                return {
                    scope: {
                        summary: '=',
                        summaryItemClickedCallback: '&?'
                    },
                    templateUrl: '../widgets/view-templates/widgets/ItineraryPricePerStopsPerAirlineSummary.tpl.html',
                    controller: [
                            '$scope',
                        function (
                            $scope
                        ) {

                        $scope.isAnyDataToDisplayAvailable = function () {
                            return (__.isDefined($scope.summary));
                        };

                        $scope.itemClicked = function (itineraryId) {
                            if (__.isDefined($scope.summaryItemClickedCallback)) {
                                $scope.summaryItemClickedCallback({itineraryId: itineraryId});
                            }
                        };

                        $scope.$on('$destroy', function() {
                           delete $scope.isAnyDataToDisplayAvailable;
                           delete $scope.itemClicked;
                        });
                    }]
                }
            });
    });
