define([
      'lodash'
    , 'util/ItinerariesDedupper'
], function (
      _
    , ItinerariesDedupper
) {
    "use strict";

    /**
     * @global
     * @classdesc
     * List of itineraries.
     * @class ItinerariesList
     * @constructor
     */
    function ItinerariesList() {
        this.itineraries = [];
    }

    /**
     * Returns list of itineraries that are <em>permitted</em>, that is are not filtered out (by applied itinerary list filtering functions).
     * @returns {Array}
     */
    ItinerariesList.prototype.getPermittedItineraries = function () {
        return _.reject(this.itineraries, 'filteredOut');
    };

    ItinerariesList.prototype.getItineraries = function () {
        return this.itineraries;
    };

    ItinerariesList.prototype.add = function (itin) {
        this.itineraries.push(itin);
    };

    ItinerariesList.prototype.addAll = function (itineraries) {
        itineraries.forEach((itin) => this.itineraries.push(itin));
    };

    /**
     * Adds passed itineraries list to this itineraries list. Just adds all new itineraries to the end of te current list.
     * @param itinerariesList
     * @returns {ItinerariesList}
     */
    ItinerariesList.prototype.addItinerariesList = function(itinerariesList) {
        var that = this;
        itinerariesList.getItineraries().forEach(function (itin) {
            that.add(itin);
        });
        return this;
    };

    /**
     * Adds passed itineraries list to this itineraries list performing deduplication of itineraries
     * @see dedupMerge
     * @param otherItinerariesList
     * @returns {ItinerariesList}
     */
    ItinerariesList.prototype.addItinerariesListWithDedup = function(otherItinerariesList) {
        var dedupper = new ItinerariesDedupper();
        var itinsDedupped = dedupper.dedupMerge(this.itineraries, otherItinerariesList.itineraries);
        this.itineraries = recalcIds(itinsDedupped);
        return this;
    };

    function recalcIds(itineraries) {
        return itineraries.map(function (itin, idx) {
            itin.id = idx;
            return itin;
        });
    }

    ItinerariesList.prototype.size = function () {
        return this.getPermittedItineraries().length;
    };

    ItinerariesList.prototype.getLeadPrice = function () {
        var minimumPriceItinerary = _.min(this.getPermittedItineraries(), 'totalFareAmount');
        return {
              price: minimumPriceItinerary.totalFareAmountWithCurrency.amount
            , currency: minimumPriceItinerary.totalFareAmountWithCurrency.currency
        };
    };

    ItinerariesList.prototype.getCheapestItinerary = function (sortCriteriaArray) {
        return _.first(_.sortByAll(this.getPermittedItineraries(), _.union(['totalFareAmount'], sortCriteriaArray)));
    };

    ItinerariesList.prototype.getShortestItinerary = function (sortCriteriaArray) {
        return _.first(_.sortByAll(this.getPermittedItineraries(), _.union(['duration'], sortCriteriaArray)));
    };

    /**
     * Applies the filtering function to the itineraries.
     * So that itinerary is NOT marked as filteredOut (not permitted), it must pass all the filters.
     * @param filteringFn
     */
    ItinerariesList.prototype.applyFilters = function (filteringFn) {
        this.getItineraries().forEach(function (itin) {
            itin.filteredOut = !filteringFn(itin);
        });
    };

    return ItinerariesList;
});