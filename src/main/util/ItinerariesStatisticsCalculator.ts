define([
        'util/LodashExtensions'
    ],
    function (
          _
    ) {
        'use strict';

        function ItinerariesListStatisticsCalculator(itineraries) {
            this.itineraries = itineraries;
        }

        /**
         * For every element of the argument statisticsSpecifications list, returns its statistics
         * @param statisticsSpecifications
         * @returns {*}
         */
        ItinerariesListStatisticsCalculator.prototype.getCurrentValuesBounds = function (statisticsSpecifications) {
            var that = this;
            return statisticsSpecifications.map(function (statisticsSpecification) {
                return {
                    filterablePropertyName: statisticsSpecification.property,
                    statistics: that.getStatistics(statisticsSpecification)
                };
            });
        };

        /**
         * Convenience factory returning instance of given statistic type (based on type property from statisticsSpecification passed as argument)
         * @param statisticsSpecification
         * @returns {*}
         */
        ItinerariesListStatisticsCalculator.prototype.getStatistics = function (statisticsSpecification) {
            var filterablePropertyName = statisticsSpecification.property;
            switch (statisticsSpecification.type) {
                case 'range': {
                    return this.getRangeStatistics(filterablePropertyName);
                }
                case 'rangeMonetaryAmount': {
                    return this.getMonetaryAmountRangeStatistics(filterablePropertyName);
                }
                case 'discrete': {
                    return  this.getDiscreteValuesStatistics(filterablePropertyName);
                }
                case 'noop': {
                    return undefined;
                }
                default:
                    throw new Error('Illegal specification of bounds requested: ' + statisticsSpecification.type);
            }
        };

        /**
         * Retrieves property with propertyName from all itineraries, and then from those property instances selects minimum value.
         * If the second argument propertyFieldToCompareOn is passed then minimum value is computed based on that property.
         *
         * For example getMinValue('totalFareAmountWithCurrency', 'amount') will retrieve totalFareAmountWithCurrency objects from all itineraries
         * and then it will return the one totalFareAmountWithCurrency that has the lowest value of the 'amount' property.
         *
         * See lodash _.min
         *
         * @param propertyName
         * @param propertyFieldToCompareOn
         * @returns {*}
         */
        ItinerariesListStatisticsCalculator.prototype.getMinValue = function (propertyName, propertyFieldToCompareOn) {
            return _.chain(this.itineraries)
                .map(_.ary(_.partialRight(_.result, propertyName), 1))
                .min(propertyFieldToCompareOn).value();
        };

        /**
         * See getMinValue
         */
        ItinerariesListStatisticsCalculator.prototype.getMaxValue = function (propertyName, propertyFieldToCompareOn) {
            return _.chain(this.itineraries)
                .map(_.ary(_.partialRight(_.result, propertyName), 1))
                .max(propertyFieldToCompareOn).value();
        };

        /**
         * For passed propertyName returns biggest (maximum) and smallest (minimum) property value;
         * @param propertyName
         * @returns {{min: *, max: *}}
         */
        ItinerariesListStatisticsCalculator.prototype.getRangeStatistics = function (propertyName) {
            return {
                min: this.getMinValue(propertyName),
                max: this.getMaxValue(propertyName)
            };
        };

        /**
         * Convenience method for extracting range statistics for monetary amounts.
         * @param propertyName
         * @returns {{min: *, max: *}}
         */
        ItinerariesListStatisticsCalculator.prototype.getMonetaryAmountRangeStatistics = function (propertyName) {
            return {
                min: this.getMinValue(propertyName, 'amount'),
                max: this.getMaxValue(propertyName, 'amount')
            };
        };

        /**
         * Does the operation same as SQL:
         * SELECT propertyName, MIN(totalFareAmount), COUNT(*)
         * FROM permittedItineraries
         * GROUP BY propertyName.
         * So, for the given property (like for example itinerary number of stops)
         * returns the list of all existing property values with the minimum total fare amount for given property value and
         * count of items with given property value.
         *
         * This function makes sense for discrete properties (number of stops, operating airlines, connection airports).
         * Without some ranging function does not make sense for continuous values (like flight time).
         *
         * For example getDiscreteValuesStatistics('getNumberOfStops') returns:
         * [
         {
            "value" : 0,
            "count" : 9,
            "minPrice" : 138.99,
            "currency" : "EUR"
         },
         {
            "value" : 1,
            "count" : 41,
            "minPrice" : 169.38,
            "currency" : "EUR"
         }
         ]
         *
         */
        ItinerariesListStatisticsCalculator.prototype.getDiscreteValuesStatistics = function (propertyName) {
            var selectableValues =  _.chain(this.itineraries)
                .groupByAndGetCountAndMin(propertyName, 'totalFareAmount', 'totalFareCurrency').map(function (groupingItem) {
                    return {
                        value: groupingItem.value
                        , count: groupingItem.count
                        , minPrice: groupingItem.min
                        , currency: groupingItem.mustBeEqualPropertyValue
                    };
                })
                .sortBy('value')
                .value();
            return {selectableValues: selectableValues};
        };

        return ItinerariesListStatisticsCalculator;
    });
