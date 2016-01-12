define([

    ],
    function (

    ) {
        'use strict';

        function EarliestDepartureLatestReturnTravelDatesFlexibility(flexibilityConfig) {

            this.earliestDepartureLatestReturnDates = {
                  earliestDepartureDateTime: flexibilityConfig.earliestDepartureDateTime
                , latestReturnDateTime: flexibilityConfig.latestReturnDateTime
            };
            this.minMaxLengthOfStay = {
                  minDays: flexibilityConfig.minDays
                , maxDays: flexibilityConfig.maxDays
            };

            this.departureDaysOfWeek = flexibilityConfig.departureDaysOfWeek;
            this.returnDaysOfWeek = flexibilityConfig.returnDaysOfWeek;
            this.daysOfWeekAtDestination = flexibilityConfig.daysOfWeekAtDestination;
        }

        EarliestDepartureLatestReturnTravelDatesFlexibility.prototype.getEarliestDepartureDateTime = function () {
            return this.earliestDepartureLatestReturnDates.earliestDepartureDateTime;
        };

        EarliestDepartureLatestReturnTravelDatesFlexibility.prototype.getLatestReturnDateTime = function () {
            return this.earliestDepartureLatestReturnDates.latestReturnDateTime;
        };

        return EarliestDepartureLatestReturnTravelDatesFlexibility;
    });
