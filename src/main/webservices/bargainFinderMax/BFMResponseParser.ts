define([
          'webservices/common/parsers/OTAResponseParser'
    ],
    function (
          OTAResponseParser
    ) {
        'use strict';

        function BFMResponseParser() {
            OTAResponseParser.apply(this, arguments);
        }

        BFMResponseParser.prototype = Object.create(OTAResponseParser.prototype);
        BFMResponseParser.prototype.constructor = BFMResponseParser;

        BFMResponseParser.prototype.parseItineraryPricingInfo = function (itineraryPricingInfoResponsePart, legsSegmentCounts) {
            var itineraryPricingInfo = OTAResponseParser.prototype.parseItineraryPricingInfo.call(this, itineraryPricingInfoResponsePart, legsSegmentCounts);

            if (itineraryPricingInfoResponsePart.PTC_FareBreakdowns.PTC_FareBreakdown.length > 1) {
                throw new Error('itineraryPricingInfoResponsePart.PTC_FareBreakdowns.PTC_FareBreakdown.length > 1 not supported. There is one entry in this array for every passenger type requested. Currently only ADT passenger type requested (one type, regardless of number of ADT passengers)');
            }
            var ptcFareBreakdown = itineraryPricingInfoResponsePart.PTC_FareBreakdowns.PTC_FareBreakdown[0];

            itineraryPricingInfo.nonRefundableIndicator = ptcFareBreakdown.Endorsements.NonRefundableIndicator;

            var obFeesResponsePart = ptcFareBreakdown.PassengerFare.OBFees;
            itineraryPricingInfo.OBFees = obFeesResponsePart && this.parseOBFees(obFeesResponsePart);

            if (ptcFareBreakdown.PassengerFare.TPA_Extensions.BaggageInformationList) {
                var baggageAllowanceForSegments = this.parseBaggageAllowance(ptcFareBreakdown.PassengerFare.TPA_Extensions.BaggageInformationList);
                itineraryPricingInfo.setBaggageAllowance(baggageAllowanceForSegments);
            }

            return itineraryPricingInfo;
        };

        /**
         * Parses baggage allowance information from web service.
         * Warn: baggage allowance information contains flight (segment) _absolute_ not relative indexes.
         * returns array of objects
         * {
         *     allowance: Allowance_from_web_service
         *   , segmentsAbsoluteIndexes" [3,4,5]
         * }
         * @param baggageInformationList
         * @returns {SegmentBaggageAllowance}
         */
        BFMResponseParser.prototype.parseBaggageAllowance = function (baggageInformationList) {
            return baggageInformationList.BaggageInformation.map(function (allowanceInfo) {
                var segmentsAllowance = allowanceInfo.Allowance;
                var segmentsAbsoluteIndexes = allowanceInfo.Segment.map(function (segment) {
                    return segment.Id;
                });
                return {
                      allowance: segmentsAllowance
                    , segmentsAbsoluteIndexes: segmentsAbsoluteIndexes
                };
            });
        };

        return BFMResponseParser;
    });
