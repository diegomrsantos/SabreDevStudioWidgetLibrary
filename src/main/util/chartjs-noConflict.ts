define([
          'lodash'
        , 'chartjs'
    ],
    function (
          _
        , chartjs
    ) {
        "use strict";

        var globalChartConfiguration = {
            responsive: true
        };

        var chartjsNoConflict = chartjs.noConflict();

        _.extend(chartjsNoConflict.defaults.global, globalChartConfiguration);

        return chartjsNoConflict;
    }
);
