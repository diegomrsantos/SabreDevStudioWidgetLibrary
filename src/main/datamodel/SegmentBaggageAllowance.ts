define([
          'lodash'
        , 'util/LodashExtensions'
    ],
    function (
          _
        , __
    ) {
        'use strict';

        /**
         * Represents baggage allowance per segment (flight).
         * @constructor
         */
        function SegmentBaggageAllowance(allowanceObj) {
            this.legSegmentBaggageAllowance = allowanceObj || {}; // two level mapping of leg and segment (relative) indexes into matched baggage allowance
        }

        const legSegmentBaggageAllowanceDictionaryDepth = 2;

        SegmentBaggageAllowance.prototype.addLegSegmentsAllowance = function (legIndex, segmentIndex, allowanceInfo) {
            if (_.isUndefined(this.legSegmentBaggageAllowance[legIndex])) {
                this.legSegmentBaggageAllowance[legIndex] = {};
            }
            this.legSegmentBaggageAllowance[legIndex][segmentIndex] = allowanceInfo;
        };

        /**
         * @param legIndex
         * @param segmentIndex
         * @returns {*} Baggage allowance object for given leg segment pair.
         */
        SegmentBaggageAllowance.prototype.getSegmentAllowance = function (legIndex, segmentIndex) {
            return this.legSegmentBaggageAllowance[legIndex] && this.legSegmentBaggageAllowance[legIndex][segmentIndex];
        };

        SegmentBaggageAllowance.prototype.uniqueBaggageAllowance = function () {
            var allowanceUniqueFn = function (allowance) {
                return JSON.stringify(allowance);
            };
            return _.uniq(__.leafValues(this.legSegmentBaggageAllowance, legSegmentBaggageAllowanceDictionaryDepth), allowanceUniqueFn);
        };

        SegmentBaggageAllowance.prototype.getMinBaggageAllowance = function () {
            var allSegmentsAllowance = __.leafValues(this.legSegmentBaggageAllowance, legSegmentBaggageAllowanceDictionaryDepth);
            return _.min(allSegmentsAllowance, 'Pieces').Pieces;
        };

        SegmentBaggageAllowance.prototype.equals = function (other) {
            return _.isEqual(this.legSegmentBaggageAllowance, other.legSegmentBaggageAllowance);
        };

        return SegmentBaggageAllowance;
    });
