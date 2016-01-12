define([
          'lodash'
        , 'util/LodashExtensions'
        , 'datamodel/Itinerary'
    ],
    function (
          _
        , __
        , Itinerary
    ) {
        'use strict';

        /**
         * Extension of Itinerary concept with the branding information.
         * Branded itinerary may have one or more brands.
         * @constructor
         */
        function BrandedItinerary() {
            Itinerary.apply(this, arguments);

            /**
             * Array storing information on all brands as ItineraryPricingInfo objects. There is one element for every brand.
             * @type {Array}
             */
            this.additionalFaresPricingInfos = [];
            // currently one additional fare means the same as one brand. Not unifying names yes, as this class may be used also for flex fares (will be generalized then).
        }

        BrandedItinerary.prototype = Object.create(Itinerary.prototype);
        BrandedItinerary.prototype.constructor = BrandedItinerary;

        /**
         * Factory method creating this class objects from its base class objects
         */
        BrandedItinerary.prototype.createBrandedItinerary = function (itinerary) {
            itinerary.additionalFaresPricingInfos = [];
            _.extend(itinerary, BrandedItinerary.prototype);
            return itinerary;
        };

        /**
         * Used by parsers of branded itineraries response, while building branded itineraries.
         * @param additionalFare
         */
        BrandedItinerary.prototype.addAdditionalFare = function (additionalFare) {
            this.additionalFaresPricingInfos.push(additionalFare);
        };

        /**
         * Returns true if itinerary has any brands defined.
         * Even if user requests branded responses from the Shopping system, it may return plain unbranded itineraries (some of them),
         * simply because the brands were not defined by given carrier, or given brands were not applicable to given flight, and many other reasons within airline ancillaries inventory management.
         * But such such BrandedItinerary is still an Itinerary.
         *
         * @returns {boolean}
         */
        BrandedItinerary.prototype.hasAnyBrands = function () {
            return this.additionalFaresPricingInfos.length > 0;
        };

        /**
         * Returns all brands that were matched to given flight (flight is uniquely identified by leg index and segment(flight) index.
         * @param legIndex leg index, starting from 0
         * @param segmentIndex index of flight in given leg, starting from 0
         * @returns {Array.<*>}
         */
        BrandedItinerary.prototype.getBrandsMatchedToFlight = function (legIndex, segmentIndex) {
            var mainFareBrand = this.itineraryPricingInfo.getBrandMatchedToFlight(legIndex, segmentIndex);

            var additionalFaresBrands = this.additionalFaresPricingInfos
                .filter(function (additionalFare) {
                    return additionalFare.fareReturned;
                })
                .map(function (additionalFare) {
                    return additionalFare.getBrandMatchedToFlight(legIndex, segmentIndex);
                });

            return [mainFareBrand].concat(additionalFaresBrands).filter(__.isDefined); // main fare brand may be also undefined
        };


        return BrandedItinerary;
    });
