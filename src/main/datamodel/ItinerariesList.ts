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
        this.itineraries = dedupper.dedupMerge(this.itineraries, otherItinerariesList.itineraries);
        return this;
    };

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

    ItinerariesList.prototype.getCheapestItinerary = function () {
        return _.min(this.getPermittedItineraries(), 'totalFareAmount');
    };

    ItinerariesList.prototype.getShortestItinerary = function () {
        return _.min(this.getPermittedItineraries(), 'duration');
    };

    /**
     * Applies the array of filtering functions (filters) to the itineraries.
     * So that itinerary is NOT marked as filteredOut (not permitted), it must pass all the filters.
     * @param filteringFunctions
     */
    ItinerariesList.prototype.applyFilters = function (filteringFunctions) {
        this.getItineraries().forEach(function (itin) {
            itin.filteredOut = !filteringFunctions.every(function (filteringFunction) {
                return filteringFunction(itin);
            });
        });
    };

    return ItinerariesList;
});