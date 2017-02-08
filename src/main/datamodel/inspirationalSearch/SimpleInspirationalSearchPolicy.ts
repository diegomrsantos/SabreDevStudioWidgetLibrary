define([
    'moment'
], function (
    moment
    ) {
    "use strict";

    /* API accepts up to 30 departure dates, but no point to query for all possible with relatively long advance purchase (earliestdeparturedate).
     Querying for couple departure days should be enough */
    const departureDaysToQuery = 2;
    /* WARN: Performance: with departureDaysToQuery==2 and lengthOfStayDaysToSearch.length==4 there are (2+1)*4=12 date combinations to query.
     At this number of combinations the response time is like 1-2s. Response time grows much with number of date combinations requested. */

    const earliestdeparturedate = moment().add(2, 'months');

    var simpleInspirationalSearchPolicy = {
        /* API accepts up to 10 length of stay (LoS) values, but no point to query for consecutive LoS numbers (like 7,8,9,10 ...), especially with relatively long advance purchase (earliestdeparturedate),
         as the fare rules are typically defined for ranges of length of stay, not particular values. Like up to 7 days, 7-14, more than 21. */
        lengthOfStayDays: [7,13,14,15],

        earliestdeparturedate: earliestdeparturedate,
        latestdeparturedate: earliestdeparturedate.clone().add(departureDaysToQuery, 'days')
    };

    return simpleInspirationalSearchPolicy;
});
