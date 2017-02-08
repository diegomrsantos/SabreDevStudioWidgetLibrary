define([], function () {
    "use strict"

    function TripOriginLocalStorageProvider ($localStorage) {
        var service:ITripOriginProvider = {
            get: function () {
                return $localStorage.origin;
            }
        };
        return service;
    }
    return TripOriginLocalStorageProvider;
});
