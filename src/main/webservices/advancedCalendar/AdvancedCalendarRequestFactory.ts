define([
          'moment'
        , 'webservices/common/OTARequestFactory'
        , 'webservices/common/WebServiceSerializationUtils'
    ],
    function (
          moment
        , OTARequestFactory
        , WebServiceSerializationUtils
    ) {
        'use strict';

        function AdvancedCalendarRequestFactory(requestDatesExpander, configOverrides) {
            this.requestDatesExpander = requestDatesExpander;
            OTARequestFactory.apply(this, [configOverrides]);
        }

        AdvancedCalendarRequestFactory.prototype = Object.create(OTARequestFactory.prototype);
        AdvancedCalendarRequestFactory.prototype.constructor = AdvancedCalendarRequestFactory;

        AdvancedCalendarRequestFactory.prototype.dateFormat = 'YYYY-MM-DD';

        AdvancedCalendarRequestFactory.prototype.createOriginDestinationInfos = function(searchCriteria) {
            var that = this;

            var departureDaysRangeFormatted = this.createDaysRangeFormatted(searchCriteria.getDepartureDateFrom(), searchCriteria.getDepartureDateTo(), searchCriteria.getDepartureDaysOfWeek());

            var firstOriginDestinationInfo = {
                "DepartureDates" :
                {
                    "DaysRange": [departureDaysRangeFormatted]
                },
                "DestinationLocation" :
                {
                    "LocationCode" : searchCriteria.legs[0].destination
                },

                "OriginLocation": {
                    "LocationCode": searchCriteria.legs[0].origin
                },
                "RPH": "1",
                "TPA_Extensions": that.createLegTPAExtensions(searchCriteria.preferredAirlines)
            };

            var returnDaysRangeFormatted = this.createDaysRangeFormatted(searchCriteria.getReturnDateFrom(), searchCriteria.getReturnDateTo(), searchCriteria.getReturnDaysOfWeek());

            var secondOriginDestinationInfo = {
                "DepartureDates" :
                {
                    "DaysRange": [returnDaysRangeFormatted]
                },
                "DestinationLocation" :
                {
                    "LocationCode" : searchCriteria.legs[1].destination
                },
                "OriginLocation" :
                {
                    "LocationCode" : searchCriteria.legs[1].origin
                },
                "RPH" : "2",
                "TPA_Extensions": that.createLegTPAExtensions(searchCriteria.preferredAirlines)
            };

            if (!searchCriteria.isPlusMinusDaysDateFlexibilityRequest()) {
                secondOriginDestinationInfo.DepartureDates["LengthOfStayRange"] = [{
                    "MinDays": searchCriteria.getMinLengthOfStay() || searchCriteria.getLengthOfStay(),
                    "MaxDays": searchCriteria.getMaxLengthOfStay() || searchCriteria.getLengthOfStay()
                }];
            }
            return [firstOriginDestinationInfo, secondOriginDestinationInfo];
        };

        AdvancedCalendarRequestFactory.prototype.createDaysRangeFormatted = function (travelDateFrom, travelDateTo, travelDaysOfWeek) {
            var travelDaysRange = {
                FromDate: travelDateFrom,
                ToDate: travelDateTo
            };

            if (this.requestDatesExpander) {
                travelDaysRange = this.requestDatesExpander.expandReturnDaysRange(travelDaysRange);
            }

            var travelDaysRangeFormatted = {
                FromDate: travelDaysRange.FromDate.format(this.dateFormat),
                ToDate: travelDaysRange.ToDate.format(this.dateFormat)
            };

            if (travelDaysOfWeek) {
                travelDaysRangeFormatted["WeekDays"] = WebServiceSerializationUtils.createWeekDaysString(travelDaysOfWeek);
            }

            return travelDaysRangeFormatted;
        };

        AdvancedCalendarRequestFactory.prototype.getRequestType = function (requestedItinsCount) {
            return "ADC1000";
        };

        AdvancedCalendarRequestFactory.prototype.createNumTrips = function (requestedItinsCount) {
            return {
                  "PerDateMin": 1
                , "PerDateMax": requestedItinsCount
            };
        };

        return AdvancedCalendarRequestFactory;
    });