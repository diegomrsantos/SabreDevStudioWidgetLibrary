define([], function (
    ) {
    "use strict";

    function InspirationalSearchPolicy(policy) {
        this.lengthOfStayDays = policy.lengthOfStayDays;
        this.earliestdeparturedate = policy.earliestdeparturedate;
        this.latestdeparturedate = policy.latestdeparturedate;
        this.topdestinations = policy.topdestinations || 50;
        this.maxOffersPerDestination = policy.maxOffersPerDestination || 10;
    }

    return InspirationalSearchPolicy;
});
