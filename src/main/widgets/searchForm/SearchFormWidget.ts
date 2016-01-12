define([
         'lodash'
        , 'moment'
        , 'angular'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'widgets/searchForm/TravelDatesFlexibilitySelectionMode'
        , 'datamodel/SearchCriteria'
        , 'datamodel/SearchCriteriaLeg'
        , 'datamodel/DaysOfWeekAtDestination'
        , 'datamodel/PlusMinusDaysTravelDatesFlexibility'
        , 'datamodel/EarliestDepartureLatestReturnTravelDatesFlexibility'
        , 'util/DOMManipulationUtils'
        , 'util/BaseServices'
    ],
    function (
          _
        , moment
        , angular
        , angular_bootstrap
        , SDSWidgets
        , TravelDatesFlexibilitySelectionMode  
        , SearchCriteria
        , SearchCriteriaLeg
        , DaysOfWeekAtDestination
        , PlusMinusDaysTravelDatesFlexibility
        , EarliestDepartureLatestReturnTravelDatesFlexibility
        , domUtils
        , BaseServicesSrc
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .constant('newSearchCriteriaEvent', 'newSearchCriteria')
            .controller('SearchFormCtrl' , [
                  '$scope'
                , 'WidgetIdGeneratorService'
                , 'SearchCriteriaBroadcastingService'
            , function (
                  $scope
                , widgetIdGenerator
                , SearchCriteriaBroadcastingService
                ) {

                $scope.widgetId = widgetIdGenerator.next();

                $scope.detailsVisibility = {};

                $scope.tripType = 'returnTrip';

                $scope.multiDestinationLegs = [{}, {}, {}];
                $scope.simpleTrip = {};

                var DEFAULT_PAX_COUNT = 1;

                $scope.generalSearchCriteria = {
                      ADTPaxCount: DEFAULT_PAX_COUNT
                };

                $scope.preferredAirlines = {
                    selected: []
                }; // cannot keep here simple scope property like just $scope.preferredAirlines, as the angular-ui-select is unable to assign to scope simple property, but only to property of the object, see http://stackoverflow.com/questions/25937098/ng-model-is-not-getting-changed-in-ui-select

                $scope.lengthsOfStay = {
                    selected: {}
                };


                function createLegs(tripType) {
                    switch (tripType) {
                        case 'oneWay': {
                            var firstLeg = new SearchCriteriaLeg({
                                origin: $scope.simpleTrip.Origin.airportCode
                                , destination: $scope.simpleTrip.Destination.airportCode
                                , departureDateTime: moment($scope.simpleTrip.DepartureDate)
                            });
                            return [firstLeg];
                        }
                        case 'returnTrip': {
                            firstLeg = new SearchCriteriaLeg({
                                origin: $scope.simpleTrip.Origin.airportCode
                                , destination: $scope.simpleTrip.Destination.airportCode
                            });
                            var secondLeg = new SearchCriteriaLeg({
                                origin: $scope.simpleTrip.Destination.airportCode
                                , destination: $scope.simpleTrip.Origin.airportCode
                            });

                            if (!($scope.flexDatesMode.isEarliestDepartureLatestReturnActive())) {
                                firstLeg.departureDateTime = moment($scope.simpleTrip.DepartureDate);
                                secondLeg.departureDateTime = moment($scope.simpleTrip.ReturnDate);
                            }
                            return [firstLeg, secondLeg];
                        }
                        case 'multiDestination': {
                            return $scope.multiDestinationLegs.map(function (leg) {
                                var departureDate = moment(leg.DepartureDate);
                                return new SearchCriteriaLeg({
                                      origin: leg.Origin.airportCode
                                    , destination: leg.Destination.airportCode
                                    , departureDateTime: departureDate
                                });
                            });
                        }
                        default: throw new Error('Trip type: ' + $scope.tripType + ' not recognized');
                    }
                }

                $scope.addNextSearchCriteriaLeg = function () {
                    $scope.multiDestinationLegs.push({});
                };

                $scope.removeLastSearchCriteriaLeg = function () {
                    $scope.multiDestinationLegs.pop();
                };

                /* jshint maxcomplexity:9 */
                $scope.createNewSearchCriteria = function () {
                    var searchCriteria = new SearchCriteria();

                    var searchCriteriaLegs = createLegs($scope.tripType);
                    searchCriteriaLegs.forEach(function (searchCriteriaLeg) {
                        searchCriteria.addLeg(searchCriteriaLeg);
                    });

                    if ($scope.flexDatesMode.activeMode === 'earliestDepartureLatestReturn.daysOfWeekAtDestination') {
                        var daysOfWeekAtDestination = new DaysOfWeekAtDestination($scope.daysOfWeekAtDestination.selected);
                        searchCriteria.earliestDepartureLatestReturnDatesFlexibility = new EarliestDepartureLatestReturnTravelDatesFlexibility({
                              earliestDepartureDateTime: moment($scope.simpleTrip.EarliestDepartureDate)
                            , latestReturnDateTime: moment($scope.simpleTrip.LatestReturnDate)
                            , minDays: daysOfWeekAtDestination.lengthOfStay()
                            , maxDays: daysOfWeekAtDestination.lengthOfStay()
                            , daysOfWeekAtDestination: daysOfWeekAtDestination
                        });
                    }

                    if ($scope.flexDatesMode.activeMode === 'earliestDepartureLatestReturn.losDays') {
                        searchCriteria.earliestDepartureLatestReturnDatesFlexibility = new EarliestDepartureLatestReturnTravelDatesFlexibility({
                              earliestDepartureDateTime: moment($scope.simpleTrip.EarliestDepartureDate)
                            , latestReturnDateTime: moment($scope.simpleTrip.LatestReturnDate)
                            , minDays: $scope.lengthsOfStay.selected.minDays
                            , maxDays: $scope.lengthsOfStay.selected.maxDays
                            , departureDaysOfWeek: $scope.departureDaysOfWeek.selected
                            , returnDaysOfWeek: $scope.returnDaysOfWeek.selected
                        });
                    }

                    if ($scope.flexDatesMode.activeMode === 'plusMinusConstantDaysFlexibility') {
                        var DEFAULT_DATE_FLEXIBILITY_REQUESTED = 3;
                        searchCriteria.dateFlexibilityDays = PlusMinusDaysTravelDatesFlexibility.prototype.buildConstantDaysFlexibility(DEFAULT_DATE_FLEXIBILITY_REQUESTED);
                    } else if ($scope.flexDatesMode.activeMode === 'plusMinusVariableDaysFlexibility') {
                        searchCriteria.dateFlexibilityDays = $scope.advancedDateFlexibility;
                    }

                    searchCriteria.addPassenger("ADT", $scope.generalSearchCriteria.ADTPaxCount);

                    if ($scope.generalSearchCriteria.DirectFlightsOnly) {
                        searchCriteria.maxStops = 0;
                    }

                    if ($scope.generalSearchCriteria.preferredCabin) {
                        searchCriteria.preferredCabin = $scope.generalSearchCriteria.preferredCabin;
                    }

                    if ($scope.preferredAirlines.selected) {
                        $scope.preferredAirlines.selected.forEach((airlineCode) => searchCriteria.addPreferredAirline(airlineCode));
                    }

                    if ($scope.optionsPerDay) {
                        searchCriteria.optionsPerDay = $scope.optionsPerDay;
                    }

                    SearchCriteriaBroadcastingService.searchCriteria = searchCriteria;
                    SearchCriteriaBroadcastingService.broadcast();
                };

                $scope.plusMinusConstantDateFlexibilityCheckboxClicked = function () {
                    if ($scope.flexDatesMode.activeMode !== 'plusMinusConstantDaysFlexibility') {
                        $scope.flexDatesMode.activeMode = 'plusMinusConstantDaysFlexibility'
                    } else { // when the checkbox is being unchecked
                        $scope.flexDatesMode.activeMode = undefined;
                    }
                };

                $scope.isVisible = function (htmlFieldName) {
                    return !_.contains($scope.fieldsToHide, htmlFieldName);
                }

                $scope.isAnyOfVisible = function () {
                    return [].slice.call(arguments).some($scope.isVisible);
                }

            }])
            .directive('searchForm', ['DateService', '$timeout', function (DateService, $timeout) {
               return {
                   templateUrl: '../widgets/view-templates/widgets/SearchFormWidget.tpl.html',
                   controller: 'SearchFormCtrl',
                   scope: {
                       selectableAirportsForThisPosOnly: '@'
                       , selectableAirportsDictionary: '@'
                   },
                   link: function (scope, element) {

                       var DEFAULT_LENGTH_OF_STAY = 14;
                       var DEFAULT_ADVANCE_PURCHASE_DAYS = 14;

                       parseFieldsToHide();

                       parseSearchOptionsDefaults();

                       parseAdvancedDateFlexibilityOptions();

                       calculateTravelDatesDefaults();

                       setUpTravelDatesOnChangeListeners();

                       scheduleDeferredElementsLoad();

                       function parseFieldsToHide() {
                           scope.fieldsToHide = element.attr('hide-fields') && element.attr('hide-fields').split(',') || [];
                       }

                       function parseSearchOptionsDefaults() {
                           scope.optionsPerDay = parseInt(element.attr('options-per-day'));

                           var checkboxesToBeSetAsChecked = element.attr('set-checkboxes-as-checked') && element.attr('set-checkboxes-as-checked').split(',') || [];
                           checkboxesToBeSetAsChecked.forEach(function (checkbox) {
                               scope.generalSearchCriteria[checkbox] = true;
                           });
                       }

                       function calculateTravelDatesDefaults() {
                           scope.earliestTravelStart = DateService.now().startOf('day').toDate();

                           scope.simpleTrip.DepartureDate = DateService.now().startOf('day').add(DEFAULT_ADVANCE_PURCHASE_DAYS, 'days').toDate();
                           scope.simpleTrip.EarliestDepartureDate = DateService.now().startOf('day').add(DEFAULT_ADVANCE_PURCHASE_DAYS, 'days').toDate();

                           scope.simpleTrip.ReturnDate = moment(scope.simpleTrip.DepartureDate).add(DEFAULT_LENGTH_OF_STAY, 'days').toDate();
                           scope.simpleTrip.LatestReturnDate = moment(scope.simpleTrip.EarliestDepartureDate).add(DEFAULT_LENGTH_OF_STAY, 'days').toDate();
                       }

                       function setUpTravelDatesOnChangeListeners() {
                           var returnDateWasEverChanged = false;
                           var latestReturnDateWasEverChanged = false;

                           scope.onDepartureDateChange = function () {
                               if (!returnDateWasEverChanged) {
                                   scope.simpleTrip.ReturnDate = moment(scope.simpleTrip.DepartureDate).add(DEFAULT_LENGTH_OF_STAY, 'days').toDate();
                               }
                           };

                           scope.onEarliestDepartureDateChange = function () {
                               if (!latestReturnDateWasEverChanged) {
                                   scope.simpleTrip.LatestReturnDate = moment(scope.simpleTrip.EarliestDepartureDate).add(DEFAULT_LENGTH_OF_STAY, 'days').toDate();
                               }
                           };

                           scope.onReturnDateChange = function () {
                               returnDateWasEverChanged = true;
                           };

                           scope.onLatestReturnDateChange = function () {
                               latestReturnDateWasEverChanged = true;
                           };
                       }

                       function parseAdvancedDateFlexibilityOptions() {
                           /*jshint maxcomplexity:7 */
                           var advancedDateFlexibilityCriteriaToShow = element.attr('show-date-flexibility-criteria') && element.attr('show-date-flexibility-criteria').split(',').map(_.trim) || [];
                           scope.flexDatesMode = new TravelDatesFlexibilitySelectionMode(advancedDateFlexibilityCriteriaToShow);

                           var preselectedFlexDatesMode = element.attr('preselect-date-flexibility-criterion');
                           if (preselectedFlexDatesMode) {
                               scope.flexDatesMode.activeMode = preselectedFlexDatesMode;
                           }

                           // prepare model structures for various date flexibility options:
                           if (scope.flexDatesMode.isSelectableBy('plusMinusVariableDaysFlexibility')) {
                               var plusMinusDaysMaxDaysArg = parseInt(element.attr('plus-minus-days-flexibility-max-days'));
                               if (_.isFinite(plusMinusDaysMaxDaysArg)) {
                                   scope.plusMinusDaysMaxDays = plusMinusDaysMaxDaysArg;
                               }

                               var DEFAULT_DATE_FLEXIBILITY_REQUESTED = 3;
                               scope.advancedDateFlexibility = new PlusMinusDaysTravelDatesFlexibility({
                                   departureMinusDays: DEFAULT_DATE_FLEXIBILITY_REQUESTED
                                   , departurePlusDays: DEFAULT_DATE_FLEXIBILITY_REQUESTED
                                   , returnMinusDays: DEFAULT_DATE_FLEXIBILITY_REQUESTED
                                   , returnPlusDays: DEFAULT_DATE_FLEXIBILITY_REQUESTED
                               });
                           }

                           if (scope.flexDatesMode.isSelectableByEarliestDepartureLatestReturn()) {

                               scope.departureDaysOfWeek = {
                                   selected: []
                               };
                               scope.returnDaysOfWeek = {
                                   selected: []
                               };

                               scope.daysOfWeekAtDestination = {
                                   selected: []
                               };
                           }
                       }

                       function scheduleDeferredElementsLoad() {
                           //performance optimization fo form load time: loading date pickers in deferred mode, saving 50ms
                           $timeout(function () {
                               scope.loadDeferredElements = true;
                           }, 1);
                       }
                   }
               };
            }]);
    });
