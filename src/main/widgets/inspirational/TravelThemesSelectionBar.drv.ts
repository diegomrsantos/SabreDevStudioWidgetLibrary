define([
    'angular',
    'lodash',
    'util/LodashExtensions',
    'webservices/lookup/TravelThemeLookupDataService'
], function (
    angular,
    _,
    __,
    TravelThemeLookupDataServiceSrc
) {
    'use strict';

    TravelThemesSelectionBarDirective.$inject = [
        'TravelThemeLookupDataService',
        'ThemedInspirationalSearchCriteriaBroadcastingService',
        'themedInspirationalSearchCompleteEvent',
        'ThemedInspirationalSearchCompleteBroadcastingService',
        '$timeout'
    ];
    function TravelThemesSelectionBarDirective(
        TravelThemeLookupDataService,
        ThemedInspirationalSearchCriteriaBroadcastingService,
        themedInspirationalSearchCompleteEvent,
        ThemedInspirationalSearchCompleteBroadcastingService,
        $timeout
    ) {
        return {
            scope: {
                closestAirport: '@?',
                themeSelectedCallback: '&?'
            },
            templateUrl: '../widgets/view-templates/widgets/TravelThemesSelectionBar.tpl.html',
            link: function ($scope) {
                $scope.travelThemes = [];
                $scope.selectedTravelTheme = undefined;

                var lastTravelThemeLinkClicked;

                $scope.travelThemeClicked = function (event, theme) {
                    var clickTarget = event.target || event.srcElement;
                    lastTravelThemeLinkClicked = angular.element(clickTarget);
                    lastTravelThemeLinkClicked.addClass('SDSSearchInProgressUponClicked');
                    notifyTravelThemeSelected(theme);
                };

                $scope.$on('themedInspirationalSearchCompleteEvent', () => {
                    if (__.isDefined(lastTravelThemeLinkClicked)) {
                        lastTravelThemeLinkClicked.removeClass('SDSSearchInProgressUponClicked');
                    }
                    $scope.selectedTravelTheme = ThemedInspirationalSearchCompleteBroadcastingService.themeSearched;
                });

                function initializeModel() {
                    TravelThemeLookupDataService.getTravelThemes().then(
                        function (travelThemes) {
                            $scope.travelThemes = travelThemes;
                            var selectedTravelThemeIdx = _.random($scope.travelThemes.length - 1);
                            var selectedTravelTheme = $scope.travelThemes[selectedTravelThemeIdx];
                            $timeout(() => { // defer notification on theme selected to let other directives, listening on that initialization, initialize themselves.
                                notifyTravelThemeSelected(selectedTravelTheme);
                            });
                        }
                    );
                }

                function notifyTravelThemeSelected(theme) {
                    var searchCriteria = {
                        theme: theme
                    };
                    if (_.isFunction($scope.themeSelectedCallback)) {
                        $scope.themeSelectedCallback(searchCriteria);
                    }
                    ThemedInspirationalSearchCriteriaBroadcastingService.searchCriteria = searchCriteria;
                    ThemedInspirationalSearchCriteriaBroadcastingService.broadcast();
                }

                initializeModel();
            }
        };
    }

    return TravelThemesSelectionBarDirective;
});