define([
        'lodash'
    ], function (
        _
    ) {
    "use strict";

    return function OrderInSequencePriceClassifier() {

        var uniquePrices;

        this.train = function (prices) {
            uniquePrices = _.sortBy(_.uniq(prices)); // sort so that binary search while classifying is possible
        };

        this.classifyIntoTier = function (price) {
            return _.indexOf(uniquePrices, price, true) + 1;
        };
    };
});