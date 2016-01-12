define([
        'moment'
        , 'angular'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'util/DOMManipulationUtils'
        , 'util/CommonDirectives'
    ],
    function (moment
        , angular
        , angular_bootstrap
        , SDSWidgets
        , domUtils
        , CommonDirectives
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('itinerary', function () {
                return {
                    restrict: 'E',
                    scope: {
                        itinerary: '=itin'
                    },
                    templateUrl: '../widgets/view-templates/widgets/Itinerary.tpl.html',
                    link: function (scope, element) {

                        function addClickEventHandlers(el) {
                            domUtils.addToggleOnClickHandler(el, '.SDSItineraryTogglePriceDetails', '.SDSItineraryPriceDetails');
                            domUtils.addShowOnClickHandler(el, '.SDSItineraryShowPriceDetails', '.SDSItineraryPriceDetails');
                            domUtils.addHideOnClickHandler(el, '.SDSItineraryHidePriceDetails', '.SDSItineraryPriceDetails');

                            domUtils.addToggleOnClickHandler(el, '.SDSItineraryToggleFlightDetails', '.SDSItineraryFlightDetails');
                            domUtils.addShowOnClickHandler(el, '.SDSItineraryShowFlightDetails', '.SDSItineraryFlightDetails', '.SDSItineraryHideWhenFlightDetailsShown');
                            domUtils.addHideOnClickHandler(el, '.SDSItineraryHideFlightDetails', '.SDSItineraryFlightDetails', '.SDSItineraryHideWhenFlightDetailsShown');

                            domUtils.addToggleOnClickHandler(el, '.SDSItineraryToggleBrandDetails', '.SDSItineraryBrandDetails');
                        }

                        addClickEventHandlers(element);
                    }
                }
            });
    });
