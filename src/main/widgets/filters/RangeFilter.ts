define([
          'moment'
        , 'lodash'
        , 'widgets/filters/AbstractFilter'
    ],
    function (
          moment
        , _
        , AbstractFilter
    ) {
        'use strict';

        function RangeFilter() {
            AbstractFilter.apply(this, arguments);
        }

        RangeFilter.prototype = Object.create(AbstractFilter.prototype);
        RangeFilter.prototype.constructor = RangeFilter;

        RangeFilter.prototype.applyListenableStatistics = function (statistics) {
            this.minConstraint = statistics.min;
            this.maxConstraint = statistics.max;
            this.min = statistics.min;
            this.max = statistics.max;
        };

        RangeFilter.prototype.getRequestedStatisticsType = function () {
            return 'range';
        };

        RangeFilter.prototype.reset = function () {
            // WARN: beware such assignments will work correct only for primitives. Cannot assign this way references (objects
            this.min = this.minConstraint;
            this.max = this.maxConstraint;
        };

        RangeFilter.prototype.rebuildFilteringFunction = function () {
            this.filteringFunction = this.filteringFunctionConstructor(this.filterablePropertyName, this.min, this.max);
            return this.filteringFunction;
        };

        RangeFilter.prototype.filteringFunctionConstructor = function (filterablePropertyName, min, max) {
            return function (element) {
                var elementValue = _.result(element, filterablePropertyName);
                return ( ((_.isUndefined(min)) || (elementValue >= min)) && ((_.isUndefined(max)) || (elementValue <= max)) );
            };
        };

        return RangeFilter;
    });
