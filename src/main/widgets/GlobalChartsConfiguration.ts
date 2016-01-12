interface HTMLElement {
    getContext(string): any;
}

define([
          'widgets/SDSWidgets'
        , 'chartjs'
        , 'lodash'
    ],
    function (
          SDSWidgets
        , Chart
        , _
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .constant('globalChartStyleConfiguration', {
                // storing style information in JS code, as it needs to be passed to charting library Chart.js initialization.
                // Chart.js does not handle external css.
                // This color is the Bootstrap color for primary buttons, text, labels
                  fillColor: "#337ab7"
            })
            .constant('globalBarChartConfiguration', {
                scaleShowVerticalLines: false
                , barValueSpacing: 2 //the default for this value is 5. It is set to 2 to make bars wider. WARN: if you, on the other hand set it to values greater than 5 (like 10), then the getBarsAtEvent will not work correctly ( will not be able to map bar to event click coordinates).
                , tooltipFillColor: "rgba(255,255,255,0.8)" // make tooltips black on white background, instead of default (white on black background)
                , tooltipFontColor: "rgba(0,0,0 ,0.8)"
                , responsive: true
            })
            .factory('ChartsFactory', ['globalBarChartConfiguration', function (globalBarChartConfiguration) {

                function createBarChart(element, chartData, configurationOverrides, canvasCssOptions) {
                    var canvas = angular.element(element).find('canvas')[0]; //WARN: template must have canvas element already.
                    var ctx = canvas.getContext("2d");

                    if (canvasCssOptions) {
                        _.each(canvasCssOptions, function (value, cssProperty) {
                            canvas.style[cssProperty] = value;
                        });
                    }

                    var chartConfiguration = _.extend(globalBarChartConfiguration, configurationOverrides);
                    return new Chart(ctx).Bar(chartData, chartConfiguration);
                }

                return {
                    createBarChart: createBarChart
                };
            }])
            .constant('labelsDateFormat', 'dd. D MMM')// for example: Mo. 17 Aug)
            .constant('labelsDateRangeFormat', 'D MMM')// for example: Mo. 17 Aug)
            .factory('DateToStringRedefineFactory', ['labelsDateFormat', function(xAxisDateFormat) {
                // returns copy of original date, with the toString method overwritten.
                // custom toString is needed to the Chart.js library to display label in the format we wish.
                // Otherwise the default toString method would be used, which prints too much information (whole date time).
                // Other solution would be to pass as label the already formatted date string, but then, in the click event handler,
                // we would get just string from the helper getBarsAtEvent method (and would need to parse this back string into date object).
                return {
                    patchToStringMethod: function (date) {
                        var copy = date.clone();
                        copy.toString = function () {
                            return this.format(xAxisDateFormat);
                        };
                        return copy;
                    }
                };
            }])
            .factory('DateRangeToStringRedefineFactory', ['labelsDateRangeFormat', function(labelsDateRangeFormat) {
                return {
                    patchToStringMethod: function (momentRange) {
                        var copy = momentRange.clone();
                        copy.toString = function () {
                            return this.start.format(labelsDateRangeFormat) + ' - ' + this.end.format(labelsDateRangeFormat);
                        };
                        return copy;
                    }
                };
            }]);
    });
