define([
          'moment'
        , 'moment_range'
        , 'angular'
        , 'lodash'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'widgets/BaseController'
        , 'widgets/GlobalChartsConfiguration'
        , 'webservices/informational/TravelSeasonalityDataService'
        , 'widgets/WidgetGlobalCallbacks'
    ],
    function (
          moment
        , moment_range  
        , angular
        , _
        , angular_bootstrap
        , SDSWidgets
        , BaseController
        , GlobalChartsConfiguration
        , TravelSeasonalityDataServiceSrc
        , WidgetGlobalCallbacks
    ) {
        'use strict';

        var chartInstance;

        var chartData;

        function TravelSeasonalityController(
              $scope
            , TravelSeasonalityDataService
            , newInspirationalSearchCriteriaEvent
            , InspirationalSearchCriteriaBroadcastingService
            , globalChartStyleConfiguration
            , DateRangeToStringRedefineFactory
        ) {
            var searchService = {
                executeSearch: TravelSeasonalityDataService.getSeasonality
            };

            BaseController.call(this, {
                scope: $scope
                , searchService: searchService
                , newSearchCriteriaEvent: newInspirationalSearchCriteriaEvent
                , searchCriteriaBroadcastingService: InspirationalSearchCriteriaBroadcastingService
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

            this.processSearchResults = function (travelSeasonality) {
                chartData.labels = travelSeasonality.Seasonality
                    .map(function (seasonalityItem) {
                        var periodStart = moment(seasonalityItem.WeekStartDate, moment.ISO_8601);
                        var periodEnd = moment(seasonalityItem.WeekEndDate, moment.ISO_8601);
                        return {
                              range: moment.range(periodStart, periodEnd)
                            , value: seasonalityItem.SeasonalityIndicator
                        };
                    })
                    .map(patchToStringForLabelObject);

                function patchToStringForLabelObject(labelObject) {
                    labelObject.range = DateRangeToStringRedefineFactory.patchToStringMethod(labelObject.range);
                    labelObject.toString = function () {
                        return this.range.toString() + ': ' + labelObject.value;
                    };
                    return labelObject;
                }

                chartData.datasets[0].data
                    = _.pluck(travelSeasonality.Seasonality, 'SeasonalityIndicator')
                    .map(mapSeasonalityIndicatorIntoNumericalValue);

                chartInstance.initialize(chartData);

                function mapSeasonalityIndicatorIntoNumericalValue(seasonalityIndicator) {
                    switch (seasonalityIndicator) {
                        case 'Low': return 1;
                        case 'Medium': return 2;
                        case 'High': return 3;
                    }
                }
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
        TravelSeasonalityController.prototype = Object.create(BaseController.prototype);
        TravelSeasonalityController.prototype.constructor = TravelSeasonalityController;

        return angular.module('sdsWidgets')
            .controller('TravelSeasonalityCtrl', [
                      '$scope'
                    , 'TravelSeasonalityDataService'
                    , 'newInspirationalSearchCriteriaEvent'
                    , 'InspirationalSearchCriteriaBroadcastingService'
                    , 'globalChartStyleConfiguration'
                    , 'DateRangeToStringRedefineFactory'
                , TravelSeasonalityController])
            .directive('travelSeasonality', [
                    'ChartsFactory'
                , function (
                    chartsFactory
                ) {
                return {
                    scope: {
                        searchStartedCallback: '&?',
                        searchSuccessCallback: '&?',
                        searchErrorCallback: '&?'
                    },
                    templateUrl: '../widgets/view-templates/widgets/TravelSeasonalityWidget.tpl.html',
                    controller: 'TravelSeasonalityCtrl',
                    controllerAs: 'ctrl',
                    link: function (scope, element, attrs, controller) {

                        var chartOptionsOverrides = {
                              tooltipTemplate: "<%if (label){%><%=label%><%}%>" // the default was: "<%if (label){%><%=label%>: <%}%><%= value %>". We have cut off value, as we already included it into label. Cannot print value from here as it is primitive number while we would need to patch its toString method. Otherwise we will get numerical values (bars heights)
                            , tooltipFontSize: 16
                            , scaleShowLabels: false // disable y axis labels (as we use numerical values to represent discrete values (Low, Medium, High) from the API
                            , maintainAspectRatio: false
                            // , showScale: false
                            , scaleFontSize: 0 // hack to hide x axis. We could use showScale: false, but then bars have more darker color
                        };
                        var canvasCssOptions = {};
                        if (attrs.chartHeight) {
                            canvasCssOptions['max-height'] = attrs.chartHeight;
                        }
                        chartInstance = chartsFactory.createBarChart(element, chartData, chartOptionsOverrides, canvasCssOptions);

                        executeLifeSearchOnPredefinedCriteriaIfPresent(attrs.destination);

                        function executeLifeSearchOnPredefinedCriteriaIfPresent(destination) {
                            if (_.isUndefined(destination)) {
                                return;
                            }
                            var searchCriteria = {
                                destination: destination,
                                getTripDestination: function () { //duck typing to make it look like full SearchCriteria
                                    return destination;
                                }
                            };
                            controller.processSearchCriteria(searchCriteria);
                        }
                        WidgetGlobalCallbacks.linkComplete(scope, element);

                        scope.$on('$destroy', function() {
                            chartInstance.destroy();
                        });
                    }
                }
            }]);
    });
