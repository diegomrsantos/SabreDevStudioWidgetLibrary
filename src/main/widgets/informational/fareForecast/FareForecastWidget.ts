define([
          'angular'
        , 'widgets/SDSWidgets'
        , 'webservices/informational/FareForecastDataService'
        , 'widgets/WidgetGlobalCallbacks'
        , 'widgets/BaseController'
    ],
    function (
          angular
        , SDSWidgets
        , FareForecastDataServiceSrc
        , WidgetGlobalCallbacks
        , BaseController
    ) {
        'use strict';

        function FareForecastController($scope, SearchCriteriaBroadcastingService, newSearchCriteriaEvent, FareForecastDataService) {
            BaseController.call(this, {
                scope: $scope
                , searchService: {
                    executeSearch: FareForecastDataService.getFareForecast
                }
                , newSearchCriteriaEvent: newSearchCriteriaEvent
                , searchCriteriaBroadcastingService: SearchCriteriaBroadcastingService
            });

            function initializeEmptyModel() {
                $scope.fareForecast = {};
            }

            initializeEmptyModel();

            this.processSearchResults = function (fareForecast) {
                $scope.fareForecast.recommendation = fareForecast.recommendation;
            };

            this.clearModel = function () {
                initializeEmptyModel();
            };

            this.isAnyDataToDisplayAvailable = function () {
                return ($scope.fareForecast.recommendation);
            };

            /**
             * Method enforcing the business rules, defined as data attributes to the directive, whether to show wait and unknown recommendations.
             * By default wait and unknown recommendations are not shown, unless requested by directive attributes.
             * @returns {boolean}
             */
            this.showRecommendationPolicy = function () {
                if ($scope.fareForecast.recommendation === 'wait') {
                    return $scope.showWaitRecommendation;
                }
                if ($scope.fareForecast.recommendation === 'unknown') {
                    return $scope.showUnknownRecommendation;
                }
                // for buy recommendation always show
                return true;
            };

            return this;
        }

        FareForecastController.prototype = Object.create(BaseController.prototype);
        FareForecastController.prototype.constructor = FareForecastController;

        return angular.module('sdsWidgets')
            .controller('FareForecastController', [
                  '$scope'
                , 'SearchCriteriaBroadcastingService'
                , 'newSearchCriteriaEvent'
                , 'FareForecastDataService'
                , FareForecastController])
            .directive('fareForecast', function () {
                return {
                    restrict: 'AE',
                    scope: {
                        showWaitRecommendation: '@',
                        showUnknownRecommendation: '@',
                        searchStartedCallback: '&?',
                        searchSuccessCallback: '&?',
                        searchErrorCallback: '&?'
                    },
                    templateUrl: '../widgets/view-templates/widgets/FareForecastWidget.tpl.html',
                    controller: 'FareForecastController',
                    controllerAs: 'ctrl',
                    link: function (scope, element, attrs, controller) {
                        controller.executeLifeSearchOnPredefinedCriteriaIfPresent(attrs.origin, attrs.destination, attrs.departureDate, attrs.returnDate);
                        WidgetGlobalCallbacks.linkComplete(scope, element);
                    }
                };
            });

    });