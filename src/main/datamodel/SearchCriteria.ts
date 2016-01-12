define([
          'lodash'
        , 'util/LodashExtensions'
        , 'moment'
        , 'datamodel/SearchCriteriaLeg'
    ], function (
          _
        , __
        , moment
        , SearchCriteriaLeg
    ) {
    "use strict";

    function SearchCriteria() {

        var that = this;

        this.legs = [];

        // Preferred airlines, defined on whole travel level (not on particular leg level).
        this.preferredAirlines = [];

        // Preferred cabin is defined on whole travel level, not on particular leg level. By default Economy
        var _preferredCabin = this.CabinEnum.Economy;
        Object.defineProperty(this, 'preferredCabin', {
            enumerable: true,
            get: function() { return _preferredCabin;},
            set: function(preferredCabin) {
                switch (preferredCabin) {
                    case 'Economy': {
                        _preferredCabin = that.CabinEnum.Economy;
                        break;
                    }
                    case 'PremiumEconomy': {
                        _preferredCabin = that.CabinEnum.PremiumEconomy;
                        break;
                    }
                    case 'Business': {
                        _preferredCabin = that.CabinEnum.Business;
                        break;
                    }
                    case 'First': {
                        _preferredCabin = that.CabinEnum.First;
                        break;
                    }
                    default: throw new Error('unrecognized cabin code: ' + preferredCabin);
                }
            }
        });

        // 0 means direct flights only. undefined means no restriction on number of stops
        var _maxStops;
        Object.defineProperty(this, 'maxStops', {
            enumerable: true,
            get: function() { return _maxStops;},
            set: function(maxStops) { _maxStops = maxStops;}
        });

        this.passengerSpecifications = [];

        Object.defineProperty(this, 'returnAlternateDatesOnly', {
            enumerable: true,
            writable: true
        });
    }

    SearchCriteria.prototype.addLeg = function (leg) {
        this.legs.push(leg);
    };

    SearchCriteria.prototype.getLeg = function (legIdx) {
        return this.legs[legIdx];
    };

    SearchCriteria.prototype.getFirstLeg = function () {
        return this.getLeg(0);
    };

    SearchCriteria.prototype.getSecondLeg = function () {
        return this.getLeg(1);
    };

    /**
     * @param airlineCode as two-character alphanumeric IATA airline code, for example AA
     */
    SearchCriteria.prototype.addPreferredAirline = function (airlineCode) {
      this.preferredAirlines.push(airlineCode);
    };

    SearchCriteria.prototype.getPreferredAirlines = function () {
        return this.preferredAirlines;
    };

    /** Adds to the search criteria the passenger type code specification, for example:
     * {
         passengerTypeCode: 'ADT'
        , count: 1
      }
     */
    SearchCriteria.prototype.addPassenger = function(passengerTypeCode, count) {
        this.passengerSpecifications.push({
              passengerTypeCode: passengerTypeCode
            , count: count
        });
    };

    SearchCriteria.prototype.getTotalPassengerCount = function () {
        return this.passengerSpecifications.reduce(function (acc, next) {
            return acc + next.count;
        }, 0);
    };

    SearchCriteria.prototype.isAnyLengthOfStayDefined = function () {
        return __.isDefined(this.lengthOfStay) || __.isDefined(this.earliestDepartureLatestReturnDatesFlexibility);
    };

    /**
     * returns length of stay for round trip travels
      */
    SearchCriteria.prototype.getLengthOfStay = function () {
        if (this.isOneWayTravel()) { // There is no length of stay for one way travel
            return;
        }
        if (__.isDefined(this.lengthOfStay)) {
            return this.lengthOfStay;
        }
        var firstLegDepartureDateTime = this.legs[0].departureDateTime;
        var secondLegDepartureDateTime = this.legs[1].departureDateTime;
        if (firstLegDepartureDateTime && secondLegDepartureDateTime) {
            return this.lengthOfStay || secondLegDepartureDateTime.diff(firstLegDepartureDateTime, 'days');
        }
    };

    SearchCriteria.prototype.getMinMaxLengthOfStay = function () {
        return this.earliestDepartureLatestReturnDatesFlexibility && this.earliestDepartureLatestReturnDatesFlexibility.minMaxLengthOfStay;
    };

    SearchCriteria.prototype.getMinLengthOfStay = function () {
        return this.getMinMaxLengthOfStay() && this.getMinMaxLengthOfStay().minDays;
    };

    SearchCriteria.prototype.getMaxLengthOfStay = function () {
        return this.getMinMaxLengthOfStay() && this.getMinMaxLengthOfStay().maxDays;
    };

    SearchCriteria.prototype.toString = function () {
        return JSON.stringify(this);
    };

    SearchCriteria.prototype.getTripOrigin = function () {
        return this.getFirstLeg().origin;
    };

    SearchCriteria.prototype.getTripDestination = function () {
        return this.getFirstLeg().destination;
    };

    SearchCriteria.prototype.isRoundTripTravel = function () {
        return ((this.legs.length === 2) && (this.getFirstLeg().origin === this.getSecondLeg().destination) && (this.getFirstLeg().destination === this.getSecondLeg().origin));
    };

    SearchCriteria.prototype.isOneWayTravel = function () {
        return (this.legs.length === 1);
    };

    SearchCriteria.prototype.TripTypeEnum = Object.freeze({
        'OneWay': 'OneWay',
        'RoundTrip': 'RoundTrip',
        'MultiStop': 'MultiStop'
    });

    SearchCriteria.prototype.isEconomyCabinRequested = function () {
       return (this.preferredCabin ===  this.CabinEnum.Economy);
    };

    SearchCriteria.prototype.CabinEnum = Object.freeze({
        'Economy': {
              name: 'Economy'
            , code: 'Y'
        },
        'PremiumEconomy': {
              name: 'PremiumEconomy'
            , code: 'S'
        },
        'Business': {
              name: 'Business'
            , code: 'C'
        },
        'First': {
              name: 'First'
            , code: 'F'
        }
    });

    SearchCriteria.prototype.cloneWithDatesAdjustedToOtherDepartureDate = function(date) {
        var newCriteria = _.extend(Object.create(SearchCriteria.prototype), this);
        var daysOffset = date.diff(this.getFirstLeg().departureDateTime, 'days');
        newCriteria.legs.forEach(function (leg) {
            leg.addDaysToDepartureDate(daysOffset);
        });
        return newCriteria;
    };

    SearchCriteria.prototype.cloneWithoutDateFlexibility = function () {
        var copy = _.extend(Object.create(SearchCriteria.prototype), this);
        copy.dateFlexibilityDays = undefined;
        copy.returnAlternateDatesOnly = undefined;
        return copy;
    };

    SearchCriteria.prototype.isAlternateDatesRequest = function () {
        return this.isPlusMinusDaysDateFlexibilityRequest() || this.isEarliestDepartureLatestReturnDateFlexibilityRequest();
    };

    SearchCriteria.prototype.isPlusMinusDaysDateFlexibilityRequest = function () {
        return this.dateFlexibilityDays;
    };

    SearchCriteria.prototype.hasAtLeastOnePlusMinusDayDefined = function () {
        return _.values(this.dateFlexibilityDays).some(function (plusMinusDay) {
            return plusMinusDay > 0;
        });
    };

    SearchCriteria.prototype.getRequestedDepartureDates = function () {
        if (this.earliestDepartureLatestReturnDatesFlexibility) {
            return this.generateDepartureAltDatesForEarliestDepartureLatestReturn(
                  this.earliestDepartureLatestReturnDatesFlexibility.getEarliestDepartureDateTime()
                , this.earliestDepartureLatestReturnDatesFlexibility.getLatestReturnDateTime()
                , this.earliestDepartureLatestReturnDatesFlexibility.minMaxLengthOfStay.minDays
            );
        }
        return this.generateAlternateDates(this.getFirstLeg().departureDateTime, {
              minusDays: this.dateFlexibilityDays.departureMinusDays
            , plusDays: this.dateFlexibilityDays.departurePlusDays
        });
    };

    SearchCriteria.prototype.getRequestedReturnDates = function () {
        if (this.earliestDepartureLatestReturnDatesFlexibility) {
            return this.generateReturnAltDatesForEarliestDepartureLatestReturn(
                this.earliestDepartureLatestReturnDatesFlexibility.getEarliestDepartureDateTime()
                , this.earliestDepartureLatestReturnDatesFlexibility.getLatestReturnDateTime()
                , this.earliestDepartureLatestReturnDatesFlexibility.minMaxLengthOfStay.minDays
            );
        }
        return this.generateAlternateDates(this.getSecondLeg().departureDateTime, {
              minusDays: this.dateFlexibilityDays.returnMinusDays
            , plusDays: this.dateFlexibilityDays.returnPlusDays
        });
    };

    SearchCriteria.prototype.generateDepartureAltDatesForEarliestDepartureLatestReturn = function (earliestDepartureDateTime, latestReturnDateTime, lengthOfStay) {
        var latestDepartureDateTime = latestReturnDateTime.clone().subtract(lengthOfStay, 'days');
        var allAltDates = [];
        moment.range(earliestDepartureDateTime, latestDepartureDateTime).by('days', function (day) {
            allAltDates.push(day);
        });
        return allAltDates;
    };

    SearchCriteria.prototype.generateReturnAltDatesForEarliestDepartureLatestReturn = function (earliestDepartureDateTime, latestReturnDateTime, lengthOfStay) {
        var earliestReturnDateTime = earliestDepartureDateTime.clone().add(lengthOfStay, 'days');
        var allAltDates = [];
        moment.range(earliestReturnDateTime, latestReturnDateTime).by('days', function (day) {
            allAltDates.push(day);
        });
        return allAltDates;
    };

    SearchCriteria.prototype.getRequestedLengthOfStayValues = function () {
        var departureDates = this.getRequestedDepartureDates();
        var returnDates = this.getRequestedReturnDates();
        var allLoS = [];
        departureDates.forEach(function (departureDate) {
            returnDates.forEach(function (returnDate) {
                var lengthOfStay = returnDate.diff(departureDate, 'days');
                if (lengthOfStay >= 0) {
                    allLoS.push(lengthOfStay);
                }
            });
        });
        return _.uniq(allLoS);
    };

    SearchCriteria.prototype.getTripDepartureDateTime = function () {
        return this.getFirstLeg().departureDateTime;
    };

    SearchCriteria.prototype.getTripReturnDateTime = function () {
        return _.last(this.legs).departureDateTime;
    };

    SearchCriteria.prototype.isEarliestDepartureLatestReturnDateFlexibilityRequest = function () {
        return __.isDefined(this.earliestDepartureLatestReturnDatesFlexibility);
    };

    SearchCriteria.prototype.getEarliestDepartureDateTime = function () {
        return this.earliestDepartureLatestReturnDatesFlexibility && this.earliestDepartureLatestReturnDatesFlexibility.getEarliestDepartureDateTime();
    };

    SearchCriteria.prototype.getLatestReturnDateTime = function () {
        return this.earliestDepartureLatestReturnDatesFlexibility && this.earliestDepartureLatestReturnDatesFlexibility.getLatestReturnDateTime();
    };

    SearchCriteria.prototype.hasAnyDepartureDaysOfWeekDefined = function () {
        return this.earliestDepartureLatestReturnDatesFlexibility && _.contains(this.earliestDepartureLatestReturnDatesFlexibility.departureDaysOfWeek, true);
    };

    SearchCriteria.prototype.getDepartureDaysOfWeek = function () {
        if (this.hasAnyDepartureDaysOfWeekDefined()) {
            return this.earliestDepartureLatestReturnDatesFlexibility.departureDaysOfWeek;
        } else if (this.hasAnyDaysAtDestinationDefined()) {
            return this.dayIndexIntoWeekDaysArray(this.departureAndReturnDaysOfWeekIndexes().departureDayOfWeekIndex);
        }
    };

    SearchCriteria.prototype.hasAnyReturnDaysOfWeekDefined = function () {
        return this.earliestDepartureLatestReturnDatesFlexibility && _.contains(this.earliestDepartureLatestReturnDatesFlexibility.returnDaysOfWeek, true);
    };

    SearchCriteria.prototype.getReturnDaysOfWeek = function () {
        if (this.hasAnyReturnDaysOfWeekDefined()) {
            return this.earliestDepartureLatestReturnDatesFlexibility.returnDaysOfWeek;
        } else if (this.hasAnyDaysAtDestinationDefined()) {
            return this.dayIndexIntoWeekDaysArray(this.departureAndReturnDaysOfWeekIndexes().returnDayOfWeekIndex);
        }
    };

    /**
     * translate day of week index (for example 0, representing Sunday in US locale) into an array of booleans with this one day set to true
     * dayIndexIntoWeekDaysArray(0) returns [true, false, false, false, false, false, false]
     */
    SearchCriteria.prototype.dayIndexIntoWeekDaysArray = function(dayIndex) {
        var DAYS_IN_WEEK = 7;
        var selectedDaysOfWeekArray = [];
        for (var i = 0; i < DAYS_IN_WEEK; i++) {
            selectedDaysOfWeekArray.push(false);
        }
        selectedDaysOfWeekArray[dayIndex] = true;
        return selectedDaysOfWeekArray;
    };

    SearchCriteria.prototype.hasAnyDaysAtDestinationDefined = function () {
      return this.earliestDepartureLatestReturnDatesFlexibility
          && this.earliestDepartureLatestReturnDatesFlexibility.daysOfWeekAtDestination
          && this.earliestDepartureLatestReturnDatesFlexibility.daysOfWeekAtDestination.hasAnyDaysAtDestinationDefined();
    };

    SearchCriteria.prototype.departureAndReturnDaysOfWeekIndexes = function () {
        return this.earliestDepartureLatestReturnDatesFlexibility.daysOfWeekAtDestination.departureAndReturnDaysOfWeekIndexes();
    };

    SearchCriteria.prototype.getDepartureDateFrom = function () {
        if (this.isPlusMinusDaysDateFlexibilityRequest()) {
            var departureDateMinusFlexibilityDays = this.legs[0].departureDateTime && this.legs[0].departureDateTime.clone().subtract(this.dateFlexibilityDays.departureMinusDays, 'days');
        }
        return this.getEarliestDepartureDateTime() || departureDateMinusFlexibilityDays || this.legs[0].departureDateTime;
    };

    SearchCriteria.prototype.getDepartureDateTo = function () {
        if (this.isPlusMinusDaysDateFlexibilityRequest()) {
            var departureDatePlusFlexibilityDays =  this.legs[0].departureDateTime && this.legs[0].departureDateTime.clone().add(this.dateFlexibilityDays.departurePlusDays, 'days');
        }
        var latestReturnDateMinusLengthOfStay = this.getLatestReturnDateTime() && this.getLatestReturnDateTime().clone().subtract(this.getMinLengthOfStay(), 'days');
        return latestReturnDateMinusLengthOfStay || departureDatePlusFlexibilityDays || this.legs[0].departureDateTime;
    };

    SearchCriteria.prototype.getReturnDateFrom = function () {
        if (this.isPlusMinusDaysDateFlexibilityRequest()) {
            var returnDateMinusFlexibilityDays = this.legs[1].departureDateTime && this.legs[1].departureDateTime.clone().subtract(this.dateFlexibilityDays.returnMinusDays, 'days');
        }
        var earliestDepartureDatePlusLengthOfStay = this.getEarliestDepartureDateTime() && this.getEarliestDepartureDateTime().clone().add(this.getMinLengthOfStay(), 'days');
        return earliestDepartureDatePlusLengthOfStay || returnDateMinusFlexibilityDays || this.legs[1].departureDateTime;
    };

    SearchCriteria.prototype.getReturnDateTo = function () {
        if (this.isPlusMinusDaysDateFlexibilityRequest()) {
            var returnDatePlusFlexibilityDays =  this.legs[1].departureDateTime && this.legs[1].departureDateTime.clone().add(this.dateFlexibilityDays.returnPlusDays, 'days');
        }
        return this.getLatestReturnDateTime() || returnDatePlusFlexibilityDays || this.legs[1].departureDateTime;
    };

    /**
     * Static factory producing simple, minimal SearchCriteria for round trip travel  
     * @param origin 3 letter alphanumeric IATA airport or city code
     * @param destination
     * @param departureDateString
     * @param returnDateString
     * @returns {SearchCriteria}
     */
    SearchCriteria.prototype.buildRoundTripTravelSearchCriteria = function (origin, destination, departureDateString, returnDateString) {
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

        var searchCriteria = new SearchCriteria();
        searchCriteria.addLeg(firstLeg);
        searchCriteria.addLeg(secondLeg);

        searchCriteria.addPassenger('ADT', 1);

        return searchCriteria;
    };

    SearchCriteria.prototype.buildRoundTripTravelSearchCriteriaWithDateFlexibility = function (origin, destination, departureDateString, returnDateString, dateFlexibilityDays) {
        var searchCriteria = SearchCriteria.prototype.buildRoundTripTravelSearchCriteria(origin, destination, departureDateString, returnDateString);
        searchCriteria.dateFlexibilityDays = dateFlexibilityDays;
        return searchCriteria;
    };

    SearchCriteria.prototype.buildMultidestinationSearchCriteria = function (originDestinationPairs) {
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
    };

    SearchCriteria.prototype.generateAlternateDates = function (centralDate, plusMinusDays) {
        if (!this.isAlternateDatesRequest()) {
            return centralDate;
        }
        var alternateDates = [];
        var offsets = generateAltDatesOffsets(plusMinusDays);
        offsets.forEach(function (offset) {
            var alternateDate = centralDate.clone().add(offset, 'days');
            alternateDates.push(alternateDate);
        });
        if (!this.returnAlternateDatesOnly) {
            var centralDateInsertIndex = _.sortedIndex(alternateDates, centralDate, function (date) {
                return date.unix();
            });
            alternateDates.splice(centralDateInsertIndex, 0, centralDate);
        }
        return alternateDates;
    };

    function generateAltDatesOffsets(plusMinusDays) {
        var offsets = [];
        for (var i = -plusMinusDays.minusDays ; i <= plusMinusDays.plusDays; i++) {
            if (i===0) { //central date
                continue;
            }
            offsets.push(i);
        }
        return offsets;
    }

    return SearchCriteria;
});
