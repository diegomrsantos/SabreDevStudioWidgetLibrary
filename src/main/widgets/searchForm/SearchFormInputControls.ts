define([
         'lodash'
        , 'util/LodashExtensions'
        , 'moment'
        , 'angular'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'widgets/searchForm/AirportNameBestSuggestionComparator'
        , 'widgets/searchForm/flexibleDepartureReturnDates.drv'
    ],
    function (
          _
        , __
        , moment
        , angular
        , angular_bootstrap
        , SDSWidgets
        , AirportNameBestSuggestionComparator
        , FlexibleDepartureReturnDates
        , TimePickerPopup
    ) {
        'use strict';

        var MINUTES_IN_DAY = 60 * 24;
        var MINUTES_IN_HOUR = 60;

        function convertMinutesInDayToTimeOfDay(minutesInDay) {
            return {
                hours: Math.floor(minutesInDay / MINUTES_IN_HOUR)
                , minutes: minutesInDay % MINUTES_IN_HOUR
            };
        }

        return angular.module('sdsWidgets')
            .directive('flexibleDepartureReturnDates', FlexibleDepartureReturnDates)
            .directive('selectPreferredCabin', function () {
                return {
                    replace: true,
                    scope: {
                        cabinSelected: '='
                    },
                    templateUrl: '../widgets/view-templates/partials/PreferredCabinSelect.tpl.html'
                };
            })
            .directive('selectBags', function () {
                return {
                    replace: true,
                    scope: {
                        bagsRequested: '='
                    },
                    templateUrl: '../widgets/view-templates/partials/SelectBags.tpl.html',
                    link: function (scope) {
                        scope.bagsSelection = [0, 1, 2, 3];
                        scope.bagsRequested = scope.bagsSelection[1];
                    }
                };
            })
            .filter('bags', function () {
                return function (bagsAmount) {
                    switch (bagsAmount) {
                        case 0: return 'No bags';
                        case 1: return '1 bag';
                        default: return bagsAmount + ' bags';
                    }
                }
            })
            .directive('selectAirline', [
                    'AirlineLookupDataService'
                    , '$timeout'
                , function (
                    AirlineLookupDataService
                    , $timeout
                ) {

                return {
                    scope: {
                        //Expected to be an Object
                        airline: '=',
                    },
                    templateUrl: '../widgets/view-templates/partials/SelectAirline.tpl.html',
                    link: function (scope) {

                        scope.airlineInternal = {
                            selected: {}
                        };

                        AirlineLookupDataService.getAirlineAndAirlineCodesList().then(function (airlineAndAirlineCodesList) {
                            scope.allAirlines = airlineAndAirlineCodesList;
                        });

                        scope.$watch('airlineInternal.selected', function (selected) {
                            scope.airline = selected.AirlineCode;
                        });
                    }
                };
            }])
            .directive('selectMultipleAirlines', [
                'AirlineLookupDataService'
                , '$timeout'
                , function (
                    AirlineLookupDataService
                    , $timeout
                ) {

                    return {
                        scope: {
                            //Expected to be an Array
                            airlines: '=',
                        },
                        templateUrl: '../widgets/view-templates/partials/SelectMultipleAirlines.tpl.html',
                        link: function (scope) {

                            scope.airlinesInternal = {
                                selected: []
                            };

                            AirlineLookupDataService.getAirlineAndAirlineCodesList().then(function (airlineAndAirlineCodesList) {
                                scope.allAirlines = airlineAndAirlineCodesList;
                            });

                            scope.$watchCollection('airlinesInternal.selected', function (selected) {
                                scope.airlines.selected = selected.map((obj) => obj.AirlineCode);
                            });
                        }
                    };
                }])
            .directive('inputDate', [
                function () {
                    return {
                        require: 'ngModel',
                        replace: true,
                        scope: {
                              isDisabled: '@'
                            , required: '@'
                            , dateFormat: '@'
                            , minDate: '='
                            , onDateChange: '&'
                            , ngModel: '='
                        },
                        templateUrl: '../widgets/view-templates/partials/InputDate.tpl.html',
                        link: function (scope) {
                            scope.dateFormat = scope.dateFormat || 'dd-MMM-yyyy';

                            scope.openDatePicker = function($event) {
                                $event.preventDefault();
                                $event.stopPropagation();
                                scope.isDatePickerOpened = true;
                            };
                        }
                    };
                }
            ])
            .directive('selectMonths', ['$locale', function ($locale) {
                return {
                    replace: true,
                    scope: {
                        value: '='
                    },
                    transclude: true,
                    templateUrl: '../widgets/view-templates/partials/SelectMonths.tpl.html',
                    link: function (scope) {
                        scope.allMonths = _.clone($locale.DATETIME_FORMATS.MONTH);
                    }
                };
            }])
            .directive('selectDaysOfWeek', ['$locale', function ($locale) {
                return {
                    replace: true,
                    scope: {
                        daysOfWeek: '=' // here the 7 element array of booleans will be returned.

                    },
                    transclude: true,
                    templateUrl: '../widgets/view-templates/partials/SelectDaysOfWeek.tpl.html',
                    link: function (scope, element) {
                        scope.daysOfWeekSymbols = _.clone($locale.DATETIME_FORMATS.SHORTDAY); //WARN: this will print short week days according to locale. Please also mind that first day of week is also locale specific. For US it is Sunday. Next logic does not take it into account. There is no way to recognize it in NG, you could use moment.js: moment().startOf("week").day()
                        scope.daysSelected = [false, false, false, false, false, false, false];
                        scope.$watchCollection('daysSelected', function (newVal, oldVal) {
                           if (newVal !== oldVal) {
                               scope.daysOfWeek = newVal;
                           }
                        });
                    }
                };
            }])
            .directive('selectLengthsOfStay', [function () {
                return {
                    replace: true,
                    scope: {
                        lengthOfStay: '=value'
                    },
                    transclude: true,
                    templateUrl: '../widgets/view-templates/partials/SelectLengthsOfStay.tpl.html',
                    link: function (scope) {
                        scope.predefinedLengthOfStayDays = [1, 2, 7, 14];
                        scope.selectedPredefinedLengthOfStayDays = {
                            value: _.last(scope.predefinedLengthOfStayDays)
                        };

                        scope.lengthOfStay = scope.lengthOfStay || {
                              minDays: 13
                            , maxDays: 15
                        };

                        function resetMinMaxDays(los) {
                            scope.lengthOfStay.minDays = los;
                            scope.lengthOfStay.maxDays = los;
                        }

                        scope.$watch('selectedPredefinedLengthOfStayDays.value', function (predefinedLoS) {
                            if (predefinedLoS) {
                                resetMinMaxDays(predefinedLoS);
                            }
                        });

                        // if min starts exceeding max, then increase max as well
                        scope.$watch('lengthOfStay.minDays', function (minDays, oldMinDays) {
                            if (minDays === oldMinDays) {
                                return;
                            }
                            if (minDays > scope.lengthOfStay.maxDays) {
                                scope.lengthOfStay.maxDays = minDays;
                            }
                        });
                        // if max decreases below min, then decrease min as well
                        scope.$watch('lengthOfStay.maxDays', function (maxDays, oldMaxDays) {
                            if (maxDays === oldMaxDays) {
                                return;
                            }
                            if (maxDays < scope.lengthOfStay.minDays) {
                                scope.lengthOfStay.minDays = maxDays;
                            }
                        });
                    }
                };
            }])
            .directive('inputTimeRangePicker', function () { //WARN: this component to work requires full jQuery loaded (not only jqlite)
                return {
                    restrict: 'EA',
                    replace: true,
                    scope: {
                          timeMin: '='
                        , timeMax: '='
                    },
                    templateUrl: '../widgets/view-templates/partials/InputTimeRangePickerTemplate.tpl.html',
                    link: function (scope, element) {

                        scope.step = element.attr('stepMinutes') || MINUTES_IN_HOUR;

                        scope.currentSelection = {
                              min: 0
                            , max: MINUTES_IN_DAY
                        };

                        scope.minMaxConstraints = {
                              min: 0
                            , max: MINUTES_IN_DAY
                        };

                        scope.permittedValuesChanged = function () {
                            scope.timeMin = convertMinutesInDayToTimeOfDay(scope.currentSelection.min);
                            scope.timeMax = convertMinutesInDayToTimeOfDay(scope.currentSelection.max);
                        }
                    }
                };
            })
            .directive('inputOnOffToggle', function () {
                return {
                    restrict: 'EA',
                    replace: true,
                    scope: {
                        selectedValue: '='
                        , switchOnText: '@'
                        , switchOffText: '@'
                        , ngOnValue: '@'
                        , ngOffValue: '@'
                    },
                    templateUrl: '../widgets/view-templates/partials/InputOnOffToggle.tpl.html',
                    link: function (scope, element) {
                        // by default the toggle is in off state
                        scope.selectedValue = scope.ngOffValue;

                        scope.$watch('value', function(value) {
                            scope.selectedValue = (value)? scope.ngOnValue: scope.ngOffValue;
                        });
                    }
                }

            })
            .directive('plusMinusDaysSelection', function () {
                return {
                    replace: true,
                    transclude: true,
                    scope: {
                          days: '='
                        , maxDays: '@'
                    },
                    templateUrl: '../widgets/view-templates/partials/PlusMinusDaysSelection.tpl.html',
                    link: function (scope) {
                        var DEFAULT_PLUS_MINUS_DAYS_MAX_DAYS = 3;
                        var maxDays = parseInt(scope.maxDays) || DEFAULT_PLUS_MINUS_DAYS_MAX_DAYS;

                        var plusMinusDaysList:any[] = [];
                        plusMinusDaysList.push('');
                        for (var i = 1; i <= maxDays; i++) {
                            plusMinusDaysList.push(i)
                        }
                        scope.plusMinusDaysList = plusMinusDaysList;

                        scope.days = scope.days || scope.plusMinusDaysList[0];
                    }
                }

            })
            .filter('minutesInDayToTimeOfDay', function () {
                return function (minutesInDay, useAmPmFormat) {
                    var timeOfDay = convertMinutesInDayToTimeOfDay(minutesInDay);

                    function lpadWithZero(num) {
                        return (num < 10)? ('0' + num) : num;
                    }

                    if (useAmPmFormat) {
                        var pmAmSuffix = (timeOfDay.hours < 12)? 'am': 'pm';
                        return (timeOfDay.hours % 12)
                            + ':'
                            + lpadWithZero(timeOfDay.minutes)
                            + ' '
                            + pmAmSuffix;
                    } else {
                        return  lpadWithZero(timeOfDay.hours)
                            + ':'
                            + lpadWithZero(timeOfDay.minutes);
                    }
                }
            })
            .filter('airportNameWithIATACode', function () {
                return function (airportAndIATACode) {
                    if (__.isDefined(airportAndIATACode)) {
                        return airportAndIATACode.fullName + ' (' + airportAndIATACode.airportCode + ')';
                    }
                };
            })
            .filter('airportNameBestSuggestionComparator', function () {
                return function (allMatches, userCurrentInput) {
                    return allMatches.sort(new AirportNameBestSuggestionComparator(userCurrentInput)).reverse();
                };
            });
    });
