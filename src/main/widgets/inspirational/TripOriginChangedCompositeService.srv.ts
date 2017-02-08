define([], function () {
    "use strict"

    function TripOriginChangedCompositeService (...args: ITripOriginChangedService[]){
            var service:ITripOriginChangedService = {
                onOriginChange: function (origin:string) {
                    args.forEach(s => {
                        s.onOriginChange(origin);
                    })
                }
            };
            return service;
    }
    return TripOriginChangedCompositeService
});