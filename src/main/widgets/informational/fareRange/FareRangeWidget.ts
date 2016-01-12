define([
          'moment'
        , 'moment_range'
        , 'util/LodashExtensions'
        , 'angular'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'datamodel/SearchCriteria'
        , 'widgets/informational/fareRange/HighLowMedianCurrentChartDirective'
        , 'webservices/informational/FareRangeDataService'
    ],
    function (
          moment
        , moment_range
        , _
        , angular
        , angular_bootstrap
        , SDSWidgets
        , SearchCriteria
        , HighLowMedianCurrentChartDirective
        , FareRangeDataServiceSrc
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .controller('FareRangeCtrl', [
                     '$scope'
                    , 'DateService'
                    , 'FareRangeDataService'
                    , 'FareRangeSummaryService'
                    , 'newSearchCriteriaEvent'
                    , 'SearchCriteriaBroadcastingService'
                , function (
                      $scope
                    , DateService
                    , FareRangeDataService
                    , FareRangeSummaryService
                    , newSearchCriteriaEvent
                    , searchCriteriaBroadcastingService
                ) {

                    var rangeDays = $scope.rangeDays || 15;

                    // main business model object
                    $scope.fareRangeSummary = {};

                    if ($scope.origin && $scope.destination && $scope.departureDate && $scope.returnDate) {
                        var searchCriteria = SearchCriteria.prototype.buildRoundTripTravelSearchCriteria($scope.origin, $scope.destination, $scope.departureDate, $scope.returnDate);
                        processSearchCriteria(searchCriteria);
                    }

                    function processSearchCriteria(criteria) {
                        var requestedRange = calculateRequestedDepartureDateRanges(criteria.getTripDepartureDateTime());
                        FareRangeDataService.getFareRange(criteria, requestedRange).then(
                            function (response) {
                                $scope.fareRangeSummary = FareRangeSummaryService.getSummary(response, criteria.getFirstLeg().departureDateTime, criteria.getSecondLeg().departureDateTime);
                                $scope.requestedRange = requestedRange;
                                $scope.origin = (_.isFunction(criteria.getFirstLeg))? criteria.getFirstLeg().origin: criteria.origin;
                                $scope.destination = (_.isFunction(criteria.getFirstLeg))? criteria.getFirstLeg().destination: criteria.destination;
                            },
                            function (errors) {
                                clearModel();
                            }
                        );
                    }

                    $scope.$on(newSearchCriteriaEvent, function () {
                        var newSearchCriteria = searchCriteriaBroadcastingService.searchCriteria;
                        $scope.currentLowestFare = undefined;
                        $scope.currentLowestFareCurrency = undefined;
                        processSearchCriteria(newSearchCriteria);
                    });

                    function clearModel() {
                        $scope.fareRangeSummary = {};
                    }

                    function calculateRequestedDepartureDateRanges(departureDateTime) {
                        // try to evenly distribute the range across the departure data, make provision for the maximum days from now till the requested date
                        var advancePurchase = departureDateTime.diff(DateService.now(), 'days');
                        var daysToAddBeforeRequestedDate = Math.min(advancePurchase, Math.floor(rangeDays / 2));

                        var daysToAddAfterRequestedDate = rangeDays - daysToAddBeforeRequestedDate - 1; // -1 stands for the requested day itself

                        var rangeStart = departureDateTime.clone().subtract(daysToAddBeforeRequestedDate, 'days').format('YYYY-MM-DD');
                        var rangeEnd = departureDateTime.clone().add(daysToAddAfterRequestedDate, 'days').format('YYYY-MM-DD');

                        return moment.range(rangeStart, rangeEnd);
                    }

                    $scope.isAnyDataToDisplayAvailable = function () {
                        return !_.isEmpty($scope.fareRangeSummary);
                    };

                    /**
                     * This function implements sample customer specific logic whether to show fare range to customer at all.
                     */
                    $scope.showFareRangeToCustomer = function () {
                        if (!_.has($scope.fareRangeSummary, 'fareDataForRequestedDates', 'MedianFare')) { // no data from web service to execute business rules, exit
                            return false;
                        }
                        if (_.isUndefined($scope.currentLowestFare)) { // customer did not define any lowest fare (the cutoff), then always show
                            return true;
                        }
                        if (medianFareLowerThanCurrentLowestFare()) {
                            return true;
                        }
                        return false;
                    };

                    function medianFareLowerThanCurrentLowestFare() {
                        return ($scope.currentLowestFare < $scope.fareRangeSummary.fareDataForRequestedDates.MedianFare) && ($scope.currentLowestFareCurrency ===  $scope.fareRangeSummary.fareDataForRequestedDates.CurrencyCode);
                    }

                }])
            .directive('fareRange', function () {
                return {
                    //replace: true,
                    scope: {
                          origin: '@?'
                        , destination: '@?'
                        , departureDate: '@?'
                        , returnDate: '@?'
                        , currentLowestFare: '@?'
                        , currentLowestFareCurrency: '@?'
                        , rangeDays: '@?'
                    },
                    templateUrl: '../widgets/view-templates/widgets/FareRangeWidget.tpl.html',
                    controller: 'FareRangeCtrl'
                };
            })
            .factory('FareRangeSummaryService', function () { // provides summary recommendation whether to buy now or not, based on Fare Range service (based on what the others paid). Implements specific business recommendation logic.

                function getFareDataForRequestedDates(fareDataArr, requestedDepartureDate, requestedReturnDate) {
                    return _.find(fareDataArr, function (fareData) {
                        return (moment(fareData.DepartureDateTime, moment.ISO_8601).isSame(requestedDepartureDate)
                            && moment(fareData.ReturnDateTime, moment.ISO_8601).isSame(requestedReturnDate));
                    });
                }

                return {
                    getSummary: function (fareRangeWebServiceResponse, requestedDepartureDate, requestedReturnDate) {
                        var fareDataForRequestedDates = getFareDataForRequestedDates(fareRangeWebServiceResponse.FareData, requestedDepartureDate, requestedReturnDate);
                        var medianOfAllMedianFares = _.median(_.pluck(fareRangeWebServiceResponse.FareData, 'MedianFare'));
                        var minimumOfAllMaximumFare = _.min(_.pluck(fareRangeWebServiceResponse.FareData, 'MinimumFare'));
                        var maximumOfAllMaximumFare = _.max(_.pluck(fareRangeWebServiceResponse.FareData, 'MaximumFare'));
                        var fareCurrencyCodes = _.uniq(_.pluck(fareRangeWebServiceResponse.FareData, 'CurrencyCode'));
                        if (fareCurrencyCodes.length > 1) {
                            throw new Error('Cannot calculate median and max fares for fares in different currencies');
                        }
                        return {
                              overallMedianFare: medianOfAllMedianFares
                            , overallMinimumFare: minimumOfAllMaximumFare
                            , overallMaximumFare: maximumOfAllMaximumFare
                            , currency: _.first(fareCurrencyCodes)
                            , fareDataForRequestedDates: fareDataForRequestedDates
                        };
                    }
                };
            });
    });