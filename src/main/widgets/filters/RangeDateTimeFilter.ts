define([
          'moment'
        , 'lodash'
        , 'widgets/filters/RangeFilter'
    ],
    function (
          moment
        , _
        , RangeFilter
    ) {
        'use strict';

        function RangeDateTimeFilter() {
            RangeFilter.apply(this, arguments);
        }

        RangeDateTimeFilter.prototype = Object.create(RangeFilter.prototype);
        RangeDateTimeFilter.prototype.constructor = RangeDateTimeFilter;

        RangeDateTimeFilter.prototype.applyListenableStatistics = function (statistics) {
            /**
             * statistics are coming as Moment objects, as the properties we filter on are Moment objects.
             * Before we send them to any range filter visualization (for example slider), we have to convert them to numbers (slider cannot operate on Moment dates).
             * It is done by converting to milliseconds since start of epoch.
             * This is also convenient for any later operations on these values, like formatting to display using momentDateFormat directive.
             * If we stored in any other unit, like seconds since start of epoch, we would have to first convert to moment (before applying momentDateFormat), so effectively have two filters chained to be passed to filter directive of range-slider (and again need to create own filter factory which would accept two or more filters (and its arguments and so on)
             */
            var unixMilliSecondsMin = statistics.min.unix() * 1000; // in milliseconds since start of epoch
            var unixMilliSecondsMax = statistics.max.unix() * 1000; // in milliseconds since start of epoch

            if (_.isUndefined(this.minConstraint) && _.isUndefined(this.maxConstraint)) {
                this.minConstraint = unixMilliSecondsMin;
                this.maxConstraint = unixMilliSecondsMax;
            }
            this.min = unixMilliSecondsMin;
            this.max = unixMilliSecondsMax;
        };

        RangeDateTimeFilter.prototype.rebuildFilteringFunction = function () {
            this.filteringFunction = this.filteringFunctionConstructor(this.filterablePropertyName, moment(this.min), moment(this.max));
            return this.filteringFunction;
        };

        RangeDateTimeFilter.prototype.filteringFunctionConstructor = function (filterablePropertyName, min, max) {
            return function (element) {
                var elementValue = _.result(element, filterablePropertyName);
                return elementValue.isBetween(min, max) || elementValue.isSame(min) || elementValue.isSame(max);
            };
        };

        return RangeDateTimeFilter;
    });
