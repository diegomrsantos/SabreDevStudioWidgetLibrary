define([
          'lodash'
        , 'widgets/filters/AbstractFilter'
    ],
    function (
          _
        , AbstractFilter
    ) {
        'use strict';

        function BooleanFilter() {
            AbstractFilter.apply(this, arguments);
            this.isRequired = false;
        }

        BooleanFilter.prototype = Object.create(AbstractFilter.prototype);
        BooleanFilter.prototype.constructor = BooleanFilter;

        BooleanFilter.prototype.applyListenableStatistics = _.noop;

        BooleanFilter.prototype.getRequestedStatisticsType = function () {
            return 'noop';
        };

        BooleanFilter.prototype.reset = function () {
            this.isRequired = false;
        };

        BooleanFilter.prototype.rebuildFilteringFunction = function () {
            this.filteringFunction = this.filteringFunctionConstructor(this.filterablePropertyName, this.isRequired);
            return this.filteringFunction;
        };

        BooleanFilter.prototype.filteringFunctionConstructor = function (filterablePropertyName, isRequired) {
            return function (element) {
                var elementValue = _.result(element, filterablePropertyName);
                return (!isRequired || ( elementValue === isRequired));
            };
        };

        return BooleanFilter;
    });
