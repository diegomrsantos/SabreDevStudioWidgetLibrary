define([
          'widgets/filters/AbstractFilter'
        , 'lodash'
    ],
    function (
          AbstractFilter
        , _
    ) {
        'use strict';

        function DiscreteValuesFilter() {
            AbstractFilter.apply(this, arguments);
            this.selectableValues = [];
        }

        DiscreteValuesFilter.prototype = Object.create(AbstractFilter.prototype);
        DiscreteValuesFilter.prototype.constructor = DiscreteValuesFilter;

        DiscreteValuesFilter.prototype.applyListenableStatistics = function (statistics) {
            this.selectableValues = statistics.selectableValues.map(function (statistic) {
                return {
                      propertyValue: statistic.value
                    , minPrice: statistic.minPrice
                    , count: statistic.count
                    , currency: statistic.currency
                    , permitted: true // by default all selectable values are allowed
                };
            });
        };

        DiscreteValuesFilter.prototype.getRequestedStatisticsType = function () {
            return 'discrete';
        };

        DiscreteValuesFilter.prototype.reset = function () {
            this.selectableValues.forEach(function (value) {
                value.permitted = true;
            });
        };

        DiscreteValuesFilter.prototype.rebuildFilteringFunction = function () {
            var permittedPropertyValues = _.pluck(_.filter(this.selectableValues, 'permitted'), 'propertyValue');
            this.filteringFunction = this.filteringFunctionConstructor(this.filterablePropertyName, permittedPropertyValues);
            return this.filteringFunction;
        };

        DiscreteValuesFilter.prototype.filteringFunctionConstructor = function (filterablePropertyName, permittedPropertyValues) {
            return function (element) {
                var elementValue = _.result(element, filterablePropertyName);
                return ( permittedPropertyValues.indexOf(elementValue) !== -1);
            };
        };

        return DiscreteValuesFilter;
    });
