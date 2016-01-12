define([
          'lodash'
        , 'moment'
        , 'widgets/filters/RangeFilter'
    ],
    function (
          _
        , moment
        , RangeFilter
    ) {
        'use strict';

        function RangeMonetaryAmountFilter() {
            RangeFilter.apply(this, arguments);
        }

        RangeMonetaryAmountFilter.prototype = Object.create(RangeFilter.prototype);
        RangeMonetaryAmountFilter.prototype.constructor = RangeMonetaryAmountFilter;

        RangeMonetaryAmountFilter.prototype.getRequestedStatisticsType = function () {
            return 'rangeMonetaryAmount';
        };

        RangeMonetaryAmountFilter.prototype.applyListenableStatistics = function (statistics) {
            this.minConstraint = _.assign({}, statistics.min);
            this.maxConstraint = _.assign({}, statistics.max);
            this.min = _.assign({}, statistics.min);
            this.max = _.assign({}, statistics.max);
        };

        RangeMonetaryAmountFilter.prototype.reset = function () {
            this.min = _.assign({}, this.minConstraint);
            this.max = _.assign({}, this.maxConstraint);
        };

        RangeMonetaryAmountFilter.prototype.filteringFunctionConstructor = function (filterablePropertyName, min, max) {
            return function (element) {
                var elementValue = _.result(element, filterablePropertyName);
                return ( ((_.isUndefined(min.amount)) || (elementValue.amount >= min.amount))
                        && ((_.isUndefined(max.amount)) || (elementValue.amount <= max.amount)) );
            };
        };

        return RangeMonetaryAmountFilter;
    });
