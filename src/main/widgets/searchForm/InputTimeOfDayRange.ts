define([
          'moment'
        , 'moment_range'
        , 'angular'
        , 'widgets/SDSWidgets'
    ],
    function (
          moment
        , moment_range
        , angular
        , SDSWidgets
) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('inputTimeOfDayRange', function () {
                return {
                    replace: true,
                    scope: {
                        selectedRange: '=range'
                    },
                    templateUrl: '../widgets/view-templates/partials/InputTimeOfDayRange.tpl.html',
                    link: function (scope) {
                        const WHOLE_DAY_RANGE = moment.range(moment({ hour:0, minute:0 }), moment({ hour:24, minute:0 }));

                        scope.timeOfDayRanges = [
                            WHOLE_DAY_RANGE,
                            moment.range(moment({ hour:0, minute:0 }), moment({ hour:6, minute:0 })),
                            moment.range(moment({hour: 6, minute: 0}), moment({hour: 12, minute: 0})),
                            moment.range(moment({hour: 12, minute: 0}), moment({hour: 18, minute: 0})),
                            moment.range(moment({hour: 18, minute: 0}), moment({hour: 24, minute: 0}))
                        ];
                        scope.selectedRange = scope.timeOfDayRanges[0];
                    }
                };
            })
            .filter('timeOfDayRange', function () {
                function isMidnight(momentDate) {
                    return (momentDate.hour() === 0) && (momentDate.minute() === 0)
                }
                return function (range, momentFormatString) {
                    if (isMidnight(range.start) && isMidnight(range.end)) {
                        return 'No preference'
                    }
                    return range.start.format(momentFormatString) + ' - ' + range.end.format(momentFormatString);
                }
            })
    });
