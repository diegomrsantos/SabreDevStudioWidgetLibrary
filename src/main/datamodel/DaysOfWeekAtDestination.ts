define([
        'lodash'
    ],
    function (
        _
    ) {
        'use strict';

        var DAYS_IN_ONE_WEEK = 7;

        function DaysOfWeekAtDestination(daysAtDestinationArray) {
            this.days = daysAtDestinationArray;
        }

        DaysOfWeekAtDestination.prototype.hasAnyDaysAtDestinationDefined = function () {
            return _.contains(this.days, true);
        };

        DaysOfWeekAtDestination.prototype.lengthOfStaySpansOverNextWeek = function() { // for example [true, false, false, false, false, true, true]
            return _.first(this.days) && _.last(this.days);
        };

        DaysOfWeekAtDestination.prototype.departureAndReturnDaysOfWeekIndexes  = function () {
            var departureDayOfWeekIndex, returnDayOfWeekIndex;
            if (this.lengthOfStaySpansOverNextWeek(this.days)) {
                returnDayOfWeekIndex = _.indexOf(this.days, true);
                departureDayOfWeekIndex = _.indexOf(this.days, true, returnDayOfWeekIndex + 1);
            } else { // for example [false, false, false, false, true, true, false]
                departureDayOfWeekIndex = _.indexOf(this.days, true);
                returnDayOfWeekIndex = _.lastIndexOf(this.days, true);
            }
            return {
                  departureDayOfWeekIndex: departureDayOfWeekIndex
                , returnDayOfWeekIndex: returnDayOfWeekIndex
            };
        };

        DaysOfWeekAtDestination.prototype.lengthOfStay = function() {
            var indexes = this.departureAndReturnDaysOfWeekIndexes();
            if (indexes.returnDayOfWeekIndex >= indexes.departureDayOfWeekIndex) {
                return indexes.returnDayOfWeekIndex - indexes.departureDayOfWeekIndex;
            } else { // [T, T, T, F, T, T, T]
                return DAYS_IN_ONE_WEEK -  (indexes.departureDayOfWeekIndex - indexes.returnDayOfWeekIndex);
            }
        };

        return DaysOfWeekAtDestination;
    });
