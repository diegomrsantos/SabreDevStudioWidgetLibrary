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
        function SegmentBaggageAllowance() {
            this.legSegmentBaggageAllowance = {}; // two level mapping of leg and segment (relative) indexes into matched baggage allowance
        }

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
            return this.legSegmentBaggageAllowance[legIndex][segmentIndex];
        };

        SegmentBaggageAllowance.prototype.uniqueBaggageAllowance = function () {
            var allowanceUniqueFn = function (allowance) {
                return JSON.stringify(allowance);
            };
            var legSegmentBaggageAllowanceDictionaryDepth = 2;
            return _.uniq(__.leafValues(this.legSegmentBaggageAllowance, legSegmentBaggageAllowanceDictionaryDepth), allowanceUniqueFn);
        };

        return SegmentBaggageAllowance;
    });
