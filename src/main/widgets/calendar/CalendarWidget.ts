define([
          'moment'
        , 'angular'
        , 'lodash'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'datamodel/SearchCriteria'
        , 'widgets/calendar/Calendar'
        , 'webservices/common/searchStrategyFactories/DaysRangeSearchStrategyFactory'
        , 'widgets/calendar/HighlightLengthOfStay'
    ],
    function (
          moment
        , angular
        , _
        , angular_bootstrap
        , SDSWidgets
        , SearchCriteria
        , Calendar
        , DaysRangeSearchStrategyFactorySrc
        , HighlightLengthOfStay
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .controller('CalendarWidgetCtrl', [
                      '$scope'
                    , 'DaysRangeSearchStrategyFactory'
                    , 'newSearchCriteriaEvent'
                    , 'SearchCriteriaBroadcastingService'
                    , 'DateSelectedBroadcastingService'
                    , 'NoResultsFoundBroadcastingService'
                , function (
                      $scope
                    , DaysRangeSearchStrategyFactory
                    , newSearchCriteriaEvent
                    , SearchCriteriaBroadcastingService
                    , DateSelectedBroadcastingService
                    , NoResultsFoundBroadcastingService
                ) {

                    var lastSearchCriteria;

                    // currentPage needed for the navigable view.
                    $scope.paginationSettings = {
                        currentPage: 1
                    };

                    var searchService = DaysRangeSearchStrategyFactory.createSearchStrategy($scope.activeSearchWebService);

                    // hash table, indexed by month start dates, with boolean values, denoting if given month is currently displayed.
                    // Needed for programmatic setting of focus (active) on the tab of the user requested month (the month of the departure travel date will have initial focus)
                    $scope.monthsDisplayStates = {};

                    $scope.executeLifeSearchOnPredefinedCriteriaIfPresent = function (origin, destination, departureDateString, returnDateString) {
                        if (origin && destination && departureDateString && returnDateString) {
                            var searchCriteria = SearchCriteria.prototype.buildRoundTripTravelSearchCriteria(origin, destination, departureDateString, returnDateString);
                            processSearchCriteria(searchCriteria);
                        }
                    };

                    $scope.$on(newSearchCriteriaEvent, function () {
                        var newSearchCriteria = SearchCriteriaBroadcastingService.searchCriteria;
                        processSearchCriteria(newSearchCriteria);
                    });

                     function processSearchCriteria(searchCriteria) {
                        // there are two calls to calendar prepareDataModel and then updateWithLeadPrices. It is necessary of we have to use Calendar domain logic to construct the months to request, so that later to know which months to request from te web service.
                        resetModel();
                        $scope.calendar.prepareDataModel(searchCriteria);

                        $scope.paginationSettings.currentPage = Math.floor(($scope.calendar.requestedMonthSeqNumber + 2) / $scope.numberOfMonthsShownAtOnce); // +2, because: pages numbering start from 1, not from 0 (this is consumed from the angular-ui pager), second we need to set initially to correct page
                        searchService.getLeadPricesForRange(searchCriteria, $scope.calendar.getDisplayedRange()).then(
                            function (leadPrices) {
                                processLeadPrices(searchCriteria, leadPrices);
                                lastSearchCriteria = searchCriteria;
                            },
                            processServiceErrorMessages
                        );
                    }

                    function processLeadPrices(newSearchCriteria, leadPrices) {
                        var maxAvailableDate = searchService.getMaxAvailableDate(newSearchCriteria);
                        $scope.calendar.setLastDayDisplayedCap(maxAvailableDate);

                        var requestedDate = newSearchCriteria.getTripDepartureDateTime();
                        $scope.monthsDisplayStates[requestedDate] = true;

                        $scope.calendar.updateWithLeadPrices(newSearchCriteria, leadPrices);
                    }

                    function processServiceErrorMessages(businessErrorMessages) {
                        resetModel();
                        NoResultsFoundBroadcastingService.broadcast();
                    }

                    function resetModel() {
                        // the main model object
                        $scope.calendar = new Calendar({
                            numberOfMonths: $scope.numberOfMonths
                        });
                    }

                    $scope.isAnyDataToDisplayAvailable = function () {
                        return $scope.calendar && $scope.calendar.hasData();
                    };

                    $scope.cellClicked = function (day) {
                        if (day.isBefore(new Date(), 'day')) { // no point to search for past dates
                            return;
                        }
                        DateSelectedBroadcastingService.newSearchCriteria = lastSearchCriteria.cloneWithDatesAdjustedToOtherDepartureDate(day);
                        DateSelectedBroadcastingService.originalDataSourceWebService = searchService;
                        DateSelectedBroadcastingService.broadcast();
                    };
                }
            ])
            .directive('calendarTabs', ['$compile', function ($compile) {
                return {
                    restrict: 'EA',
                    scope: {
                          numberOfMonths: '@tabsShown'
                        , activeSearchWebService: '@'
                        , doNotShowPrevNextMonthDays: '@'
                    },
                    templateUrl: '../widgets/view-templates/widgets/CalendarWidgetTabs.tpl.html',
                    controller: 'CalendarWidgetCtrl',
                    link: function (scope, element, attrs) {
                        scope.numberOfMonths = parseInt(scope.numberOfMonths) || 1;
                        scope.executeLifeSearchOnPredefinedCriteriaIfPresent(attrs.origin, attrs.destination, attrs.departureDate, attrs.returnDate);
                    }
                }
            }])
            .directive('calendarNavigable', ['$compile', function ($compile) {
                return {
                    restrict: 'EA',
                    scope: {
                          numberOfMonths: '@?totalNumberOfMonths'
                        , numberOfMonthsShownAtOnce: '@?'
                        , activeSearchWebService: '@'
                        , doNotShowPrevNextMonthDays: '@'
                    },
                    templateUrl: '../widgets/view-templates/widgets/CalendarWidgetNavigable.tpl.html',
                    controller: 'CalendarWidgetCtrl',
                    link: function (scope, element, attrs) {
                        scope.numberOfMonthsShownAtOnce = parseInt(scope.numberOfMonthsShownAtOnce) || 1;
                        scope.numberOfMonths = parseInt(scope.numberOfMonths) || 10;
                        scope.executeLifeSearchOnPredefinedCriteriaIfPresent(attrs.origin, attrs.destination, attrs.departureDate, attrs.returnDate);
                    }
                }
            }])
    });
