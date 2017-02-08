define([
        'angular'
        , 'moment'
        , 'lodash'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/common/WebServiceSerializationUtils'
    ],
    function (
        angular
        , moment
        , _
        , SabreDevStudioWebServicesModule
        , WebServiceSerializationUtils
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('FareNabberSubscriptionRequestBuilder', ['fareNabberRegistrationPCC', function (fareNabberRegistrationPCC) {
                const dateFormat = 'YYYY-MM-DD';
                const timeFormat = 'HHmm';

                function isTimeOfDatePreferenceDefined(timeOfDayRange) {
                    return ((timeOfDayRange.start.hours() !== 0) || (timeOfDayRange.start.minutes() !== 0)) ||
                        ((timeOfDayRange.end.hours() !== 0) || (timeOfDayRange.end.minutes() !== 0))
                }

                function createTimeWindowString(timeOfDayRange) {
                    return timeOfDayRange.start.format('HHmm') + timeOfDayRange.end.subtract(1, 'minutes').format('HHmm');
                }

                function isAnyDayOfWeekDefined(daysOfWeek) {
                    return daysOfWeek && daysOfWeek.some(_.identity);
                }

                function buildRequestSkeleton(formSubscriptionData) {
                    var fareNabberRequest: any = {
                        expiryDate: moment(formSubscriptionData.subscriptionExpiryDate).format(dateFormat)
                        , maxPrice: parseFloat(formSubscriptionData.maximumAcceptablePrice)
                        , priceCurrency: formSubscriptionData.maximumAcceptablePriceCurrency
                        , pcc: fareNabberRegistrationPCC
                        , PreferredAirlines: createPreferredAirlines(formSubscriptionData)
                        , SubscriptionPassengers: [
                            {
                                passengerType: formSubscriptionData.passengerType
                                , numberOfPassengers: parseInt(formSubscriptionData.passengerCount)
                            }
                        ]
                        , SubscriptionLegs: []
                    };
                    if(formSubscriptionData.directFlightsOnly) {
                        fareNabberRequest.nonstop = formSubscriptionData.directFlightsOnly;
                    }
                    return fareNabberRequest;
                }

                function createPreferredAirlines(formSubscriptionData) {
                    return formSubscriptionData.preferredAirlines.selected;
                }

                function addLegs(fareNabberRequest, formSubscriptionData) {

                    var flexibleDates = formSubscriptionData.preferences.dates;

                    var outboundLeg:any = {};
                    outboundLeg.origin = formSubscriptionData.origin;
                    outboundLeg.destination = formSubscriptionData.destination;
                    if(flexibleDates.isFlexibleDepartureDate){
                        outboundLeg.departureDateFrom = moment(flexibleDates.flexibleDepartureDate.from).format(dateFormat);
                        outboundLeg.departureDateTo = moment(flexibleDates.flexibleDepartureDate.to).format(dateFormat);
                        outboundLeg.departureTimeFrom = moment(flexibleDates.flexibleDepartureDate.from).format(timeFormat);

                    } else {
                        outboundLeg.departureDateFrom = moment(flexibleDates.departureDate).format(dateFormat);
                        outboundLeg.departureTimeFrom = moment(flexibleDates.departureDate).format(timeFormat);
                    }
                    fareNabberRequest.SubscriptionLegs[0] = outboundLeg;

                    var inboundLeg:any = {};
                    inboundLeg.origin = formSubscriptionData.destination;
                    inboundLeg.destination = formSubscriptionData.origin;
                    if(flexibleDates.isFlexibleReturnDate){
                        inboundLeg.departureDateFrom = moment(flexibleDates.flexibleReturnDate.from).format(dateFormat);
                        inboundLeg.departureDateTo = moment(flexibleDates.flexibleReturnDate.to).format(dateFormat);
                        inboundLeg.departureTimeFrom = moment(flexibleDates.flexibleReturnDate.from).format(timeFormat);

                    } else {
                        inboundLeg.departureDateFrom = moment(flexibleDates.returnDate).format(dateFormat);
                        inboundLeg.departureTimeFrom = moment(flexibleDates.returnDate).format(timeFormat);
                    }
                    fareNabberRequest.SubscriptionLegs[1] = inboundLeg;
                }

                function addTravelTimeWindowPreferences(fareNabberRequest, preferences) {
                    var outboundLeg = fareNabberRequest.SubscriptionLegs[0];
                    var inboundLeg = fareNabberRequest.SubscriptionLegs[1];

                    if (isTimeOfDatePreferenceDefined(preferences.outboundTravelTimeRange.departure)) {
                        outboundLeg.departureTimeWindow = createTimeWindowString(preferences.outboundTravelTimeRange.departure);
                    }
                    if (isTimeOfDatePreferenceDefined(preferences.outboundTravelTimeRange.arrival)) {
                        outboundLeg.arrivalTimeWindow = createTimeWindowString(preferences.outboundTravelTimeRange.arrival);
                    }
                    if (isTimeOfDatePreferenceDefined(preferences.inboundTravelTimeRange.departure)) {
                        inboundLeg.departureTimeWindow = createTimeWindowString(preferences.inboundTravelTimeRange.departure);
                    }
                    if (isTimeOfDatePreferenceDefined(preferences.inboundTravelTimeRange.arrival)) {
                        inboundLeg.arrivalTimeWindow = createTimeWindowString(preferences.inboundTravelTimeRange.arrival);
                    }
                }

                function addDayOfTravelPreferences(fareNabberRequest, preferences) {
                    var outboundLeg = fareNabberRequest.SubscriptionLegs[0];
                    var inboundLeg = fareNabberRequest.SubscriptionLegs[1];

                    if(isAnyDayOfWeekDefined(preferences.daysOfTravelPreference.outbound)) {
                        outboundLeg.days = WebServiceSerializationUtils.createWeekDaysString(preferences.daysOfTravelPreference.outbound);
                    }
                    if(isAnyDayOfWeekDefined(preferences.daysOfTravelPreference.inbound)) {
                        inboundLeg.days = WebServiceSerializationUtils.createWeekDaysString(preferences.daysOfTravelPreference.inbound);
                    }
                }

                return {
                    build: function (formSubscriptionData) {
                        var fareNabberRequest: any = buildRequestSkeleton(formSubscriptionData);

                        addLegs(fareNabberRequest, formSubscriptionData);
                        addTravelTimeWindowPreferences(fareNabberRequest, formSubscriptionData.preferences);
                        addDayOfTravelPreferences(fareNabberRequest, formSubscriptionData.preferences);

                        return fareNabberRequest;
                    }
                };
            }])
    });