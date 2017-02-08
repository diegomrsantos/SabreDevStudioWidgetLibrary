/* returns patched (utility functions added), local version of lodash */
define([
        'lodash'
    ], function (
        _
    ) {
    "use strict";

    var lodash = _.runInContext();

    lodash.mixin({
        isDefined: _.negate(_.isUndefined),
        /**
         * Returns function decorated with cancel() api.
         * Once cancel() is called the base function will not execute.
         * Usable for example in callbacks when we want to prevent/disable execution of function that we passed to callback
         */
        cancellable: function (fn) {
            var decoratedFn: any = function () {
                if (decoratedFn.cancelled) {
                    return;
                }
                return fn.apply(this, arguments);
            };
            decoratedFn.cancel = function() {
                decoratedFn.cancelled = true;
            };
            return decoratedFn;
        },
        /**
         * Selects minimum from all values of object enumerable properties.
         * Returns undefined if there are no enumerable properties
         * @param object
         * @returns {number}
         */
        minOfValues: function(object) {
            var allValues = _.values(object);
            return Math.min.apply(undefined, allValues);
        },
        /**
         * This function does group by groupingProperty and for every calculates also the minimum value of the propertyToGetMinValue.
         * example input: var collection = [
         *      {from: 'LAX', to: 'NYC', numberOfStops: 1, price: 100}
         *      {from: 'LAX', to: 'NYC', numberOfStops: 1, price: 120}
         *      {from: 'LAX', to: 'NYC', numberOfStops: 0, price: 200}
         *  ]
         *
         *  call groupByAndGetCountAndMin(collection, 'numberOfStops', 'price')
         *
         *  output: [
         *      {value: 1, count: 2, min: 100}
         *      {value: 0, count: 1, min: 200}
         *  ]
         *
         *  Please note the format: array is returned, and the value of the groupingProperty is a value of the 'value' key, not the key itself (not a mapping of groupingProperty value into record of count and min).
         *  We have to use this format because otherwise (if we returned mapping of groupingProperty values into min and count) the values of groupingProperty, as being the object keys, would be coerced to String,
         *  which is not desirable for groupingProperty of type other than String.
         *
         */
        groupByAndGetCountAndMin: function(collection, groupingProperty, propertyToGetMinValue, propertyThatMustBeEqualWhenCalculatingMin) {

            function processGroupingKey(acc, groupingKey, next) {
                if (_.isUndefined(acc.keysAcc[groupingKey])) {
                    acc.keysAcc[groupingKey] = groupingKey;
                    acc.valuesAcc[groupingKey] = {min: Infinity, count: 0};
                }
                acc.valuesAcc[groupingKey].count++;
                var nextValue = _.result(next, propertyToGetMinValue);
                var nextValueOfPropertyToBeEqual = _.result(next, propertyThatMustBeEqualWhenCalculatingMin);
                if (propertyThatMustBeEqualWhenCalculatingMin
                    && acc.valuesAcc[groupingKey].mustBeEqualPropertyValue
                    && (acc.valuesAcc[groupingKey].mustBeEqualPropertyValue !== nextValueOfPropertyToBeEqual)) {
                    throw new Error('Error while calculating min value. The property to be equal "' + propertyThatMustBeEqualWhenCalculatingMin + "' while calculating minimum was different across values");
                }
                if (nextValue < acc.valuesAcc[groupingKey].min) {
                    acc.valuesAcc[groupingKey].min = nextValue;
                    acc.valuesAcc[groupingKey].mustBeEqualPropertyValue = nextValueOfPropertyToBeEqual;
                }
                return acc;
            }

            /**
             * The implementation is complex for the reasons described above in method usage comments.
             *
             * We are temporarily storing two mappings (the accumulatorsPair):
             *  1. accumulatorsPair.keysAcc is the mapping of groupingProperty value (object key, as String), into the value itself
             *  2. accumulatorsPair.valuesAcc is the mapping of groupingProperty value (object key, as String), into minimum value and count
             *
             *  Then both maps are merged into one array (matching is done by the both maps keys)
             *
             *  WARN: works for groupingProperty of String and number type. if groupingProperty is any other object type, then in the first method it will be coerced to string (we have to use its value as object key). So in such case make sure groupingProperty type has discriminating toString method.
             *
             *  Supports also groupingProperty accessor returning also lists (not only scalars).
             */

            var accumulatorsPair = collection.reduce(function (acc, next) {
                var groupingKey = _.result(next, groupingProperty);
                if (_.isArray(groupingKey)) { // support for groupingProperty accessor returning list
                    return groupingKey.reduce(function (localAcc, localGroupingKey) {
                        return processGroupingKey(localAcc, localGroupingKey, next);
                    }, acc);
                } else {
                    return processGroupingKey(acc, groupingKey, next);
                }
            }, {keysAcc: {}, valuesAcc: {}});

            var merged = _.map(accumulatorsPair.keysAcc, function (key) {
                return {
                      value: accumulatorsPair.keysAcc[key]
                    , count: accumulatorsPair.valuesAcc[key].count
                    , min: accumulatorsPair.valuesAcc[key].min
                    , mustBeEqualPropertyValue: accumulatorsPair.valuesAcc[key].mustBeEqualPropertyValue
                };
            });

            return merged;
        },

        median: function median(values) {

            values.sort( function(a,b) {return a - b;} );

            var half = Math.floor(values.length/2);

            if(values.length % 2) {
                return values[half];
            } else {
                return (values[half-1] + values[half]) / 2.0;
            }
        },

        /**
         * Adds all elements of source array to target array.
         * Both arguments must be arrays.
         * Modifies target array.
         * Returns modified target array
         */
        pushAll: function(target, source) {
            target.push.apply(target, source);
            return target;
        },
        /**
         * Adds all elements of source array to target array if the element does not already exist in the target array.
         * Both arguments must be arrays.
         * Modifies target array.
         * Returns modified target array
         */
        pushIfNotContains: function (target, source) {
            if (!_.contains(target, source)) {
                target.push(source);
            }
            return target;
        },
        /**
         * For multi-level maps, returns all leaf nodes (all bottom-most values of all mappings).
         * The second argument maxTraverseDepth is optional.
         * Assumptions:
         * - only multi-level maps of equal (tree) height at all nodes are supported
         * - if maxTraverseDepth is provided then the top-down traversing of the tree ends after maxTraverseDepth traversals.
         * - if maxTraverseDepth is not provided then _.isObject applied to only first element of the mapping on given level is used to recognize if it is the leaf node.
         *   So without maxTraverseDepth it will not work for objects intended as leafs (will try to iterate object values).
         * - by JS specification the iteration order of Object.values() methods and alike is not guaranteed
         */
        leafValues: function leafValues(multiLevelMap, maxTraverseDepth) {
            var nextLevelMappings = _.values(multiLevelMap);
            if (!_.isUndefined(maxTraverseDepth)) {
                maxTraverseDepth--;
            }
            if (!_.isObject(nextLevelMappings[0]) || (maxTraverseDepth === 0)) {
                return nextLevelMappings;
            }
            return _.flatten(nextLevelMappings.map(function (item) {
                return leafValues(item, maxTraverseDepth);
            }));
        },

        dateDiffDays: function (date1, date2) {
            var timeDiff = Math.abs(date2.getTime() - date1.getTime());
            return Math.ceil(timeDiff / (1000 * 3600 * 24));
        }
    });

    return lodash;
});