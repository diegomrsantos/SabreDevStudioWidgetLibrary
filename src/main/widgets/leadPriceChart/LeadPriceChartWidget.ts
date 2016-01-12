define([
          'moment'
        , 'moment_range'
        , 'lodash'
        , 'angular'
        , 'widgets/SDSWidgets'
        , 'widgets/BaseController'
        , 'widgets/GlobalChartsConfiguration'
        , 'datamodel/ShoppingData'
        , 'webservices/common/searchStrategyFactories/DaysRangeSearchStrategyFactory'
    ],
    function (
          moment
        , moment_range
        , _
        , angular
        , SDSWidgets
        , BaseController
        , GlobalChartsConfiguration
        , ShoppingData
        , DaysRangeSearchStrategyFactorySrc
    ) {
        'use strict';

        var chartInstance;

        var chartData;

        function LeadPriceChartController(
            $scope
            , DateService
            , DaysRangeSearchStrategyFactory
            , newSearchCriteriaEvent
            , searchCriteriaBroadcastingService
            , noResultsFoundBroadcastingService
            , globalChartStyleConfiguration
            , DateToStringRedefineFactory
            , DateSelectedBroadcastingService
        ) {

            // WARN: we use two instances of search service: first one that was produced by the search strategy factory,
            // and the other one which is the copy of the first one, with one argument bound (partial), needed to be passed to the superclass constructor, to be used to execute search in webservice
            // Later, while processing search results, when we need to query service for additional data, we use the instance of the first one.
            var searchService = DaysRangeSearchStrategyFactory.createSearchStrategy($scope.activeSearchWebService);

            var firstDayDisplayedCap = DateService.now().startOf('day');
            var firstDayDisplayed = firstDayDisplayedCap.clone();

            var numberOfWeeksToDisplay = parseInt($scope.numberOfWeeksToDisplay) || 2;

            /* tslint:disable:no-shadowed-variable */
            function calculateLastDayDisplayed(firstDayDisplayed) {
                return firstDayDisplayed.clone().add(numberOfWeeksToDisplay, 'weeks').subtract(1, 'day');
            }
            /* tslint:enable:no-shadowed-variable */

            var lastDayDisplayed = calculateLastDayDisplayed(firstDayDisplayed);

            var initialDaysRangeToDisplay = moment.range(firstDayDisplayedCap, lastDayDisplayed);

            var searchServiceWithDateRangeBoundForInitialSearch = {
                executeSearch: _.partialRight(searchService.getLeadPricesForRange, initialDaysRangeToDisplay)
            };

            BaseController.call(this, {
                scope: $scope
                , searchService: searchServiceWithDateRangeBoundForInitialSearch
                , newSearchCriteriaEvent: newSearchCriteriaEvent
                , searchCriteriaBroadcastingService: searchCriteriaBroadcastingService
                , noResultsFoundBroadcastingService: noResultsFoundBroadcastingService
            });

            var that = this;

            var displayedRange;

            this.navigationState = {};

            function initializeEmptyModel() {
                // main model object, storing prices used by the charting library (directive) to draw the lead price chart
                chartData = {
                    labels: [],
                    datasets: [{
                        fillColor: globalChartStyleConfiguration.fillColor // Data mixed with the view because it is the only way to specify fill color (and stroke color) in Chart.js, see http://stackoverflow.com/questions/17155072/default-visual-style-in-chart-js-bar-chart
                        , data: []
                    }]
                };

                var displayedRangeStart = firstDayDisplayedCap.clone();
                var displayedRangeEnd = calculateLastDayDisplayed(displayedRangeStart);
                displayedRange = moment.range(displayedRangeStart, displayedRangeEnd);
            }

            initializeEmptyModel();
            updateStateOfNavigationLinks();

            var lastDayDisplayedCap;

            function updateStateOfNavigationLinks() {
                that.navigationState.prevLinkActive = displayedRange.start.isAfter(firstDayDisplayedCap);
                that.navigationState.nextLinkActive = displayedRange.end.isBefore(lastDayDisplayedCap);
            }

            this.processSearchResults = function (leadPrices) {
                this.minDateAndPricePair = searchService.getMinDateAndPricePair(this.lastSearchCriteria);
                lastDayDisplayedCap = searchService.getMaxAvailableDate(this.lastSearchCriteria);
                updateModelWithLeadPrices(leadPrices);
            };

            this.clearModel = function () {
                _.remove(chartData.labels); // or just initialize empty model (same function, object recreated, not cleared)
                chartData.datasets.forEach(function (dataset) {
                    _.remove(dataset.data);
                });
                chartInstance.initialize(chartData);
            };

            this.isAnyDataToDisplayAvailable = function () {
                var firstDataSeries = _.first(chartData.datasets).data;
                return !_.isEmpty(firstDataSeries);
            };

            this.chartClicked = function (event) {
                var barClicked = chartInstance.getBarsAtEvent(event)[0];
                if (_.isUndefined(barClicked)) { // click was done not on particular bar, but somewhere outside bars
                    return;
                }
                var date = barClicked.label;
                DateSelectedBroadcastingService.newSearchCriteria = this.lastSearchCriteria.cloneWithDatesAdjustedToOtherDepartureDate(date);
                DateSelectedBroadcastingService.originalDataSourceWebService = searchService;
                DateSelectedBroadcastingService.broadcast();
            };

            function updateModelWithLeadPrices(leadPricesAndDateStrings) {
                // leadPricesAndDateStrings is a map of dateStrings into lead prices.
                // map it into array of objects with two properties: date (parsed) and price
                var leadPricesAndDates = _.map(leadPricesAndDateStrings, function (leadPrice, dateString) {
                    return {
                        date: moment(dateString, ShoppingData.prototype.DATE_FORMAT_FOR_KEYS)
                        , leadPrice: leadPrice.price
                    };
                });
                // we have to explicitly sort the leadPricesAndDates array as the iteration order over object properties (iterating over leadPricesAndDateStrings map) is not guaranteed.
                var leadPricesAndDatesSorted = _.sortBy(leadPricesAndDates, 'date');
                var leadPricesAndDatesEmptyDatesFilled = fillEmptyDates(leadPricesAndDatesSorted);

                chartData.labels = _.pluck(leadPricesAndDatesEmptyDatesFilled, 'date').map(DateToStringRedefineFactory.patchToStringMethod);
                chartData.datasets[0].data = _.pluck(leadPricesAndDatesEmptyDatesFilled, 'leadPrice');
                chartInstance.initialize(chartData);

                updateStateOfNavigationLinks();
            }

            function fillEmptyDates(leadPricesAndDatesSorted) {
                // warn complexity O(n^2) (for simplicity now).
                var filled = [];
                displayedRange.by('days', function (day) {
                    var leadPriceFound = _.find(leadPricesAndDatesSorted, function (item) {
                        return item.date.isSame(day);
                    });
                    leadPriceFound = leadPriceFound || {
                          date: day
                        , leadPrice: null
                    };
                    filled.push(leadPriceFound);
                });
                return filled;
            }

            // event handler when earlier days are requested
            this.onEarlierRequested = function () {
                shiftRangePresented(-numberOfWeeksToDisplay);
            };

            // event handler when later days are requested
            this.onLaterRequested = function () {
                shiftRangePresented(numberOfWeeksToDisplay);
            };

            function shiftRangePresented (requestedWeeksOffset) {
                var requestedDaysOffset = requestedWeeksOffset * 7;
                requestedDaysOffset = trimOffsetToObeyLastDayDisplayedCap(requestedDaysOffset);
                displayedRange.start.add(requestedDaysOffset, 'days');
                displayedRange.end = calculateLastDayDisplayed(displayedRange.start);
                searchService.getLeadPricesForRange(that.lastSearchCriteria, displayedRange).then(updateModelWithLeadPrices);
                //WARN: you may want to handle promise rejected as well: probably leave the chart as it is
                // but deactivate the button for next clicks (error not intermittent, not recoverable), display tooltip on error, or similar
            }

            function trimOffsetToObeyLastDayDisplayedCap(requestedDaysOffset) {
                if (requestedDaysOffset > 0) {
                    var numberOfLaterDaysLeftToPresent = lastDayDisplayedCap.diff(displayedRange.end, 'days');
                    return (numberOfLaterDaysLeftToPresent < requestedDaysOffset)? numberOfLaterDaysLeftToPresent : requestedDaysOffset;
                }
                if (requestedDaysOffset < 0) {
                    var numberOfEarlierDaysLeftToPresent = displayedRange.start.diff(firstDayDisplayedCap, 'days');
                    return (numberOfEarlierDaysLeftToPresent < Math.abs(requestedDaysOffset))? -numberOfEarlierDaysLeftToPresent: requestedDaysOffset; // requestedDaysOffset is negative (moving to past) so the returned numberOfEarlierDaysLeftToPresent must be also negative if returned as offset value
                }
            }
           return this;
        }
        LeadPriceChartController.prototype = Object.create(BaseController.prototype);
        LeadPriceChartController.prototype.constructor = LeadPriceChartController;

        return angular.module('sdsWidgets')
            .controller('LeadPriceChartCtrl', [
                      '$scope'
                    , 'DateService'
                    , 'DaysRangeSearchStrategyFactory'
                    , 'newSearchCriteriaEvent'
                    , 'SearchCriteriaBroadcastingService'
                    , 'NoResultsFoundBroadcastingService'
                    , 'globalChartStyleConfiguration'
                    , 'DateToStringRedefineFactory'
                    , 'DateSelectedBroadcastingService'
                , LeadPriceChartController])
            .directive('leadPriceChart', [
                     'ChartsFactory'
                , function (
                    chartsFactory
                ) {
                return {
                    restrict: 'AE',
                    scope: {
                          numberOfWeeksToDisplay: '@'
                        , activeSearchWebService: '@'
                    },
                    replace: false,
                    templateUrl: '../widgets/view-templates/widgets/LeadPriceChartWidget.tpl.html',
                    controller: 'LeadPriceChartCtrl',
                    controllerAs: 'ctrl',
                    link: function(scope, element, attrs, controller) {

                        chartInstance = chartsFactory.createBarChart(element, chartData);

                        controller.executeLifeSearchOnPredefinedCriteriaIfPresent(attrs.origin, attrs.destination, attrs.departureDate, attrs.returnDate);
                    }
                };
            }]);
});