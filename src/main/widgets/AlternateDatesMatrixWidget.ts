define([
          'moment'
        , 'angular'
        , 'lodash'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'datamodel/SearchCriteria'
        , 'webservices/common/searchStrategyFactories/AlternateDatesSearchStrategyFactory'
    ],
    function (
          moment
        , angular
        , _
        , angular_bootstrap
        , SDSWidgets
        , SearchCriteria
        , AlternateDatesSearchStrategyFactorySrc
    ) {
        'use strict';


        return angular.module('sdsWidgets')
            .controller('AlternateDatesMatrixCtrl', [
                     '$scope'
                    , 'AlternateDatesSearchStrategyFactory'
                    , 'newSearchCriteriaEvent'
                    , 'SearchCriteriaBroadcastingService'
                , function (
                      $scope
                    , AlternateDatesSearchStrategyFactory
                    , newSearchCriteriaEvent
                    , SearchCriteriaBroadcastingService
                ) {
                    var searchService = AlternateDatesSearchStrategyFactory.createSearchStrategy($scope.activeSearchWebService);

                    var requestedDates: any = {};

                    $scope.executeLifeSearchOnPredefinedCriteriaIfPresent = function (origin, destination, departureDateString, returnDateString, altDatesPlusMinus) {
                        if (origin && destination && departureDateString && returnDateString) {
                            var searchCriteria = SearchCriteria.prototype.buildRoundTripTravelSearchCriteriaWithDateFlexibility(origin, destination, departureDateString, returnDateString, altDatesPlusMinus);
                            $scope.processSearchCriteria(searchCriteria);
                        }
                    };

                    $scope.$on(newSearchCriteriaEvent, function () {
                        var newSearchCriteria = SearchCriteriaBroadcastingService.searchCriteria;
                        $scope.processSearchCriteria(newSearchCriteria);
                    });

                    $scope.processSearchCriteria = function (searchCriteria) {
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
                          activeSearch: '@'
                        , activeSearchWebService: '@'
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
                    }
                };
            });
    });
