define([
      'moment'
    , 'moment_range'
], function (
      moment
    , moment_range
) {
    /**
     * Extending moment library with additional moment range functions.
     */
    'use strict';

    /*
     generates bounds for adjacent months by adding months around the central month.
     It starts adding on the right of the central month, adds one month, then adds another to the left of central month, and then loops again
     Returns leftmost month and rightmost month
     */
    moment.generateAdjacentMonths = function(centralMonth, monthsToAdd) {
        var numberToAddPerSide = Math.floor(monthsToAdd / 2);
        var numberToAddToTheRight = monthsToAdd % 2;
        var startMonth = centralMonth.clone().subtract(numberToAddPerSide, 'month');
        var endMonth = centralMonth.clone().add(numberToAddPerSide + numberToAddToTheRight, 'month');
        return moment.range(startMonth, endMonth);
    };

    moment.adjustToMinMaxDates = function(requestedRange, allowedRange) {
        if (fullyWithin(requestedRange, allowedRange)) {
            return requestedRange;
        }
        // 2. if length of requested range is not greater than the length of allowed range then shift requested range into the allowed range:
        if (requestedRange <= allowedRange) { // this compares range lengths in millis, documentation: https://github.com/gf3/moment-range
            return shiftIntoAllowedRange(requestedRange, allowedRange);
        }
        //3. otherwise, we have to shift into allowed range and then trim what stands out
        return shiftIntoAllowedRangeAndTrimOutstanding(requestedRange, allowedRange);
    };

    // check if months to render validate min and max dates, if not then shift and trim.
    // modifies requestedRange and returns it.

    function fullyWithin(requestedRange, allowedRange) {
        return requestedRange.start.within(allowedRange) && requestedRange.end.within(allowedRange);
    }
    function shiftIntoAllowedRange(requestedRange, allowedRange) {
        var difference;
        if (requestedRange.start.isBefore(allowedRange.start)) {
            difference = allowedRange.start.diff(requestedRange.start, 'months');
            requestedRange.start.add(difference, 'months');
            requestedRange.end.add(difference, 'months');
            return requestedRange;
        }
        if (requestedRange.end.isAfter(allowedRange.end)) {
            difference = requestedRange.end.diff(allowedRange.end, 'months');
            requestedRange.start.subtract(difference, 'months');
            requestedRange.end.subtract(difference, 'months');
            return requestedRange;
        }
        return requestedRange;
    }

    function shiftIntoAllowedRangeAndTrimOutstanding(requestedRange, allowedRange) {
        // Calculate the difference, in months, between min date and first requested date.
        // If first requested date is less than min date than this number will be positive - we will then shift to right by this number of months
        var difference = allowedRange.start.diff(requestedRange.start, 'months');
        if (difference > 0) {
            requestedRange.start.add(difference, 'months');
            requestedRange.end.add(difference, 'months');
        }
        // reset end date to max allowed end date:
        if (requestedRange.end.isAfter(allowedRange.end)) {
            requestedRange.end = allowedRange.end.clone();
        }
        return requestedRange;
    }

    return moment;
});
