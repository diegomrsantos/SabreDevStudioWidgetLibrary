define([
          'angular'
        , 'widgets/SDSWidgets'
    ],
    function (
          angular
        , SDSWidgets
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('highLowMedianCurrentChart', function () {
                return {
                    replace: true,
                    scope: {
                          highValue: '@'
                        , highText: '@'
                        , lowValue: '@'
                        , lowText: '@'
                        , medianValue: '@'
                        , medianText: '@'
                        , currentValue: '@?'
                        , currentText: '@?'
                        , valuesFilter: '@?'
                        , valuesFilterArguments: '@?'
                    },
                    templateUrl: '../widgets/view-templates/partials/HighLowMedianCurrentChart.tpl.html',
                    link: function (scope) {

                        scope.chartConfig = {
                            topLeftOffset: {
                                x: 30,
                                y: 20
                            },
                            bar: {
                                width: 40,
                                height: 120
                            },
                            pointerLineLengthOutsideOfBar: 10,
                            pointerLineRightMargin: 2,
                            legendForCurrentYOffset: 10
                        };


                        var heightUnitsPerOneValueUnit = scope.chartConfig.bar.height / (parseFloat(scope.highValue) - parseFloat(scope.lowValue));
                        
                        var medianOffsetFromBarBottom = (parseFloat(scope.medianValue) - parseFloat(scope.lowValue)) * heightUnitsPerOneValueUnit;
                        var medianNormalizedYPosition = scope.chartConfig.topLeftOffset.y + scope.chartConfig.bar.height - medianOffsetFromBarBottom;

                        if (scope.currentValue) {
                            var currentOffsetFromBarBottom = (parseFloat(scope.currentValue) - parseFloat(scope.lowValue)) * heightUnitsPerOneValueUnit;
                            var currentNormalizedYPosition = scope.chartConfig.topLeftOffset.y + scope.chartConfig.bar.height - currentOffsetFromBarBottom;
                        }

                        scope.chartHelpers = {
                            getPointerLineXStart: function() {
                                return scope.chartConfig.topLeftOffset.x + scope.chartConfig.bar.width / 2;
                            },
                            getPointerLineXEnd: function () {
                                return scope.chartConfig.topLeftOffset.x + scope.chartConfig.bar.width + scope.chartConfig.pointerLineLengthOutsideOfBar;
                            },
                            getOppositePointerLineXEnd: function () {
                                return scope.chartConfig.topLeftOffset.x - scope.chartConfig.pointerLineLengthOutsideOfBar;
                            },
                            getMedianNormalizedYPosition: function () {
                                return medianNormalizedYPosition;
                            },
                            getCurrentNormalizedYPosition: function () {
                                return currentNormalizedYPosition;
                            },
                            getCurrentLegendYPosition: function () {
                                return currentNormalizedYPosition + scope.chartConfig.legendForCurrentYOffset;
                            }
                        };
                    }
                }
            });
    });
