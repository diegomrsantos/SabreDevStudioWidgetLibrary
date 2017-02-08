define([
        'lodash'
    ], function (
        _
    ) {
    "use strict";

    return function TiersPriceClassifier() {

        var uniquePrices;

        this.train = function (prices) {
            uniquePrices = _.sortBy(prices);
        };

        /**
         * classifies into N (tiersCount) same cardinality tiers.
         * Tiers numbers start from 1 and go thru N inclusive.
         */
        this.classifyIntoTier = function (price, tiersCount) {
            var priceIdx = _.indexOf(uniquePrices, price);
            if (priceIdx === -1) {
                throw new Error('trying to classify unknown value ' + price);
            }
            var tierLength = Math.round(_.size(uniquePrices) / tiersCount);
            var tierCalculated = Math.floor(priceIdx / tierLength) + 1;
            return Math.min(tierCalculated, tiersCount); // for last array index it may go 1 over last tier
        };
    };
});