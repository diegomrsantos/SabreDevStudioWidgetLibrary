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

                        function forEachLosDays(fn) {
                            /*jshint validthis:true */
                            var elementMousedOver = this;
                            var allLoSdays = $$.nextAllAndFirstLevelCousins(elementMousedOver, lengthOfStayDays);
                            allLoSdays.forEach(fn);
                        }

                        function addHighlight(cell) {
                            cell.classList.add(scope.highlightClass);
                        }

                        function removeHighlight(cell) {
                            cell.classList.remove(scope.highlightClass);
                        }

                        var addHighlightForAllLosDays = forEachLosDays(addHighlight);
                        element[0].addEventListener('mouseenter', addHighlightForAllLosDays);

                        var removeHighlightForAllLosDays = forEachLosDays(removeHighlight);
                        element[0].addEventListener('mouseleave', removeHighlightForAllLosDays);

                        scope.$on('$destroy', function() {
                            element[0].removeEventListener('mouseenter', addHighlightForAllLosDays);
                            element[0].removeEventListener('mouseleave', removeHighlightForAllLosDays);
                        });
                    }
                };
            });
    });
