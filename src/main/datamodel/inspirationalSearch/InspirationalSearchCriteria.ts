define([], function (
    ) {
    "use strict";

    function InspirationalSearchCriteria(criteria) {
        this.origin = criteria.origin;
        this.pointofsalecountry = criteria.pointofsalecountry;
        this.inspirationalSearchPolicy = criteria.inspirationalSearchPolicy;
        this.theme = criteria.theme;
    }

    return InspirationalSearchCriteria;
});
