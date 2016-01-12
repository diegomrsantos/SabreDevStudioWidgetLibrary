define([
          'lodash'
        , 'widgets/filters/DiscreteValuesFilter'
    ],
    function (
          _
        , DiscreteValuesFilter
    ) {
        'use strict';

        function DiscreteValuesListFilter() {
            DiscreteValuesFilter.apply(this, arguments);
        }

        DiscreteValuesListFilter.prototype = Object.create(DiscreteValuesFilter.prototype);
        DiscreteValuesListFilter.prototype.constructor = DiscreteValuesListFilter;

        DiscreteValuesListFilter.prototype.filteringFunctionConstructor = function (filterablePropertyName, permittedPropertyValues) {
            return function (element) {
                var elementValuesList = _.result(element, filterablePropertyName);
                return elementValuesList.every(function (elementValue) {
                    return _.contains(permittedPropertyValues, elementValue);
                });
            };
        };

        return DiscreteValuesListFilter;
    });
