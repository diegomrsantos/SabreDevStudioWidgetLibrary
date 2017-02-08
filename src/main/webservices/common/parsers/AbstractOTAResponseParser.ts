define([
          'lodash'
        , 'moment'
        , 'datamodel/Itinerary'
        , 'datamodel/Leg'
        , 'datamodel/Segment'
        , 'datamodel/ItineraryPricingInfo'
        , 'datamodel/MonetaryAmount'
        , 'datamodel/ItinerariesList'
        , 'datamodel/AlternateDatesOneWayPriceMatrix'
        , 'datamodel/AlternateDatesRoundTripPriceMatrix'
    ],
    function (
          _
        , moment
        , Itinerary
        , Leg
        , Segment
        , ItineraryPricingInfo
        , MonetaryAmount
        , ItinerariesList
        , AlternateDatesOneWayPriceMatrix
        , AlternateDatesRoundTripPriceMatrix
    ) {
        'use strict';

        function AbstractOTAResponseParser() {
        }

        /**
         * Returns the trip type of the first returned itinerary.
         * Used for dynamic determination what type of itineraries were returned (which may be needed to determine what domain structures to create, for example what type of alternate dates matrix).
         */
        AbstractOTAResponseParser.prototype.getFirstItineraryTripType = function(response) {
            var firstItinerary = _.first(this.getPricedItinerariesArray(response));
            if (firstItinerary.AirItinerary.DirectionInd === 'OneWay') {
                return 'OneWay';
            }
            if (firstItinerary.AirItinerary.DirectionInd === 'Return') {
                return 'RoundTrip';
            }
        };

        // alternate dates matrix class hierarchy creation logic in this client code, not to introduce Factory class to be used only by this client
        AbstractOTAResponseParser.prototype.createAlternateDatesPriceMatrixForTripType = function (tripType) {
            if (tripType === 'OneWay') {
                return new AlternateDatesOneWayPriceMatrix();
            }
            if (tripType === 'RoundTrip') {
                return new AlternateDatesRoundTripPriceMatrix();
            }
        };

        /**
         * Main parser method, in loops parses every itinerary and then returns ItinerariesList.
         */
        AbstractOTAResponseParser.prototype.parse = function(response) {
            var itins = new ItinerariesList();

            if (!this.itinerariesFound(response)) {
                return itins;
            }

            var that = this;

            this.getPricedItinerariesArray(response).forEach(function(itin, idx) {
                var parsedItinerary = that.parseItinerary(itin);
                itins.add(parsedItinerary);
            });

            return itins;
        };

        AbstractOTAResponseParser.prototype.extractAlternateDatesPriceMatrix = function (response) {
            var firstItineraryTripType = this.getFirstItineraryTripType(response);
            var altDatePriceMatrix = this.createAlternateDatesPriceMatrixForTripType(firstItineraryTripType);

            if (!this.itinerariesFound(response)) {
                return altDatePriceMatrix;
            }

            var that = this;

            this.getPricedItinerariesArray(response).forEach(function(itin) {
                var travelDatesWithLeadPrice = that.getTravelDatesWithLeadPrice(itin);
                altDatePriceMatrix.addLeadFareForDate(travelDatesWithLeadPrice);
            });

            return altDatePriceMatrix;
        };

        AbstractOTAResponseParser.prototype.parseItinerary = function (responseItin) {
            var that = this;
            var itinerary = new Itinerary();

            responseItin.AirItinerary.OriginDestinationOptions.OriginDestinationOption.forEach(function (leg) {
                itinerary.addLeg(that.parseLeg(leg));
            });
            if (responseItin.AirItineraryPricingInfo.length > 1) {
                throw new Error('parser unsupported');
            }
            var itineraryPricingInfoResponsePart = this.getItineraryPricingInfoResponsePart(responseItin);
            var legsSegmentCounts = itinerary.getLegsSegmentCounts();
            itinerary.itineraryPricingInfo = this.parseItineraryPricingInfo(itineraryPricingInfoResponsePart, legsSegmentCounts);

            itinerary.pricingSource = this.parsePricingSource(responseItin);
            itinerary.id = responseItin.SequenceNumber;
            itinerary.build();
            return itinerary;
        };

        AbstractOTAResponseParser.prototype.parseItineraryPricingInfo = function (itineraryPricingInfoResponsePart, legsSegmentCounts) {
            var itineraryPricingInfo = new ItineraryPricingInfo(legsSegmentCounts);

            this.parseCabinAndSeatsRemaining(itineraryPricingInfo, itineraryPricingInfoResponsePart.FareInfos.FareInfo);

            var itinFare = itineraryPricingInfoResponsePart.ItinTotalFare;
            itineraryPricingInfo.fareAmounts = this.parseFareAmounts(itinFare);

            return itineraryPricingInfo;
        };

        // WARN: this function updates the first - itineraryPricingInfo argument!
        AbstractOTAResponseParser.prototype.parseCabinAndSeatsRemaining = function (itineraryPricingInfo, fareInfos) {
            fareInfos.forEach(function (fareInfo, index) {
                itineraryPricingInfo.setCabin(index, fareInfo.TPA_Extensions.Cabin.Cabin);
                if (fareInfo.TPA_Extensions.Meal) {
                    itineraryPricingInfo.setMeal(index, fareInfo.TPA_Extensions.Meal.Code);
                }
                itineraryPricingInfo.setSeatsRemaining(index, fareInfo.TPA_Extensions.SeatsRemaining.Number);
            });
        };

        AbstractOTAResponseParser.prototype.parseOBFees = function (obFeesResponsePart) {
            return obFeesResponsePart.OBFee.map(function (obFee) {
                return new MonetaryAmount(obFee.Amount, obFee.CurrencyCode);
            });
        };

        AbstractOTAResponseParser.prototype.parseFareAmounts = function (itinFare) {
            var fareAmounts = {};
            fareAmounts['baseFare'] = new MonetaryAmount(itinFare.BaseFare.Amount, itinFare.BaseFare.CurrencyCode);

            if (itinFare.Taxes.Tax.length > 1) {
                throw new Error('parser unsupported');
            }

            fareAmounts['totalTax'] = new MonetaryAmount(itinFare.Taxes.Tax[0].Amount, itinFare.Taxes.Tax[0].CurrencyCode);

            var totalFareAmountFromResponse = itinFare.TotalFare.Amount;
            var totalFareAmount = _.isString(totalFareAmountFromResponse)? parseFloat(totalFareAmountFromResponse): totalFareAmountFromResponse;
            fareAmounts['totalFare'] = new MonetaryAmount(totalFareAmount, itinFare.TotalFare.CurrencyCode);

            return fareAmounts;
        };

        AbstractOTAResponseParser.prototype.getTravelDatesWithLeadPrice = function (itin) {
            var itinerary = this.parseItinerary(itin);
            var travelDatesWithLeadPrice = {
                  departureDate: itinerary.getOutboundDepartureDateTime()
                , returnDate: itinerary.getInboundDepartureDateTime()
                , price: itinerary.totalFareAmountWithCurrency.amount
                , currency: itinerary.totalFareAmountWithCurrency.currency
            };
            return travelDatesWithLeadPrice;
        };

        /**
         * Parses one leg (one flight).
         *
         * WARN: For performance purposes, the implementation below uses native Date ISO datetime strings parsing, instead of moment(datetime) or moment(datetime, moment.ISO_8601) implementation.
         * Thanks to it the render time of 100 itineraries response (flight list) decreases from 180 to 100 ms (desktop, Chrome, Intel i5).
         * WARN: native Date parsing is inconsistent in older browsers, see http://dygraphs.com/date-formats.html
         * see: http://momentjs.com/docs/#/parsing/
         * http://dygraphs.com/date-formats.html
         * https://github.com/moment/moment/issues/731
         * http://jsperf.com/moment-js-parse-iso-date/9
         *
         * @param responseLeg
         * @returns {Leg}
         */
        AbstractOTAResponseParser.prototype.parseLeg = function(responseLeg) {
            var that = this;
            var leg = new Leg();
            leg.duration = parseInt(responseLeg.ElapsedTime);
            leg.segments = responseLeg.FlightSegment.map(function (segment) {
                return new Segment({
                    departureAirport: segment.DepartureAirport.LocationCode,

                    // departureDateTime: moment(segment.DepartureDateTime, moment.ISO_8601),
                    departureDateTime: moment(new Date(segment.DepartureDateTime)),

                    arrivalAirport: segment.ArrivalAirport.LocationCode,

                    // arrivalDateTime: moment(segment.ArrivalDateTime, moment.ISO_8601),
                    arrivalDateTime: moment(new Date(segment.ArrivalDateTime)),

                    elapsedTime: segment.ElapsedTime,
                    equipment: that.parseEquipment(segment),
                    marketingFlightNumber: segment.FlightNumber,
                    marketingAirline: segment.MarketingAirline.Code,
                    operatingFlightNumber: segment.OperatingAirline.FlightNumber,
                    operatingAirline: segment.OperatingAirline.Code
                });
            });
            leg.build();
            return leg;
        };


        return AbstractOTAResponseParser;
    });
