define([
          'lodash'
        , 'datamodel/ItineraryPricingInfo'
    ],
    function (
          _
        , ItineraryPricingInfo
    ) {
        'use strict';

        function BrandedItineraryPricingInfo() {
            ItineraryPricingInfo.apply(this, arguments);

            this.brandToSegmentMatchings = [];
        }

        BrandedItineraryPricingInfo.prototype = Object.create(ItineraryPricingInfo.prototype);
        BrandedItineraryPricingInfo.prototype.constructor = BrandedItineraryPricingInfo;

        /**
         * Factory method creating this class objects from its base class objects
         */
        BrandedItineraryPricingInfo.prototype.createBrandedItineraryPricingInfo = function (itineraryPricingInfo) {
            itineraryPricingInfo.brandToSegmentMatchings = [];
            _.extend(itineraryPricingInfo, BrandedItineraryPricingInfo.prototype);
            return itineraryPricingInfo;
        };

        /**
         * For discrimination between this and its accompanying null object BrandedItineraryPricingInfoNotReturnedFares. Always returns false.
         * @returns {boolean}
         */
        BrandedItineraryPricingInfo.prototype.fareReturned = true;

        /**
         * For given leg and segment relative indexes returns the brand name (if exists) if the brand was assigned to given flight.
         */
        BrandedItineraryPricingInfo.prototype.getBrandMatchedToFlight = function (legIndex, segmentIndex) {
            var matchingFound = _.find(this.brandToSegmentMatchings, function (matchingItem) {
                return matchingItem.hasMatchingForFlight(legIndex, segmentIndex);
            });
            return matchingFound && matchingFound.brandName;
        };

        /**
         * Returns array of _unique_ brands matched to all itinerary flights. In particular may be one element array.
         */
        BrandedItineraryPricingInfo.prototype.getUniqueBrandsMatchedToAllFlights = function () {
            if (_.isUndefined(this.brandToSegmentMatchings)) {
                return [];
            }
            return _.uniq(this.brandToSegmentMatchings.map(function (matching) {
                return matching.brandName;
            }));
        };

        BrandedItineraryPricingInfo.prototype.updateSummaries = function () {
            ItineraryPricingInfo.prototype.updateSummaries.call(this);
            this.summaries.uniqueBrandsMatchedToAllFlights = this.getUniqueBrandsMatchedToAllFlights();
        };

        return BrandedItineraryPricingInfo;
    });
