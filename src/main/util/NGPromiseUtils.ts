define([
          'angular'
        , 'ngPromiseExtras'
    ],
    function (
          angular
        , ngPromiseExtras
    ) {
        'use strict';

        return angular.module('NGPromiseUtils', ['ngPromiseExtras'])
            .config(['$provide', function ($provide) {
                $provide.decorator('$q', ['$delegate', function ($delegate) {
                    var $q = $delegate;

                    /**
                     * @param promises
                     * @param fulfilledValuesMergeFn
                     * merging function for domain specific object. This function must:
                     * 1. be able to merge two domain object passed as its arguments.
                     * 2. return merged object.
                     * 3. work with one of parameters undefined.
                     *
                     * @param rejectionReasonsMergeFn
                     * @returns {*}
                     */
                    $q.mergePromises = function (promises, fulfilledValuesMergeFn, rejectionReasonsMergeFn) {
                        return $q(function (resolve, reject) {
                            $q.allSettled(promises)
                                .then(anySettled)
                                .then(
                                function (fulFilledValues) {
                                    var mergedFulfilledValues = fulFilledValues.reduce(fulfilledValuesMergeFn);
                                    resolve(mergedFulfilledValues);
                                },
                                function (rejectionReasons) {
                                    var mergedRejectionReasons = rejectionReasons.reduce(rejectionReasonsMergeFn);
                                    reject(mergedRejectionReasons);
                                }
                            );
                        });
                    };

                    /**
                     * Accepts ngPromiseExtras return value, currently arr only (not object).
                     * for example:
                     * [
                     *  { state: 'fulfilled', value: 1 },
                     *  { state: 'rejected', reason: 2 },
                     *  { state: 'fulfilled', value: 3 },
                     * ]
                     * If at least one promise was fulfilled, then resolves the aggregate promise with the array of all fulfilled promises values.
                     * In all promises were rejected then rejects the aggregate promise with the array of all rejected promises reasons.
                     * @param values
                     * @returns {*} aggregate promise
                     */
                    function anySettled(values) {
                        return $q(function (resolve, reject) {
                            if (atLeastOneFulfilled(values)) {
                                var fulfilledValues = getFulfilledValues(values);
                                resolve(fulfilledValues);
                            } else {
                                var rejectionReasons = getRejectionReasons(values);
                                reject(rejectionReasons);
                            }
                        });
                    }

                    function atLeastOneFulfilled(values) {
                        return values.some(function (v) {
                            return v.state === 'fulfilled';
                        });
                    }

                    function getFulfilledValues(values) {
                        return values
                            .filter(function (v) { //working only with array, not obj
                                return v.state === 'fulfilled';
                            })
                            .map(function (v) {
                                return v.value;
                            });
                    }

                    function getRejectionReasons(values) {
                        return values.filter(function (v) { //working only with array, not obj
                            return v.state === 'rejected';
                        })
                            .map(function (v) {
                                return v.reason;
                            });
                    }

                    //function moreThanOneFulfilled(values) {
                    //    for (var i = 0; i++; i < values.length) { //working only with array, not obj
                    //        if (values[i].state === 'fulfilled') {
                    //            if (otherFulfilledAlreadyFound) {
                    //                return true;
                    //            } else {
                    //                var otherFulfilledAlreadyFound = true;
                    //            }
                    //        }
                    //    }
                    //    return false;
                    //}

                    return $q;
                }]);
            }]);
});
