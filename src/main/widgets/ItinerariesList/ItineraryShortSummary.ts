define([
          'angular'
        , 'util/LodashExtensions'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'util/CommonDisplayDirectives'
    ],
    function (
          angular
        , __
        , angular_bootstrap
        , SDSWidgets
        , CommonDisplayDirectives

    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('itineraryShortSummary', function () {
                return {
                    scope: {
                        itinerary: '=itin',
                        itineraryClickedCallback: '&?'
                    },
                    templateUrl: '../widgets/view-templates/widgets/ItineraryShortSummary.tpl.html',
                    link: function(scope) {
                        scope.itemClicked = function (itineraryId) {
                            if (__.isDefined(scope.itineraryClickedCallback)) {
                                scope.itineraryClickedCallback({itineraryId: itineraryId});
                            }
                        };

                        scope.$on('$destroy', function() {
                            delete scope.itemClicked;
                        });
                    }
                }
            });
    });
