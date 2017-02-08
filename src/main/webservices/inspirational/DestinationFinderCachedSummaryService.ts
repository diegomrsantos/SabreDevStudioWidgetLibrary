define([
        'angular',
        'lodash'
    ],
    function (
        angular,
        _
    ) {
        'use strict';

        return function (DestinationFinderSummaryService) {
            const cachedDataServiceFn = _.memoize(DestinationFinderSummaryService.getOffersOrderedSummary, JSON.stringify);

            return {
                getOffersOrderedSummary: function (searchCriteria) {
                    return cachedDataServiceFn(searchCriteria);
                }
            };
        };
});