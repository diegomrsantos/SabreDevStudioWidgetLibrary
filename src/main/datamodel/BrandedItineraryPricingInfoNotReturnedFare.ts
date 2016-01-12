define([
        'datamodel/BrandedItineraryPricingInfo'
    ],
    function (
        BrandedItineraryPricingInfo
    ) {
        'use strict';
        /**
         * Special Case / Null object for BrandedItineraryPricingInfo, for the case when no fares were returned (no brands matched).
         * @constructor
         */
        function BrandedItineraryPricingInfoNotReturnedFare() {
            BrandedItineraryPricingInfo.apply(this, arguments);

            // information, on itinerary pricing info level, why this itinerary was not priced.
            this.fareStatus = undefined;
        }

        BrandedItineraryPricingInfoNotReturnedFare.prototype = Object.create(BrandedItineraryPricingInfo.prototype);
        BrandedItineraryPricingInfoNotReturnedFare.prototype.constructor = BrandedItineraryPricingInfoNotReturnedFare;

        /**
         * For discrimination between this null object and its base class BrandedItineraryPricingInfo. Always returns false.
         * @returns {boolean}
         */
        BrandedItineraryPricingInfoNotReturnedFare.prototype.fareReturned = false;

        /**
         * Returns the reason why the brand was not matched.
         * @returns {string}
         */
        BrandedItineraryPricingInfoNotReturnedFare.prototype.getTranslatedFareStatus = function() {
            switch (this.fareStatus) {
                case "A": return "Class is not available";
                case "O": return "Class is not offered";
                case "F": return "No fare found or applicable";
                case "N": return "Unknown status";
            }
        };

        return BrandedItineraryPricingInfoNotReturnedFare;
    });
