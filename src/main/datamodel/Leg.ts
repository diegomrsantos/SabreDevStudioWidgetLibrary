define([
          'lodash'
        , 'moment'
    ],
    function (
          _
        , moment
    ) {
        'use strict';

        /**
         * @global
         * @classdesc
         * Represents journey leg, that is part of travel between stopovers.
         * For one-way travel there is one leg.
         * Round trip travel has 2 legs.
         * Multi-destination travel has more than 2 legs.
         *
         * Leg consists of segments, which are equal to particular flights.
         * @class Leg
         * @constructor
         */
        function Leg() {
            this.segments = [];
        }

        /**
         * Used by shopping response parsers, creating itinerary legs
         * @memberof Leg
         * @param segment
         */
        Leg.prototype.addSegment = function(segment) {
            this.segments.push(segment);
        };

        /**
         * returns departure (origin) for the whole leg: that is the departure airport of the first segment of the leg
         */
        Leg.prototype.getLegDepartureAirport = function() {
            return _.first(this.segments).departureAirport;
        };

        /**
         * returns arrival (destination) airport for the whole leg: the arrival airport of the last segment of the leg
         */
        Leg.prototype.getLegArrivalAirport = function() {
            return _.last(this.segments).arrivalAirport;
        };

        Leg.prototype.getLegDepartureDateTime = function () {
            return _.first(this.segments).departureDateTime;
        };

        Leg.prototype.getLegArrivalDateTime = function () {
            return _.last(this.segments).arrivalDateTime;
        };

        /**
         * Returns number of connections (stops) in this leg
         * @returns {number}
         */
        Leg.prototype.getNumberOfStops = function() {
            return this.segments.length - 1;
        };

        /**
         * Returns leg duration, that is the duration from the leg's first flight departure time till its last flight arrival time (so all flight times plus all connection times).
         * Returned value is in minutes
         * @returns {Leg.duration|*}
         */
        Leg.prototype.getDuration = function () {
            return this.duration;
        };

        Leg.prototype.getFirstFlightMarketingAirline = function () {
            return _.first(this.segments).marketingAirline;
        };

        /**
         * Returns unique list of all marketing airlines, in the order as they first appear in leg
         * @returns {Array}
         */
        Leg.prototype.getAllMarketingAirlines = function() {
            var allMktAirlines = [];
            this.segments.forEach(function (segment) {
                allMktAirlines.push(segment.marketingAirline);
            });
            return _.uniq(allMktAirlines);
        };

        /**
         * Returns true if leg has at least one connection (stop)
         * @returns {boolean}
         */
        Leg.prototype.hasConnection = function () {
          return this.segments.length > 1;
        };

        /**
         * Returns all connection airports of the leg.
         * The very end of the leg (turnaround point for round trip travel) is not included.
         * @returns {Array}
         */
        Leg.prototype.getConnectionAirports = function () {
            if (!this.hasConnection()) {
                return [];
            }
            // as we will consider arrival airport for every flight, we skip the arrival of the last flight within the leg, as it is not connection but end of leg (stopover)
            var allFlightsWithoutLastOne = _.initial(this.segments);
            return allFlightsWithoutLastOne.map(function (flight) {
                return flight.arrivalAirport;
            });
        };

        /**
         * Returns connection time in milliseconds after the specific flight (to the next flight).
         * @param connectionPrecedingFlightIndex flight (segment) index of the flight preceding the connection
         * @returns {*|!number} milliseconds
         */
        Leg.prototype.getConnectionTimeMillis = function(connectionPrecedingFlightIndex) {
            if (this.hasConnection() && connectionPrecedingFlightIndex < (this.segments.length - 1)) { //all segments but not the last one
                var thisFlightArrival = this.segments[connectionPrecedingFlightIndex].arrivalDateTime;
                var nextFlightDeparture = this.segments[connectionPrecedingFlightIndex + 1].departureDateTime;
                var connectionTimeMillis = nextFlightDeparture.diff(thisFlightArrival);
                return connectionTimeMillis;
            }
        };

        /**
         * Returns connection time as moment.js duration.
         * @param segmentIdx
         * @returns {*}
         */
        Leg.prototype.getConnectionTime = function(segmentIdx) {
            return moment.duration(this.getConnectionTimeMillis(segmentIdx));
        };

        /**
         * Returns connection time in minutes.
         * @param segmentIdx
         * @returns {number}
         */
        Leg.prototype.getConnectionTimeMinutes = function(segmentIdx) {
            // perf optimisation: utility func to avoid formatting in the view
            return this.getConnectionTimeMillis(segmentIdx) / 1000 / 60;
        };

        /**
         * @see {@link Itinerary.getFlightStructure}
         * @returns {string}
         * @memberof Leg
         */
        Leg.prototype.getFlightStructure = function () {
            return this.segments.map(function (segment) {
                return segment.getFlightStructure();
            }).join('||');
        };

        /**
         * @see {@link Itinerary.hasRedEyeFlight}
         * @returns {boolean}
         */
        Leg.prototype.hasRedEyeFlight = function () {
            return this.segments.some(function (segment) {
                return segment.isRedEyeFlight();
            });
        };

        /**
         * Returns indicator that there is long waiting time on any connection airport.
         * The amount of time to define connection <em>long</em> is arbitrary.
         * @returns {boolean}
         */
        Leg.prototype.hasLongConnection = function () {
            var LONG_CONNECTION_MIN_MINUTES = 300;
            var that = this;
            return this.segments.some(function (segment, segmentIdx) {
                return (that.getConnectionTimeMinutes(segmentIdx) >=  LONG_CONNECTION_MIN_MINUTES);
            });
        };

        /**
         * Returns indicator that warns customer that they need to hurry up at some connection airport.
         * WARN: this is very dependent on airport layout, whether both gates are in the same terminal, whether visa formalities need to be done (like at US gateway), flight delays
         * @returns {boolean}
         */
        Leg.prototype.hasShortConnection = function () {
            var SHORT_CONNECTION_MIN_MINUTES = 60;
            var that = this;
            return this.segments.some(function (segment, segmentIdx) {
                return (that.getConnectionTimeMinutes(segmentIdx) <=  SHORT_CONNECTION_MIN_MINUTES);
            });
        };

        return Leg;
    });
