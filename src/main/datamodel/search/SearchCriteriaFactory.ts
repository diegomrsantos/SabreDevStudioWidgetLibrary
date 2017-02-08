define([
          'lodash'
        , 'util/LodashExtensions'
        , 'moment'
        , 'datamodel/search/SearchCriteria'
        , 'datamodel/search/SearchCriteriaLeg'
        , 'datamodel/search/alternateDates/PlusMinusDaysTravelDatesFlexibility'
    ], function (
          _
        , __
        , moment
        , SearchCriteria
        , SearchCriteriaLeg
        , PlusMinusDaysTravelDatesFlexibility
    ) {
    "use strict";

    function buildSearchCriteriaSkeleton(searchCriteriaOptions) {
        var searchCriteria = new SearchCriteria();

        const totalPassengerCount = (searchCriteriaOptions && searchCriteriaOptions.searchCriteriaOptions) || 1;
        searchCriteria.addPassenger('ADT', totalPassengerCount);

        if (searchCriteriaOptions && searchCriteriaOptions.preferredCabin) {
            searchCriteria.preferredCabin = searchCriteriaOptions.preferredCabin
        }

        if (searchCriteriaOptions && !_.isEmpty(searchCriteriaOptions.preferredAirlines)) {
            searchCriteria.preferredAirlines = searchCriteriaOptions.preferredAirlines
        }
        return searchCriteria;
    }

    /**
     * Static factory producing simple, minimal SearchCriteria for round trip travel  
     * @param origin 3 letter alphanumeric IATA airport or city code
     * @param destination
     * @param departureDateString
     * @param returnDateString
     * @returns {SearchCriteria}
     */
    function buildRoundTripTravelSearchCriteria(origin, destination, departureDateString, returnDateString, searchCriteriaOptions) {
        var departureDateTime = moment(departureDateString, moment.ISO_8601);
        var returnDateTime = moment(returnDateString, moment.ISO_8601);

        var firstLeg = new SearchCriteriaLeg({
              origin: origin
            , destination: destination
            , departureDateTime: departureDateTime
            , returnDateTime: returnDateTime
        });
        var secondLeg = new SearchCriteriaLeg({
            origin: destination
            , destination: origin
            , departureDateTime: returnDateTime
            , returnDateTime: departureDateTime
        });
        var searchCriteria = buildSearchCriteriaSkeleton(searchCriteriaOptions);
        searchCriteria.addLeg(firstLeg);
        searchCriteria.addLeg(secondLeg);

        return searchCriteria;
    }

    function buildOneWayTravelSearchCriteria(origin, destination, departureDateString, searchCriteriaOptions) {
        var departureDateTime = moment(departureDateString, moment.ISO_8601);

        var firstLeg = new SearchCriteriaLeg({
            origin: origin
            , destination: destination
            , departureDateTime: departureDateTime
        });

        var searchCriteria = buildSearchCriteriaSkeleton(searchCriteriaOptions);
        searchCriteria.addLeg(firstLeg);

        return searchCriteria;
    }

    function buildRoundTripTravelSearchCriteriaWithDateFlexibility(origin, destination, departureDateString, returnDateString, dateFlexibilityDays, searchCriteriaOptions) {
        var searchCriteria = buildRoundTripTravelSearchCriteria(origin, destination, departureDateString, returnDateString, searchCriteriaOptions);
        searchCriteria.dateFlexibilityDays = PlusMinusDaysTravelDatesFlexibility.prototype.buildConstantDaysFlexibility(dateFlexibilityDays);
        return searchCriteria;
    }

    function buildMultidestinationSearchCriteria(originDestinationPairs) {
        var lengthOfStay = 7;
        var searchCriteria = new SearchCriteria();
        originDestinationPairs.forEach(function (originDestinationPair, idx) {
            var departureDateTime = moment().add((idx) * lengthOfStay, 'days');
            var returnDateTime = departureDateTime.clone().add(lengthOfStay, 'days');
            var leg = new SearchCriteriaLeg({
                  origin: originDestinationPair.origin
                , destination: originDestinationPair.destination
                , departureDateTime: departureDateTime
                , returnDateTime: returnDateTime
            });
            searchCriteria.addLeg(leg);
        });

        searchCriteria.addPassenger('ADT', 1);

        return searchCriteria;
    }

    return {
        buildRoundTripTravelSearchCriteria: buildRoundTripTravelSearchCriteria,
        buildOneWayTravelSearchCriteria: buildOneWayTravelSearchCriteria,
        buildRoundTripTravelSearchCriteriaWithDateFlexibility: buildRoundTripTravelSearchCriteriaWithDateFlexibility,
        buildMultidestinationSearchCriteria: buildMultidestinationSearchCriteria
    };
});
