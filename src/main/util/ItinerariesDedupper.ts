define([
        'lodash'
    ],
    function (
        _
    ) {
        'use strict';

        function ItinerariesDedupper() {
        }

        /**
         * Performs deduplication of the two itinerariesLists passed as arguments.
         * Does not modify itineraries lists passed as arguments
         *
         * The deduplication key is the flight structure of itinerary: all flights of itinerary (segments: origin, destination, datetimes, flight numbers, airlines).
         * Any pricing and availability related information (booking codes, seats remaining, total fare) is not included into deduplication key.
         *
         * Algorithm:
         * For every itinerary from argument candidateItineraries DO:
         *  calculate itinerary flight structure
         *  check if any currentItineraries contains  same flight structure
         *  IF any currentItineraries itinerary contains same flight structure:
         *      THEN add current itinerary to result set or replace current itinerary in result set with candidate itinerary, based on the priority of the web service that produced it (see later).
         *      ELSE add the candidate itinerary to result list.
         * DONE;
         *
         * WARN: this algorithm has O(n^2) complexity, can be easily improved.
         *
         * When both itineraries have same flight structure than the version that was produced by a 'more life search' service will be chosen.
         * For example itineraries from BFM will be preferred over itineraries from Instaflights.
         *
         */
        ItinerariesDedupper.prototype.dedupMerge = function (currentItineraries, candidateItineraries) {
            var flightStructureToItinerariesMap = this.createFlightStructureToItinerariesMap(currentItineraries);
            var knownKeys = _.keys(flightStructureToItinerariesMap);
            var that = this;
            candidateItineraries.forEach(function (candidateItin) {
                var candidateKey = candidateItin.getFlightStructure();
                if (_.contains(knownKeys, candidateKey)) {
                    var knowItinPricingSource = flightStructureToItinerariesMap[candidateKey].getPricingSource();
                    var candidateItinPricingSource = candidateItin.getPricingSource();
                    var pricingSourceCompareResult = that.comparePricingSources(knowItinPricingSource, candidateItinPricingSource);
                    if (pricingSourceCompareResult === -1) { // candidate itin better, replace known itin with candidate itin. Otherwise (known itin better or tie), do not do anything
                        flightStructureToItinerariesMap[candidateKey] = candidateItin;
                    }
                } else {
                    flightStructureToItinerariesMap[candidateKey] = candidateItin;
                }
            });
            var deduppedItineraries = _.values(flightStructureToItinerariesMap);
            return deduppedItineraries;
        };

        /**
         * ranking function for the pricing sources. Currently prefers 'BFM' pricing source over everything else.
         * May be used as comparator for deciding which itinerary to choose while deduplicating.
         * @param first
         * @param second
         * @returns {number}
         */
        ItinerariesDedupper.prototype.comparePricingSources = function(first, second) {
            if (first.indexOf('MIP') > -1) {
                return 1;
            }
            if (second.indexOf('MIP') > -1) {
                return -1;
            }
            return 0;
        };

        ItinerariesDedupper.prototype.createFlightStructureToItinerariesMap = function (itineraries) {
            return _.indexBy(itineraries, function (itin) {
                return itin.getFlightStructure();
            });
        };

        return ItinerariesDedupper;
    });
