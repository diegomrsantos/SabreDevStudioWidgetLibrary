define([],
    function () {
        'use strict';

        /**
         * @global
         * @classdesc
         * Represents one flight in the journey. Segment equals flight.
         * @class Segment
         * @constructor
         */
        function Segment(segmentDescriptorObj) {
            this.departureAirport = segmentDescriptorObj.departureAirport;
            this.departureDateTime = segmentDescriptorObj.departureDateTime;
            this.arrivalAirport = segmentDescriptorObj.arrivalAirport;
            this.arrivalDateTime = segmentDescriptorObj.arrivalDateTime;
            this.elapsedTime = segmentDescriptorObj.elapsedTime;
            this.equipment = segmentDescriptorObj.equipment;
            this.marketingFlightNumber = segmentDescriptorObj.marketingFlightNumber;
            this.marketingAirline = segmentDescriptorObj.marketingAirline;
            this.operatingFlightNumber = segmentDescriptorObj.operatingFlightNumber;
            this.operatingAirline = segmentDescriptorObj.operatingAirline;
        }


        Segment.prototype.getFlightStructure = function () {
            return [this.departureDateTime.format(), this.departureAirport, this.arrivalDateTime, this.arrivalAirport, this.cabin, this.marketingAirline, this.marketingFlightNumber, this.operatingAirline, this.operatingFlightNumber].join('|');
        };

        /**
         * Returns indicator that a flight is a <em>red-eye</em> flight.
         * @see {@link Itinerary.hasRedEyeFlight}
         * @returns {*}
         */
        Segment.prototype.isRedEyeFlight = function () {
            return this.flightTimeCrossesMidnight();
        }

        Segment.prototype.flightTimeCrossesMidnight = function () {
            var firstMidnight = this.departureDateTime.clone().endOf('day');
            return this.arrivalDateTime.isAfter(firstMidnight); // WARN timezone changes!! flight times in local time
        };

        Segment.prototype.equals = function (other) {
            return this.departureAirport === other.departureAirport
                && this.departureDateTime.isSame(other.departureDateTime)
                && this.arrivalAirport === other.arrivalAirport
                && this.arrivalDateTime.isSame(other.arrivalDateTime)
                && this.elapsedTime === other.elapsedTime
                && this.equipment === other.equipment
                && this.marketingFlightNumber === other.marketingFlightNumber
                && this.marketingAirline === other.marketingAirline
                && this.operatingFlightNumber === other.operatingFlightNumber
                && this.operatingAirline === other.operatingAirline;
        };

        return Segment;
    });