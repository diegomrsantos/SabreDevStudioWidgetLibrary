define([], function () {
    "use strict"

    function TripOriginChangedLocalStorageService ($localStorage) {
        var service:ITripOriginChangedService = {
            onOriginChange: function (origin:String) {
                $localStorage.origin = origin;
            }
        };
        return service;
    }
    return TripOriginChangedLocalStorageService;
});
