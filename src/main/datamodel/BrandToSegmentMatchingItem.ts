define([],
    function () {
        'use strict';

        /**
         * @global
         * @classdesc
         * Internal class storing all flights matched to given brand.
         * Brand is identified only by brand name.
         * @class BrandToSegmentMatchingItem
         * @constructor
         * @param brandName: the brand name for which we are creating the matchings
         */
        function BrandToSegmentMatchingItem(brandName) {
            this.brandName = brandName;
            this.matchedSegments = [];
        }

        /**
         * Used by parser of branded response. Assigns segment to this brand.
         * @param legIndex
         * @param segmentIndex
         */
        BrandToSegmentMatchingItem.prototype.addMatchedSegment = function (legIndex, segmentIndex) {
            this.matchedSegments.push({
                legIndex: legIndex
                , segmentIndex: segmentIndex
            });
        };

        /**
         * Returns true if this brand matching exists for given leg and flight indexes
         * @param legIndex
         * @param segmentIndex
         * @returns {boolean}
         */
        BrandToSegmentMatchingItem.prototype.hasMatchingForFlight = function(legIndex, segmentIndex) {
            return this.matchedSegments.some(function (matchedSegment) {
                return ((matchedSegment.legIndex === legIndex) && (matchedSegment.segmentIndex === segmentIndex));
            });
        };

        /**
         * If matching for given leg and flight indexes exists, returns the brand name
         * @param legIndex
         * @param segmentIndex
         * @returns {*}
         */
        BrandToSegmentMatchingItem.prototype.getBrandMatchedForFlight = function (legIndex, segmentIndex) {
            if (this.hasMatchingForFlight(legIndex, segmentIndex)) {
                return this.brandName;
            }
        };

        return BrandToSegmentMatchingItem;
    });
