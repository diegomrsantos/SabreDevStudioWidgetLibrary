define([
        'moment'
        , 'angular'
        , 'lodash'
        , 'util/LodashExtensions'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'util/DOMManipulationUtils'
        , 'util/CommonDirectives'
        , 'widgets/WidgetGlobalCallbacks'
    ],
    function (moment
        , angular
        , _
        , __
        , angular_bootstrap
        , SDSWidgets
        , domUtils
        , CommonDirectives
        , WidgetGlobalCallbacks
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('itinerary', [function () {
                return {
                    restrict: 'E',
                    scope: {
                          itin: '='
                        , itinerarySelectedCallback: '&?'
                        , enableItinerarySelectButton: '@?'
                        , flightDetailsAlwaysShown: '@?'
                        , priceDetailsAlwaysShown: '@?'
                        , hideItinerarySelectButton: '@?'
                        , standaloneWidget: '@?'
                    },
                    templateUrl: '../widgets/view-templates/widgets/Itinerary.tpl.html',
                    link: function (scope, element) {
                        scope.selectItineraryClicked = function (itinerary) {
                            if (_.isFunction(scope.itinerarySelectedCallback)) {
                                scope.itinerarySelectedCallback({itinerary: itinerary});
                            }
                        };

                        function addClickEventHandlers(el) {
                            if (!scope.priceDetailsAlwaysShown) {
                                domUtils.addToggleOnClickHandler(el, '.SDSItineraryTogglePriceDetails', '.SDSItineraryPriceDetails');
                                domUtils.addShowOnClickHandler(el, '.SDSItineraryShowPriceDetails', '.SDSItineraryPriceDetails');
                                domUtils.addHideOnClickHandler(el, '.SDSItineraryHidePriceDetails', '.SDSItineraryPriceDetails');
                                scope.$on('$destroy', () => {
                                    domUtils.removeOnClickHandler(el, '.SDSItineraryTogglePriceDetails');
                                    domUtils.removeOnClickHandler(el, '.SDSItineraryShowPriceDetails');
                                    domUtils.removeOnClickHandler(el, '.SDSItineraryHidePriceDetails');
                                });
                            }

                            if (!scope.flightDetailsAlwaysShown) {
                                domUtils.addToggleOnClickHandler(el, '.SDSItineraryToggleFlightDetails', '.SDSItineraryFlightDetails');
                                domUtils.addShowOnClickHandler(el, '.SDSItineraryShowFlightDetails', '.SDSItineraryFlightDetails', '.SDSItineraryHideWhenFlightDetailsShown');
                                domUtils.addHideOnClickHandler(el, '.SDSItineraryHideFlightDetails', '.SDSItineraryFlightDetails', '.SDSItineraryHideWhenFlightDetailsShown');
                                scope.$on('$destroy', () => {
                                    domUtils.removeOnClickHandler(el, '.SDSItineraryToggleFlightDetails');
                                    domUtils.removeOnClickHandler(el, '.SDSItineraryShowFlightDetails');
                                    domUtils.removeOnClickHandler(el, '.SDSItineraryHideFlightDetails');
                                });
                            }

                            domUtils.addToggleOnClickHandler(el, '.SDSItineraryToggleBrandDetails', '.SDSItineraryBrandDetails');
                        }

                        addClickEventHandlers(element);

                        scope.$on('$destroy', () => {
                            domUtils.removeOnClickHandler(element, '.SDSItineraryToggleBrandDetails');
                            delete scope.selectItineraryClicked;
                        });

                        if (scope.standaloneWidget === "true") {
                        // WidgetGlobalCallbacks linkComplete must be called only for standalone widgets, not for partials. Most often this directive is used as partial that is why by default it is not called.
                            WidgetGlobalCallbacks.linkComplete(scope, element);
                        }

                    }
                }
            }]);
    });
