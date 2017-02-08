define([
    'datamodel/inspirationalSearch/InspirationalSearchCriteria',
    'datamodel/inspirationalSearch/InspirationalSearchPolicy',
    'datamodel/inspirationalSearch/SimpleInspirationalSearchPolicy'
], function (
    InspirationalSearchCriteria,
    InspirationalSearchPolicy,
    simpleInspirationalSearchPolicy
    ) {
    "use strict";

    return {
        create: function create(origin, pointofsalecountry) {
            return new InspirationalSearchCriteria({
                origin: origin,
                pointofsalecountry: pointofsalecountry,
                inspirationalSearchPolicy: new InspirationalSearchPolicy(simpleInspirationalSearchPolicy)
            });
        }
    };
});
