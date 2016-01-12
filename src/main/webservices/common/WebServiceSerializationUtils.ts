define([],
    function () {
        'use strict';

        return {
            createWeekDaysString: function (travelDaysOfWeek) {
                // WARN: locale specific: we base on first day being Sunday
                var DAY_SYMBOLS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                var DAY_NOT_SELECTED_MARKER = '_';
                return travelDaysOfWeek.map(function (isDaySelected, dayIndex) {
                    return (isDaySelected)? DAY_SYMBOLS[dayIndex]: DAY_NOT_SELECTED_MARKER;
                }).join('');
            }
        };
    });
