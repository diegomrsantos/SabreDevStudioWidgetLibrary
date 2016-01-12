define([
    'lodash'
    , 'util/LodashExtensions'
], function (
    _
    , __
) {
    "use strict";

    /**
     * @class Itinerary
     * @classdesc
     * Representation of Air Shopping Itinerary, that is a whole priced trip. Itinerary consists of all travel legs: for round trip travel outbound and inbound leg.
     * Legs consists of segments. One segment is equivalent to one flight.
     * Itinerary contains also all pricing information, such as total price and all taxes and other, price-related data, such as baggage allowance, number of seats remaining.
     * @constructor
     */
    function Itinerary() {
        this.legs = [];

        this.itineraryPricingInfo = undefined;

        // convenience property-style getters, used for filtering and sorting of itineraries list
        /**
         * Returns the sum of trip durations for all legs, in minutes.
         * This includes connection times on all legs (but does not include stopovers, in particular the stopover in the turnaround point at destination of round trip travel).
         */
        Object.defineProperty(this, 'duration', {
            get: function() {
                var duration = this.legs.reduce(function (total, leg) {
                    return total + leg.getDuration();
                }, 0);
                return duration;
            }
        });

        Object.defineProperty(this, 'outboundLegDuration', {
            get: function() {
                return __.first(this.legs).getDuration();
            }
        });

        Object.defineProperty(this, 'outboundDepartureDateTime', {
            get: function() {
                return this.getOutboundDepartureDateTime();
            }
        });

        Object.defineProperty(this, 'outboundArrivalDateTime', {
            get: function() {
                return this.getOutboundArrivalDateTime();
            }
        });

        Object.defineProperty(this, 'numberOfStops', {
            get: function() {
                return this.getNumberOfStops();
            }
        });

        Object.defineProperty(this, 'sumNumberOfStopsForAllLegs', {
            get: function() {
                return this.getSumNumberOfStopsForAllLegs();
            }
        });

        Object.defineProperty(this, 'totalFareAmountWithCurrency', {
            get: function() {
                return this.itineraryPricingInfo.fareAmounts.totalFare;
            }
        });

        Object.defineProperty(this, 'totalFareAmount', {
            get: function() {
                return this.itineraryPricingInfo.fareAmounts.totalFare.amount;
            }
        });

        Object.defineProperty(this, 'totalFareCurrency', {
            get: function() {
                return this.itineraryPricingInfo.fareAmounts.totalFare.currency;
            }
        });

        Object.defineProperty(this, 'baseFareAmount', {
            get: function() {
                return this.itineraryPricingInfo.fareAmounts.baseFare.amount;
            }
        });

        Object.defineProperty(this, 'baseFareCurrency', {
            get: function() {
                return this.itineraryPricingInfo.fareAmounts.baseFare.currency;
            }
        });

        Object.defineProperty(this, 'totalTaxAmount', {
            get: function() {
                return this.itineraryPricingInfo.fareAmounts.totalTax.amount;
            }
        });

        Object.defineProperty(this, 'totalTaxCurrency', {
            get: function() {
                return this.itineraryPricingInfo.fareAmounts.totalTax.currency;
            }
        });
    }

    /**
     * Adds leg to itinerary. Used in Shopping response parsers, while creating new Itinerary
     * @param leg
     */
    Itinerary.prototype.addLeg = function(leg) {
        this.legs.push(leg);
        this.updateLegsChangeOfAirportAtDeparture();
        this.updateLegsChangeOfAirportAtArrival();
    };

    /**
     * returns array with numbers of segments per leg. Array length is number of legs.
     * Needed for parsing FareInfos and matching the absolute (within whole itinerary) segment numbers into relative (within given leg) segment numbers
     *
     * Example return array: two legs, first leg has 2 flights, second leg has one flight:
     * [2, 1]
     */
    Itinerary.prototype.getLegsSegmentCounts = function () {
        return this.legs.map(function (leg) {
            return leg.segments.length;
        });
    };

    /**
     * Sets the hasAirportChangeAtDeparture flags on every leg. Used by parsers, while creating the itinerary.
     */
    Itinerary.prototype.updateLegsChangeOfAirportAtDeparture = function () {
        if (this.isOneWayTravel()) {
            return;
        }
        var that = this;
        this.legs.forEach(function (leg, idx, allLegs) {
            if (idx === 0) {
                leg.hasAirportChangeAtDeparture = !that.isTripDepartureAndReturnSameAirport();
            } else {
                leg.hasAirportChangeAtDeparture = leg.getLegDepartureAirport() !== allLegs[idx - 1].getLegArrivalAirport();
            }
        });
    };

    /**
     * USed by parsers while creating itinerary
     */
    Itinerary.prototype.updateLegsChangeOfAirportAtArrival = function () {
        if (this.isOneWayTravel()) {
            return;
        }
        var that = this;
        this.legs.forEach(function (leg, idx, allLegs) {
            if (that.isLastLeg(idx)) {
                leg.hasAirportChangeAtArrival = !that.isTripDepartureAndReturnSameAirport();
            } else {
                leg.hasAirportChangeAtArrival = leg.getLegArrivalAirport() !== allLegs[idx + 1].getLegDepartureAirport();
            }
        });
    };

    Itinerary.prototype.isLastLeg = function (legIdx) {
        return legIdx === (this.legs.length - 1);
    };

    /**
     * Returns the departure date time of the first flight of the first leg (so the departure date time of the first flight of the itinerary).
     */
    Itinerary.prototype.getOutboundDepartureDateTime =  function() {
        var outboundLeg = __.first(this.legs);
        return __.first(outboundLeg.segments).departureDateTime;
    };

    /**
     * Returns arrival date time of the <b>last</b> flight of the first leg.
     * So in case of round trip travel the date and time that you arrive at the destination.
     */
    Itinerary.prototype.getOutboundArrivalDateTime =  function() {
        var outboundLeg = __.first(this.legs);
        return __.last(outboundLeg.segments).arrivalDateTime;
    };

    /**
     * Returns date time of the <b>first</b> flight of the inbound (return) leg.
     * So in case of round trip travel the date and time of the first flight of the return travel.
     */
    Itinerary.prototype.getInboundDepartureDateTime =  function() {
        var inboundLeg = __.last(this.legs);
        return __.first(inboundLeg.segments).arrivalDateTime;
    };

    /**
     * Returns date time of the last flight of the last itinerary leg. So the last flight in the whole travel.
     */
    Itinerary.prototype.getInboundArrivalDateTime =  function() {
        var inboundLeg = __.last(this.legs);
        return __.last(inboundLeg.segments).arrivalDateTime;
    };

    /**
     * Returns the greatest of all the numbers of stops (connections) on all legs.
     * For example, for round-trip (2 legs) travel, when number of connections on outbound leg is 1 and number of connection on inbound leg is 2, then it returns 2. So the travel is treated as 2-stops travel
     * @returns {*}
     */
    Itinerary.prototype.getNumberOfStops = function() {
        return __.max(this.legs.map(function (leg) {
            return leg.getNumberOfStops();
        }));
    };

    /**
     * Returns total number of connections for all legs.
     * For example, for round-trip (2 legs) travel, when number of connections on outbound leg is 1 and number of connection on inbound leg is 2, then it returns 3.
     * The turnaround point (destination in case of round trip travel) is not counted.
     * @returns {*}
     */
    Itinerary.prototype.getSumNumberOfStopsForAllLegs = function () {
        return this.legs.reduce(function (total, leg) {
            return total + leg.getNumberOfStops();
        }, 0);
    };

    Itinerary.prototype.getFirstLeg = function () {
      return __.first(this.legs);
    };

    Itinerary.prototype.getFirstMarketingAirline = function() {
        return this.legs[0].segments[0].marketingAirline;
    };

    /**
     * returns unique list of all marketing airlines, in the order as they first appear in the itinerary.
     * @returns {Array|*}
     */
    Itinerary.prototype.getAllMarketingAirlines = function() {
        // WARN: performance optimisation, assuming Itinerary object is not changed after creation (and adding all legs in the beginning)
        if (_.isUndefined(this.allMktAirlines)) {
            var allMktAirlines = [];
            this.legs.forEach(function (leg) {
                __.pushAll(allMktAirlines, leg.getAllMarketingAirlines());
            });
            this.allMktAirlines = __.uniq(allMktAirlines);
        }
        return this.allMktAirlines;
    };

    /**
     * Returns deduplicated list of all the connection airports of the itinerary.
     * The turnaround point (destination in case of round trip) is not included.
     *
     * For example for the itinerary:
     * outbound: LEJ-FRA-NYC-DFW
     * inbound: DFW-FRA-LEJ
     * it will return [FRA, NYC]
     *
     * This method may be used for presenting all connection airports, or getting all connection airports for filtering itineraries by acceptable connection airports
     * @returns {Array}
     * @memberof Itinerary
     */
    Itinerary.prototype.getConnectionAirports = function () {
        var legsConnectionAirportsLists = this.legs.map(function (leg) {
            return leg.getConnectionAirports();
        });
        return __.union(__.flatten(legsConnectionAirportsLists));
    };

    Itinerary.prototype.getTripDepartureAirport = function () {
        return __.first(this.legs).getLegDepartureAirport();
    };

    Itinerary.prototype.getTripArrivalAirport= function () {
        return __.last(this.legs).getLegArrivalAirport();
    };

    Itinerary.prototype.getFirstLegArrivalAirport = function () {
        return __.first(this.legs).getLegArrivalAirport();
    };

    /**
     * Returns true if trip departure airport is the same as arrival airport.
     * For one-way travel will return false
     * For round trip travel, will return true if return airport is the same as the airport we departed from.
     * For round trip travel, returns false if we return to the airport other the very one we started the travel from (which may be the case for multi-airport cities like LON and LHR and LTN).
     * @returns {boolean}
     */
    Itinerary.prototype.isTripDepartureAndReturnSameAirport = function () {
        return this.getTripDepartureAirport() === this.getTripArrivalAirport();
    };

    /**
     * For complex travel (any non one-way travel: round trip, multidestination), returns true if departure and arrival airports are not the same.
     * Useful to warn the customer that the trip return airport is not the same as trip departure airport.
     * @returns {boolean}
     */
    Itinerary.prototype.departureAndArrivalDifferentForComplexTravel = function () {
        if (this.isOneWayTravel()) {
            return;
        }
        return !this.isTripDepartureAndReturnSameAirport();
    };

    Itinerary.prototype.isOneWayTravel = function () {
        return (this.legs.length === 1);
    };

    /**
     * Definition of the stopover:
     * For the typical round trip travel a stopover means the destination airport.
     * For multi-destination travel there is a stopover for every destination (excluding trip origin and return airports).
     * In very rare cases, there might be a stopover in the course of one requested leg: like in case Shopping with Long Connections, when customer accepts lower price for having to stay unusually long at a connection airport.
     * The difference between the stopover and connection is the time as the connection airport/city:
     *  - for Domestic travel (wholly within US, CA) it is 4 hours (over 4 hours it is called stopover)
     *  - for International travel (any single airport is outside of US, including also travel wholly outside of US) it is 24 hours.
     * @returns {boolean|*}
     */
    Itinerary.prototype.hasChangeOfAirportsAtAnyStopover = function () {
        // WARN: performance optimisation, assuming Itinerary object is not changed after creation (and adding all legs in the beginning)
        if (this.isOneWayTravel()) {
            return;
        }
        if (_.isUndefined(this.hasChangeOfAirportsAtAnyStopoverIndicator)) {
            this.hasChangeOfAirportsAtAnyStopoverIndicator = this.legs.some(function (leg, idx, allLegs) {
                return (((idx === 0) && (leg.hasAirportChangeAtArrival)) || // first leg
                     (((idx > 0) && (idx < (allLegs.length - 1))) && (leg.hasAirportChangeAtDeparture || leg.hasAirportChangeAtArrival)) || // middle legs
                     ((idx > 0) && (leg.hasAirportChangeAtDeparture))); // last leg
            });
        }
        return this.hasChangeOfAirportsAtAnyStopoverIndicator;
    };

    /**
     * Returns the alphanumeric string that identifies the specific Sabre Shopping engine that produced the itinerary.
     * Not shown to the customer, may be used in internal diagnostic, troubleshooting, monitoring.
     */
    Itinerary.prototype.getPricingSource = function () {
      return this.pricingSource;
    };

    /**
     * Returns string describing the flight structure of the travel: all flight related information (departure, arrival ,connection airports, all flight numbers), but without any price-related information.
     * Might be useful for deduplicating itineraries from different Sabre systems.
     * @returns {string}
     */
    Itinerary.prototype.getFlightStructure = function() {
        return this.legs.map(function (leg) {
            return leg.getFlightStructure();
        }).join(' ||| ');
    };

    /**
     * Returns true if there is at least one <em>red-eye</em> flight in the itinerary.
     * <em>red-eye</em> flight is the one operated at night, typically at least several hours.
     * @returns {boolean|*}
     * @memberof Itinerary
     */
    Itinerary.prototype.hasRedEyeFlight = function () {
        // WARN: performance optimisation, assuming Itinerary object is not changed after creation (all legs are added after object creation, and before querying this hasRedEyeFlight property)
        if (_.isUndefined(this.hasRedEyeFlightIndicator)) {
            this.hasRedEyeFlightIndicator = this.legs.some(function (leg) {
                return leg.hasRedEyeFlight();
            });
        }
        return this.hasRedEyeFlightIndicator;
    };

    /**
     * Returns true if there is any <em>short</em> connection in the itinerary.
     * The definition of short connection is very arbitrary, @see {@link Leg.hasShortConnection}.
     *
     * May be used to warn the customer that the returned itinerary has short connection time at any airport.
     * @returns {boolean}
     */
    Itinerary.prototype.hasShortConnection = function () {
        return this.legs.some(function (leg) {
            return leg.hasShortConnection();
        });
    };

    /**
     * Returns true if there is any <em>long</em> connection in the itinerary.
     * The definition of long connection is very arbitrary, @see {@link Leg.hasLongConnection}.
     *
     * May be used to warn the customer that the returned itinerary has long waiting time at any airport.
     * @returns {boolean}
     */
    Itinerary.prototype.hasLongConnection = function () {
        return this.legs.some(function (leg) {
            return leg.hasLongConnection();
        });
    };

    /**
     * Returns number of seats left to be bought in the given (whole) itinerary at the presented price (and its conditions).
     * May be used to inform the customer if the offer is (wide) available or the seats are bought out fast.
     * Especially useful for warning on the last seats available. @see hasLowSeatsRemaining.
     * @param legIdx
     * @param segmentIdx
     * @returns {*}
     */
    Itinerary.prototype.getSeatsRemaining = function (legIdx, segmentIdx) {
        return this.itineraryPricingInfo.getSeatsRemaining(legIdx, segmentIdx);
    };

    Itinerary.prototype.hasLowSeatsRemaining = function () {
        return this.itineraryPricingInfo.hasLowSeatsRemaining();
    };

    Itinerary.prototype.getCabin = function (legIdx, segmentIdx) {
        return this.itineraryPricingInfo.getCabin(legIdx, segmentIdx);
    };

    Itinerary.prototype.getMeals = function (legIdx, segmentIdx) {
        return this.itineraryPricingInfo.getMeals(legIdx, segmentIdx);
    };

    Itinerary.prototype.getBaggageAllowance = function (legIdx, segmentIdx) {
        return this.itineraryPricingInfo.getBaggageAllowance(legIdx, segmentIdx);
    };

    return Itinerary;
});
