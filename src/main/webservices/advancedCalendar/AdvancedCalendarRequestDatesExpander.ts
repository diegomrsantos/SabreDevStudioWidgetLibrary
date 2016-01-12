define([
        'moment'
    ],
    function (
        moment
    ) {
        'use strict';

        /*
         this is the business logic what to present to customer upon their search criteria (what date ranges to present in particular).
         */
        function AdvancedCalendarRequestDatesExpander() {
            this.today = moment().startOf('day');
            this.lastTravelDateAvailableInWebService = this.today.clone().add(this.MAX_ADVANCE_PURCHASE_DAYS_FROM_NOW, 'days');
        }

        AdvancedCalendarRequestDatesExpander.prototype.MAX_ADVANCE_PURCHASE_DAYS_FROM_NOW = 192;

        AdvancedCalendarRequestDatesExpander.prototype.expandDepartureDaysRange = function (departureDaysRange) {
            return {
                  FromDate: this.today
                , ToDate: this.lastTravelDateAvailableInWebService
            };
        };

        AdvancedCalendarRequestDatesExpander.prototype.expandReturnDaysRange = function (returnDaysRange) {
            return {
                  FromDate: this.today
                , ToDate: this.lastTravelDateAvailableInWebService
            };
        };

        return AdvancedCalendarRequestDatesExpander;
    });
