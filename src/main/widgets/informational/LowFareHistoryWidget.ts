define([
          'moment'
        , 'angular'
        , 'lodash'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'widgets/BaseController'
        , 'widgets/GlobalChartsConfiguration'
        , 'webservices/informational/LowFareHistoryDataService'
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
                chartData.labels = _.pluck(lowFareHistory.historicalPrices, 'dateOfShopping').map(DateToStringRedefineFactory.patchToStringMethod).reverse();
                chartData.datasets[0].data = _.pluck(lowFareHistory.historicalPrices, 'lowestFare').reverse();
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
                return !(_.isEmpty(chartData.datasets[0].data));
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
                    scope: true,
                    replace: false,
                    templateUrl: '../widgets/view-templates/widgets/LowFareHistory.tpl.html',
                    controller: 'LowFareHistoryCtrl',
                    controllerAs: 'ctrl',
                    link: function (scope, element, attrs, controller) {

                        chartInstance = chartsFactory.createBarChart(element, chartData);

                        controller.executeLifeSearchOnPredefinedCriteriaIfPresent(attrs.origin, attrs.destination, attrs.departureDate, attrs.returnDate);
                    }
                }
            }]);
    });
