define([
          'lodash'
        , 'util/LodashExtensions'
        , 'moment'
        , 'angular'
    ],
    function (
          _
        , __
        , moment
        , angular
    ) {
        'use strict';

        return angular.module('commonFilters', [])
            .filter('startFrom', function() {
                return function(input, start) {
                    start = parseInt(start);
                    return input.slice(start);
                };
            })
            .filter('moment', function () {
                return function (input, format) {
                    return moment(input, format);
                };
            })
            .filter('stringJoiner', function () {
                return function (input, delimiter, prefix, suffix) {
                    prefix = prefix || '';
                    suffix = suffix || '';
                    delimiter = delimiter || ', ';
                    return prefix + (input || []).join(delimiter) + suffix;
                };
            })
            .filter('unixTimeToMoment', function () {
                return function (input) {
                    return moment.unix(input);
                };
            })
            .filter('momentDateFormat', function () {
                return function (value, momentFormat) {
                    if (_.isUndefined(value) || value === null) {
                        return '';
                    }
                    return value.format(momentFormat);
                };
            })
            .filter('makeMomentAndFormat', function () {
                return function (value, momentFormat) {
                    if (_.isUndefined(value) || value === null) {
                        return '';
                    }
                    return moment(value).format(momentFormat);
                };
            })
            .filter('makeMomentDurationAndFormat', function () {
                return function (value, momentFormat, suffix) {
                    if (_.isUndefined(value) || value === null) {
                        return '';
                    }
                    return moment.duration(value, momentFormat).humanize(suffix);
                };
            })
            .filter('passAllFilter', function () {
                return function (input) {
                    return input;
                };
            })
            .filter('forEachApplyFilter', ['$filter', function ($filter) {
                var filter = $filter('applyFilter');
                return function () {
                    // arguments are: [valuesArray, filterName, filter_1st_arg, filter_2nd_arg, ....]
                    var args = Array.prototype.slice.call(arguments);
                    var valuesArray = args.shift();
                    if (_.isUndefined(valuesArray)) {
                        return;
                    }
                    var filteredArray = valuesArray.map(function (item) {
                        args.unshift(item);
                        var result = filter.apply(null, args);
                        args.shift(item);
                        return result;
                    });
                    return filteredArray;
                }
            }])
            .filter('applyFilter', ['$filter', function($filter) { // http://stackoverflow.com/questions/21491747/apply-formatting-filter-dynamically-in-a-ng-repeat
                return function() {
                    // arguments are: [value, filterName, filter_1st_arg, filter_2nd_arg, ....]
                    var args = Array.prototype.slice.call(arguments);
                    var value = args.shift();
                    var filterName = args.shift();
                    // if undefined is passed to this factory then it would create a passAllFilter
                    if (_.isUndefined(filterName )) {
                        filterName = 'passAllFilter';
                    }
                    var filter = $filter(filterName);
                    args.unshift(value);

                    return filter.apply(null, args);
                };
            }]);

    });
