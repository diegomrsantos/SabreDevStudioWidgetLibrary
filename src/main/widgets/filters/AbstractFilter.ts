define(['lodash'],
    function (_) {
        'use strict';

        function AbstractFilter(filterId, label, filterablePropertyName) {
            this.filterId = filterId;
            this.label = label;
            this.filterablePropertyName = filterablePropertyName;
            this.filterInitialized = false;

            var initialFilteringFunction = _.constant(true); // by default our filtering function always returns true
            this.filteringFunction = initialFilteringFunction;
        }

        AbstractFilter.prototype.getFilterablePropertyName = function () {
            return this.filterablePropertyName;
        };

        AbstractFilter.prototype.isListenableStatistics = function(statistic) {
            return (this.filterablePropertyName === statistic.filterablePropertyName);
        };

        AbstractFilter.prototype.applyStatistics = function (statistics) {
            this.filterInitialized = true;
            var that = this;
            statistics.filter(that.isListenableStatistics.bind(that)).forEach(function (statistic) {
                that.applyListenableStatistics(statistic.statistics);
            });
        };

        return AbstractFilter;
    });
