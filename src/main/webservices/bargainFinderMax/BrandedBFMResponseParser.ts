define([
          'lodash'
        , 'util/LodashExtensions'
        , 'datamodel/BrandedItinerary'
        , 'datamodel/BrandToSegmentMatchingItem'
        , 'datamodel/ItineraryPricingInfo'
        , 'datamodel/BrandedItineraryPricingInfo'
        , 'datamodel/BrandedItineraryPricingInfoNotReturnedFare'
        , 'webservices/bargainFinderMax/BFMResponseParser'
    ],
    function (
          _
        , __
        , BrandedItinerary
        , BrandToSegmentMatchingItem
        , ItineraryPricingInfo
        , BrandedItineraryPricingInfo
        , BrandedItineraryPricingInfoNotReturnedFare
        , BFMResponseParser
    ) {
        'use strict';

        function BrandedBFMResponseParser() {
            BFMResponseParser.apply(this, arguments);
        }

        BrandedBFMResponseParser.prototype = Object.create(BFMResponseParser.prototype);
        BrandedBFMResponseParser.prototype.constructor = BrandedBFMResponseParser;

        BrandedBFMResponseParser.prototype.parseItinerary = function (responseItin) {
            var itinerary = BFMResponseParser.prototype.parseItinerary.call(this, responseItin);
            var brandedItinerary = BrandedItinerary.prototype.createBrandedItinerary(itinerary);

            if (responseItin.TPA_Extensions.AdditionalFares) {
                var legsSegmentCounts = itinerary.getLegsSegmentCounts();
                var additionalFares = this.parseAdditionalFares(responseItin.TPA_Extensions.AdditionalFares, legsSegmentCounts);
                additionalFares.forEach(function (additionalFare) {
                    brandedItinerary.addAdditionalFare(additionalFare);
                });
            }
            return brandedItinerary;
        };

        /**
         * Additional fares may be either brands or flexible fares.
         * @param allAdditionalFaresResponseParts
         * @param legsSegmentCounts array with number of segments for every leg. For example [1,2] (one segments in first leg, two segments in second). This context object is needed for parsing.
         * @returns {*}
         */
        BrandedBFMResponseParser.prototype.parseAdditionalFares = function (allAdditionalFaresResponseParts, legsSegmentCounts) {
            var that = this;
            return allAdditionalFaresResponseParts.map(function (additionalInfoPart) {
                return that.parseItineraryPricingInfo(additionalInfoPart.AirItineraryPricingInfo, legsSegmentCounts);
            });
        };

        BrandedBFMResponseParser.prototype.parseItineraryPricingInfo = function (itineraryPricingInfoResponsePart, legsSegmentCounts) {
            // special case: FareReturned === false means that it was not possible to match fare to the itinerary. See BrandedItineraryPricingInfoNotReturnedFare
            if (itineraryPricingInfoResponsePart.FareReturned === false) {
                var itinPricingInfoNotReturnedFares = new BrandedItineraryPricingInfoNotReturnedFare(legsSegmentCounts);
                itinPricingInfoNotReturnedFares.fareStatus = itineraryPricingInfoResponsePart.FareStatus;
                var brandToSegmentMatchingPart = itineraryPricingInfoResponsePart.TPA_Extensions.Legs;
                itinPricingInfoNotReturnedFares.brandToSegmentMatchings = this.parseBrandToSegmentMatchingForNotReturnedFare(brandToSegmentMatchingPart);
                return itinPricingInfoNotReturnedFares;
            }

            var itineraryPricingInfo = BFMResponseParser.prototype.parseItineraryPricingInfo.call(this, itineraryPricingInfoResponsePart, legsSegmentCounts);
            var brandedItineraryPricingInfo = BrandedItineraryPricingInfo.prototype.createBrandedItineraryPricingInfo(itineraryPricingInfo);

            var fareComponents = itineraryPricingInfoResponsePart.PTC_FareBreakdowns.PTC_FareBreakdown[0].PassengerFare.TPA_Extensions.FareComponents;
            brandedItineraryPricingInfo.brandToSegmentMatchings = fareComponents && fareComponents.FareComponent.map(parseBrandToSegmentMatching);

            function parseBrandToSegmentMatching(fc) {
                var brandToSegmentMatching = new BrandToSegmentMatchingItem(fc.BrandName);
                fc.Segment.forEach(function (segmentMatching) {
                    // WARN: service returns leg and segment indices starting from 1, not from 0. Normalizing into 0-based.
                    brandToSegmentMatching.addMatchedSegment(segmentMatching.LegIndex - 1, segmentMatching.FlightIndex - 1);
                });
                return brandToSegmentMatching;
            }

            brandedItineraryPricingInfo.updateSummaries();
            return brandedItineraryPricingInfo;
        };

        /**
         * Parses the special case of fareReturned === false, that is brand not matched to fare.
         */
        BrandedBFMResponseParser.prototype.parseBrandToSegmentMatchingForNotReturnedFare = function (brandToSegmentMatchingPart) {
            // mind that this method implementation is different than parseBrandToSegmentMatching, because for not returned fare, the brand information is provided per every segments, not per leg.
            var matchingsOnLegLevel = _.flatten(brandToSegmentMatchingPart.Leg);
            return matchingsOnLegLevel.reduce(function (allMatchings, thisLegMatchings) {
                var legIndex = thisLegMatchings.Number - 1;// normalizing into 0-based index
                var brandToSegmentMatchingsForLeg = parseBrandToSegmentMatchingsForLeg(legIndex, thisLegMatchings);
                return __.pushAll(allMatchings, brandToSegmentMatchingsForLeg);
            }, []);

            function parseBrandToSegmentMatchingsForLeg(legIndex, thisLegMatchings) {
                return thisLegMatchings.Segment
                    .filter(function (segmentMatchingItem) {
                        return segmentMatchingItem.BrandName;
                    })
                    .map(function (segmentMatchingItem) {
                        var matchingItem = new BrandToSegmentMatchingItem(segmentMatchingItem.BrandName);
                        var segmentIndex = segmentMatchingItem.Number - 1; // normalizing into 0-based index
                        matchingItem.addMatchedSegment(legIndex, segmentIndex);
                        return matchingItem;
                    });
            }
        };

        return BrandedBFMResponseParser;
    });
