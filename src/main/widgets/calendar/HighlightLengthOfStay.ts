define([
          'angular'
        , 'widgets/SDSWidgets'
        , 'util/SelectorEngineExtensions'
    ],
    function (
          angular
        , SDSWidgets
        , $$
        ) {
        'use strict';

        return angular.module('sdsWidgets')
            // Adds handler for mouseenter and mouseleave events to highlight the mouse entered calendar cell and all next cells within LoS
            .directive('highlightLengthOfStay', function () {
                return {
                    scope: {
                        lengthOfStayDays: '@'
                        , highlightClass: '@'
                    },
                    link: function (scope, element) {
                        var lengthOfStayDays = parseInt(scope.lengthOfStayDays) + 1; // in length of stay highlight we include both departure and return day ( that's why + 1)

                        element[0].addEventListener('mouseenter', function () {
                            var allLoSdays = $$.nextAllAndFirstLevelCousins(this, lengthOfStayDays);
                            allLoSdays.forEach(function (cell) {
                                cell.classList.add(scope.highlightClass);
                            });
                        });

                        element[0].addEventListener('mouseleave', function () {
                            var allLoSdays = $$.nextAllAndFirstLevelCousins(this, lengthOfStayDays);
                            allLoSdays.forEach(function (cell) {
                                cell.classList.remove(scope.highlightClass);
                            });
                        });
                    }
                };
            });
    });
