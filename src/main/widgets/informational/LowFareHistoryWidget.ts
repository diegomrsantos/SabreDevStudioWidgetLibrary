define([
          'moment'
        , 'angular'
        , 'lodash'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'widgets/BaseController'
        , 'widgets/GlobalChartsConfiguration'
        , 'webservices/informational/LowFareHistoryDataService'
        , 'widgets/WidgetGlobalCallbacks'
    ],
    function (
          moment
        , angular
        , _
        , angular_bootstrap
        , SDSWidgets
        , BaseController
        , GlobalChartsConfiguration
        , LowFareHistoryDataServiceSrc
        , WidgetGlobalCallbacks
    ) {
        'use strict';

        var chartInstance;

        var chartData;

        function LowFareHistoryController(
            $scope
            , LowFareHistoryDataService
            , newSearchCriteriaEvent
            , searchCriteriaBroadcastingService
            , globalChartStyleConfiguration
            , DateToStringRedefineFactory
        ) {
            var searchService = {
                executeSearch: LowFareHistoryDataService.getLowFareHistory
            };

            BaseController.call(this, {
                scope: $scope
                , searchService: searchService
                , newSearchCriteriaEvent: newSearchCriteriaEvent
                , searchCriteriaBroadcastingService: searchCriteriaBroadcastingService
            });

            function initializeEmptyModel() {
                chartData = {
                    labels: [],
                    datasets: [{
                        fillColor: globalChartStyleConfiguration.fillColor // Data mixed with the view because it is the only way to specify fill color (and stroke color) in Chart.js, see http://stackoverflow.com/questions/17155072/default-visual-style-in-chart-js-bar-chart
                        , data: []
                    }]
                };
            }

            initializeEmptyModel();

            this.processSearchResults = function (lowFareHistory) {
                if ($scope.hideChartLabels) {
                    // even if we do not want to show labels (for example to save on display area), it is still needed to set all labels somehow. Otherwise rendering bar charts breaks (like only one big bar for all data points).
                    chartData.labels = lowFareHistory.historicalPrices.map(item => '');
                } else {
                    chartData.labels = _.pluck(lowFareHistory.historicalPrices, 'dateOfShopping').map(DateToStringRedefineFactory.patchToStringMethod).reverse();
                }
                chartData.datasets[0].data = lowFareHistory.historicalPrices.map(dayItem => {
                    return _.isFinite(dayItem.lowestFare)? dayItem.lowestFare : null;
                }).reverse();
                $scope.historyDaysCount = chartData.datasets[0].data.length;
                chartInstance.initialize(chartData);
            };

            this.clearModel = function () {
                _.remove(chartData.labels);
                chartData.datasets.forEach(function (dataset) {
                    _.remove(dataset.data);
                });
                chartInstance.initialize(chartData);
            };

            this.isAnyDataToDisplayAvailable = function () {
                return chartData.datasets[0].data.filter(_.isFinite).length >= $scope.minDaysDataRequired;
            };

            return this;
        }
        LowFareHistoryController.prototype = Object.create(BaseController.prototype);
        LowFareHistoryController.prototype.constructor = LowFareHistoryController;

        return angular.module('sdsWidgets')
            .controller('LowFareHistoryCtrl', [
                      '$scope'
                    , 'LowFareHistoryDataService'
                    , 'newSearchCriteriaEvent'
                    , 'SearchCriteriaBroadcastingService'
                    , 'globalChartStyleConfiguration'
                    , 'DateToStringRedefineFactory'
                , LowFareHistoryController])
            .directive('lowFareHistory', [
                    'ChartsFactory'
                , function (
                    chartsFactory
                ) {
                return {
                    restrict: 'EA',
                    scope: {
                        hideChartLabels: '@?',
                        hideHeader: '@?',
                        minDaysDataRequired: '@?',
                        searchStartedCallback: '&?',
                        searchSuccessCallback: '&?',
                        searchErrorCallback: '&?'
                    },
                    replace: false,
                    templateUrl: '../widgets/view-templates/widgets/LowFareHistory.tpl.html',
                    controller: 'LowFareHistoryCtrl',
                    controllerAs: 'ctrl',
                    link: function (scope, element, attrs, controller) {
                        scope.minDaysDataRequired = scope.minDaysDataRequired || 1;

                        chartInstance = chartsFactory.createBarChart(element, chartData);

                        controller.executeLifeSearchOnPredefinedCriteriaIfPresent(attrs.origin, attrs.destination, attrs.departureDate, attrs.returnDate);
                        WidgetGlobalCallbacks.linkComplete(scope, element);

                        scope.$on('$destroy', function() {
                            chartInstance.destroy();
                        });
                    }
                }
            }]);
    });
