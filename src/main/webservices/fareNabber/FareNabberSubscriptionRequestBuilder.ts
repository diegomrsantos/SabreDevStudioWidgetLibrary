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
                        , SubscriptionLegs: undefined
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
                    fareNabberRequest.SubscriptionLegs = [
                        {
                            origin: formSubscriptionData.origin
                            , destination: formSubscriptionData.destination
                            , departureDateFrom: moment(formSubscriptionData.departureDate).format(dateFormat)
                            , departureTimeFrom: moment(formSubscriptionData.departureDate).format(timeFormat)
                        },
                        {
                            origin: formSubscriptionData.destination
                            , destination: formSubscriptionData.origin
                            , departureDateFrom: moment(formSubscriptionData.returnDate).format(dateFormat)
                            , departureTimeFrom: moment(formSubscriptionData.returnDate).format(timeFormat)
                        }
                    ]

                }

                function addTravelTimeWindowPreferences(fareNabberRequest, formSubscriptionData) {
                    var outboundLeg = fareNabberRequest.SubscriptionLegs[0];
                    var inboundLeg = fareNabberRequest.SubscriptionLegs[1];

                    if (isTimeOfDatePreferenceDefined(formSubscriptionData.outboundTravelTimeRange.departure)) {
                        outboundLeg.departureTimeWindow = createTimeWindowString(formSubscriptionData.outboundTravelTimeRange.departure);
                    }
                    if (isTimeOfDatePreferenceDefined(formSubscriptionData.outboundTravelTimeRange.arrival)) {
                        outboundLeg.arrivalTimeWindow = createTimeWindowString(formSubscriptionData.outboundTravelTimeRange.arrival);
                    }
                    if (isTimeOfDatePreferenceDefined(formSubscriptionData.inboundTravelTimeRange.departure)) {
                        inboundLeg.departureTimeWindow = createTimeWindowString(formSubscriptionData.inboundTravelTimeRange.departure);
                    }
                    if (isTimeOfDatePreferenceDefined(formSubscriptionData.inboundTravelTimeRange.arrival)) {
                        inboundLeg.arrivalTimeWindow = createTimeWindowString(formSubscriptionData.inboundTravelTimeRange.arrival);
                    }
                }

                function addDayOfTravelPreferences(fareNabberRequest, formSubscriptionData) {
                    var outboundLeg = fareNabberRequest.SubscriptionLegs[0];
                    var inboundLeg = fareNabberRequest.SubscriptionLegs[1];

                    if(isAnyDayOfWeekDefined(formSubscriptionData.daysOfTravelPreference.outbound)) {
                        outboundLeg.days = WebServiceSerializationUtils.createWeekDaysString(formSubscriptionData.daysOfTravelPreference.outbound);
                    }
                    if(isAnyDayOfWeekDefined(formSubscriptionData.daysOfTravelPreference.inbound)) {
                        inboundLeg.days = WebServiceSerializationUtils.createWeekDaysString(formSubscriptionData.daysOfTravelPreference.inbound);
                    }
                }

                return {
                    build: function (formSubscriptionData) {
                        var fareNabberRequest: any = buildRequestSkeleton(formSubscriptionData);

                        addLegs(fareNabberRequest, formSubscriptionData);
                        addTravelTimeWindowPreferences(fareNabberRequest, formSubscriptionData);
                        addDayOfTravelPreferences(fareNabberRequest, formSubscriptionData);

                        return fareNabberRequest;
                    }
                };
            }])
    });