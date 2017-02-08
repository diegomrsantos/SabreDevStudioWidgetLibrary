define([
    'lodash'
    ],
    function (
    _
    ) {
        'use strict';

        MapThemedDestinationFinderWidgetDirective.$inject = ['uiGmapGoogleMapApi'];
        function MapThemedDestinationFinderWidgetDirective(
            uiGmapGoogleMapApi
        ) {
            return {
                scope: {
                    closestAirport: '@?',
                    searchOfferClicked: '&?',
                    initialZoom: '@?',
                    searchStartedCallback: '&?',
                    searchSuccessCallback: '&?',
                    searchErrorCallback: '&?'
                },
                templateUrl: '../widgets/view-templates/widgets/MapThemedDestinationFinderWidget.tpl.html',
                controller: 'MapThemedDestinationFinderWidgetController',
                link: function ($scope) {
                    uiGmapGoogleMapApi.then(function(maps) {
                        $scope.initialZoom = parseInt($scope.initialZoom) || 4;

                        var markerOpts = [
                            {
                                icon: '../widgets/img/icons/bullets/bullet_sm_green.png'
                            },
                            {
                                icon: '../widgets/img/icons/bullets/bullet_sm_yellow.png'
                            },
                            {
                                icon: '../widgets/img/icons/bullets/bullet_sm_red.png'
                            }
                        ];

                        $scope.markerEvents = {
                            mouseover: function (gmapsMarkerObj, eventName, model) {
                                model.control.shortDetailsShown = true;
                            },
                            mouseout: function (gmapsMarkerObj, eventName, model) {
                                model.control.shortDetailsShown = false;
                            }
                        };

                        $scope.getTierIcon = function (priceTier) {
                            return $scope.getMarkerOptions(priceTier).icon;
                        };

                        $scope.getMarkerOptions = function (priceTier) {
                            return markerOpts[priceTier - 1];
                        };
                    });
                }
            }
        }
        return MapThemedDestinationFinderWidgetDirective;
});
