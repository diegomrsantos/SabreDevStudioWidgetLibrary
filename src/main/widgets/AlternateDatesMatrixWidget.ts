define([
          'moment'
        , 'angular'
        , 'lodash'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'datamodel/search/SearchCriteriaFactory'
        , 'webservices/common/searchStrategyFactories/AlternateDatesSearchStrategyFactory'
        , 'widgets/WidgetGlobalCallbacks'
    ],
    function (
          moment
        , angular
        , _
        , angular_bootstrap
        , SDSWidgets
        , SearchCriteriaFactory
        , AlternateDatesSearchStrategyFactorySrc
        , WidgetGlobalCallbacks
    ) {
        'use strict';


        return angular.module('sdsWidgets')
            .controller('AlternateDatesMatrixCtrl', [
                     '$scope'
                    , 'AlternateDatesSearchStrategyFactory'
                    , 'newSearchCriteriaEvent'
                    , 'SearchCriteriaBroadcastingService'
                    , 'DateSelectedBroadcastingService'
                , function (
                      $scope
                    , AlternateDatesSearchStrategyFactory
                    , newSearchCriteriaEvent
                    , SearchCriteriaBroadcastingService
                    , DateSelectedBroadcastingService
                ) {
                    var searchService = AlternateDatesSearchStrategyFactory.createSearchStrategy($scope.activeSearchWebService);

                    var requestedDates: any = {};

                    var lastSearchCriteria;

                    $scope.executeLifeSearchOnPredefinedCriteriaIfPresent = function (origin, destination, departureDateString, returnDateString, altDatesPlusMinus) {
                        if (origin && destination && departureDateString && returnDateString) {
                            var searchCriteria = SearchCriteriaFactory.buildRoundTripTravelSearchCriteriaWithDateFlexibility(origin, destination, departureDateString, returnDateString, altDatesPlusMinus);
                            $scope.processSearchCriteria(searchCriteria);
                        }
                    };

                    $scope.$on(newSearchCriteriaEvent, function () {
                        var newSearchCriteria = SearchCriteriaBroadcastingService.searchCriteria;
                        $scope.processSearchCriteria(newSearchCriteria);
                    });

                    $scope.processSearchCriteria = function (searchCriteria) {
                        lastSearchCriteria = searchCriteria;
                        searchService.getAlternateDatesPriceMatrix(searchCriteria, _.partial(processAltDatesPriceMatrix, searchCriteria), processServiceErrorMessages);
                    };

                    function processServiceErrorMessages(businessErrorMessages) {
                        resetModel();
                    }

                    $scope.isAnyDataToDisplayAvailable = function () {
                        return $scope.altDatesPriceMatrix && $scope.altDatesPriceMatrix.hasAtLeastOnePrice();
                    };

                    $scope.isCentralRequestedDate = function (requestedDepartureDate, requestedReturnDate) {
                        return (requestedDepartureDate.isSame(requestedDates.departureDate)
                                && (_.isUndefined(requestedReturnDate) || requestedReturnDate.isSame(requestedDates.returnDate)));
                    };

                    $scope.cellClicked = function (requestedDepartureDate, requestedReturnDate) {
                        var newSearchCriteria = lastSearchCriteria.cloneWithDatesAdjustedToOtherDepartureDate(requestedDepartureDate, requestedReturnDate);
                        DateSelectedBroadcastingService.newSearchCriteria = newSearchCriteria;
                        DateSelectedBroadcastingService.originalDataSourceWebService = searchService;
                        DateSelectedBroadcastingService.broadcast();
                        $scope.cellClickedCallback({
                            searchCriteria: newSearchCriteria,
                            originalDataSourceWebService: searchService
                        });
                    };

                    function processAltDatesPriceMatrix(searchCriteria, altDatesPriceMatrix) {
                        $scope.isRoundTripTravel = searchCriteria.isRoundTripTravel();
                        $scope.isOneWayTravel = searchCriteria.isOneWayTravel();

                        $scope.requestedDepartureDates = searchCriteria.getRequestedDepartureDates();
                        if (searchCriteria.isRoundTripTravel()) {
                            $scope.requestedReturnDates = searchCriteria.getRequestedReturnDates();
                        }

                        requestedDates.departureDate = searchCriteria.getTripDepartureDateTime();
                        if (searchCriteria.isRoundTripTravel()) {
                            requestedDates.returnDate = searchCriteria.getTripReturnDateTime();
                        }

                        $scope.altDatesPriceMatrix = altDatesPriceMatrix;
                        $scope.departureAirport = searchCriteria.getFirstLeg().origin;
                        $scope.arrivalAirport = searchCriteria.getFirstLeg().destination;
                    }

                    function resetModel() {
                        $scope.altDatesPriceMatrix = undefined;
                        $scope.departureAirport = undefined;
                        $scope.arrivalAirport = undefined;
                    }

                }
            ])
            .directive('alternateDatesMatrix', function () {
                return {
                    restrict: 'EA',
                    scope: {
                        activeSearch: '@',
                        activeSearchWebService: '@',
                        searchCriteria: '=?',
                        cellClickedCallback: '&?'
                    },
                    templateUrl: '../widgets/view-templates/widgets/AlternateDatesMatrix.tpl.html',
                    controller: 'AlternateDatesMatrixCtrl',
                    link: function (scope, element) {
                        scope.executeLifeSearchOnPredefinedCriteriaIfPresent(
                              element.attr('origin')
                            , element.attr('destination')
                            , element.attr('departure-date')
                            , element.attr('return-date')
                            , element.attr('alt-dates-plus-minus')
                        );
                        if (scope.searchCriteria) {
                            scope.processSearchCriteria(scope.searchCriteria);
                        }
                        WidgetGlobalCallbacks.linkComplete(scope, element);
                    }
                };
            });
    });
