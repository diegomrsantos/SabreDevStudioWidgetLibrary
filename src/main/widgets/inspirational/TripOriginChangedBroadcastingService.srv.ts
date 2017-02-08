define([], function () {
    "use strict"

    TripOriginChangedBroadcastingService.$inject = ['$rootScope', 'tripOriginChangedEvent'];
    function TripOriginChangedBroadcastingService ($rootScope, tripOriginChangedEvent){
            var service:ITripOriginChangedService = {
                onOriginChange: function (origin:string) {
                    $rootScope.$broadcast(tripOriginChangedEvent, origin);
                }
            };
            return service;
    }
    return TripOriginChangedBroadcastingService
});