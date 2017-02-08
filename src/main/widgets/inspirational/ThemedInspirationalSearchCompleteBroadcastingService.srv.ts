define([], function () {
    "use strict"

    ThemedInspirationalSearchCompleteBroadcastingService.$inject = ['$rootScope', 'themedInspirationalSearchCompleteEvent'];
    function ThemedInspirationalSearchCompleteBroadcastingService ($rootScope, themedInspirationalSearchCompleteEvent) {
            var service = {
                themeSearched: undefined,
                broadcast: function () {
                    $rootScope.$broadcast(themedInspirationalSearchCompleteEvent);
                }
            };
            return service;
    }
    return ThemedInspirationalSearchCompleteBroadcastingService
});