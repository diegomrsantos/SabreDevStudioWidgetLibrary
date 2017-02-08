define([], function () {
    "use strict"

    ThemedInspirationalSearchCriteriaBroadcastingService.$inject = ['$rootScope', 'newThemedInspirationalSearchCriteriaEvent'];
    function ThemedInspirationalSearchCriteriaBroadcastingService ($rootScope, newInspirationalSearchCriteriaEvent) {
            var service = {
                searchCriteria: undefined,
                broadcast: function () {
                    $rootScope.$broadcast(newInspirationalSearchCriteriaEvent);
                }
            };
            return service;
    }
    return ThemedInspirationalSearchCriteriaBroadcastingService
});