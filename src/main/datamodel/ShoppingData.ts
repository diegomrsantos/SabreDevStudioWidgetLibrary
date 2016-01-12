define([
      'moment'
    , 'datamodel/ItinerariesList'
    , 'util/LodashExtensions'
], function (
      moment
    , ItinerariesList,
      _
) {
    "use strict";

    /**
     * The goal for this container is to provide a caching service for any calendar type searches.
     * While searching for the same search criteria (apart from the searched range itself), you can use this container to accumulate searched itineraries, and then reuse them when search is done within the search ranges done previously.
     * If you do not need such complex caching behaviour, remove use of this class from its client (and possibly use any other simpler mechanism, like CachingDecorator from sabreDevStudioWebServices module.
     */
    function ShoppingData() {

        this.data = {};

        this.maxAvailableDates = {};

        this.minDateAndPricePairs = {};
    }

    /* In all this object we use string representation of moment date objects for month and day key.
       In order not to depend on moment.js internal date format used in toString(),
       the this object prototype internal fixed format is defined and used to create string keys from moment objects. */
    ShoppingData.prototype.DATE_FORMAT_FOR_KEYS = 'YYYY-MM-DD';

    ShoppingData.prototype.updateMaxAvailableDate = function (key, newDate) {
        var currentMaxAvailableDate = this.maxAvailableDates[key];
        if (_.isUndefined(currentMaxAvailableDate) || newDate.isAfter(currentMaxAvailableDate)) {
            this.maxAvailableDates[key] = newDate;
        }
    };

    ShoppingData.prototype.updateMinDateAndPricePair = function (key, candidateDate, candidateTotalFareAmountWithCurrency) {
        var currentMinDateAndPricePair = this.minDateAndPricePairs[key];
        if (currentMinDateAndPricePair && currentMinDateAndPricePair.totalFareAmountWithCurrency.currency && (candidateTotalFareAmountWithCurrency.currency !== currentMinDateAndPricePair.totalFareAmountWithCurrency.currency)) {
            throw new Error('Unable to update minimum price as currencies different');
        }
        if (_.isUndefined(currentMinDateAndPricePair)
            || ((candidateTotalFareAmountWithCurrency.amount <= currentMinDateAndPricePair.totalFareAmountWithCurrency.amount) && (candidateDate.isBefore(currentMinDateAndPricePair.date)))) { // prefer more close dates when two dates have same price
            this.minDateAndPricePairs[key] = {
                  date: candidateDate
                , totalFareAmountWithCurrency: candidateTotalFareAmountWithCurrency
            };
        }
    };

    /* if there is entry for given month, then data had been already requested (from web service) for this month.
    * It is to remember that call was made, there was no results, so not point to call web service again
     * This function is called client code feeding this object, before or after adding the actual, found, shopping data
    **/
    ShoppingData.prototype.markRequestedData = function(key, startDate, endDate) {
        var that = this;
        //the prices object primary keys are 1st days of all months. To have the range iteration include also 1st of startDate, we have to move start date to beginning of month
        moment().range(startDate.clone().startOf('month'), endDate).by('months', function (month) {
            var monthKey = month.format(this.DATE_FORMAT_FOR_KEYS);
            that.initKeyEntries(that.data, key, monthKey);
        });
    };

    ShoppingData.prototype.contains = function(key, month) {
        var monthKey = month.format(this.DATE_FORMAT_FOR_KEYS);
        return (_.has(this.data, key) && _.has(this.data[key], [monthKey]));
    };

    // merges new shopping data (the same type of object) into the current object.
    // if there are data under the same keys (days), then new data override old data: meaning all new itineraries will override all old ones (no old one will remain)
    ShoppingData.prototype.addUpdate = function(newData) {
        var that = this;
        _.each(newData.data, function (dataForKey, key) {
            if(_.isUndefined(dataForKey)) {
                return;
            }
            _.each(dataForKey, function (monthData, monthKey) {
                that.initKeyEntries(that.data, key, monthKey);
                that.addUpdateForMonth(key, monthData);
            });
            that.updateLeadPrices(key);
        });
    };

    ShoppingData.prototype.addUpdateForMonth = function(key, addedMonthData) {
        var that = this;
        if (_.isUndefined(addedMonthData)) {
            return;
        }
        _.each(addedMonthData, function (dayData, day) {
            if (_.isUndefined(dayData)) {
               return;
            }
            _.each(dayData.itinerariesList.getItineraries(), function (itin) {
                that.addItinerary(key, itin, moment(day, that.DATE_FORMAT_FOR_KEYS));
            });
        });
    };

    ShoppingData.prototype.addItinerary = function (key, itinerary, date) {
        var monthKey = date.clone().startOf('month').format(this.DATE_FORMAT_FOR_KEYS);
        var dayKey = date.clone().startOf('day').format(this.DATE_FORMAT_FOR_KEYS);
        this.initKeyEntries(this.data, key, monthKey, dayKey);

        this.data[key][monthKey][dayKey].itinerariesList.add(itinerary);
        this.updateMaxAvailableDate(key, date);
        this.updateMinDateAndPricePair(key, date, itinerary.totalFareAmountWithCurrency);
    };

    ShoppingData.prototype.getItinerariesList = function (key, day) {
        var monthKey = day.clone().startOf('month').format(this.DATE_FORMAT_FOR_KEYS);
        var dayKey = day.format(this.DATE_FORMAT_FOR_KEYS);
        if (_.has(this.data, key) && _.has(this.data[key], [monthKey]) && _.has(this.data[key][monthKey], [dayKey])) {
            return this.data[key][monthKey][dayKey].itinerariesList;
        }
    };

    ShoppingData.prototype.getLeadPricesForMonth = function (key, month) {
        var leadPrices = {};
        var that = this;
        var monthKey = month.format(this.DATE_FORMAT_FOR_KEYS);
        if (_.has(this.data, key) && _.has(this.data[key], [monthKey])) {
            Object.keys(this.data[key][monthKey]).forEach(function (dayKey) {
                leadPrices[dayKey] = that.data[key][monthKey][dayKey].leadPrice;
            });
        }
        return leadPrices;
    };

    ShoppingData.prototype.getLeadPricesForRange = function (key, rangeStartDate, rangeEndDate) {
        var leadPrices = {};
        var that = this;
        moment.range(rangeStartDate, rangeEndDate).by('days', function (day) {
            var dayLeadPrice = that.getLeadPriceForDay(key, day);
            _.extend(leadPrices, dayLeadPrice);
        });
        return leadPrices;
    };

    ShoppingData.prototype.getLeadPriceForDay = function (key, day) {
        var dayLeadPrice = {};
        var monthKey = day.clone().startOf('month').format(this.DATE_FORMAT_FOR_KEYS);
        var dayKey = day.format(this.DATE_FORMAT_FOR_KEYS);
        if (_.isUndefined(this.data[key]) || _.isUndefined(this.data[key][monthKey]) || _.isUndefined(this.data[key][monthKey][dayKey])) {
            return {};
        }
        dayLeadPrice[day.format(this.DATE_FORMAT_FOR_KEYS)] = this.data[key][monthKey][dayKey].leadPrice;
        return dayLeadPrice;
    };

    ShoppingData.prototype.getMonthLeadPrice = function (key, month) {
        return _.min(_.values(this.getLeadPricesForMonth(key, month)));
    };

    ShoppingData.prototype.getMinDateAndPricePair = function (key) {
        return this.minDateAndPricePairs[key];
    };

    ShoppingData.prototype.getMaxAvailableDate = function (key) {
        return this.maxAvailableDates[key];
    };

    /**
     * iterates all data months and finds lead price for each day of each month
     */
    ShoppingData.prototype.updateLeadPrices = function (key) {
        if (!_.has(this.data, key)) {
            return;
        }
        _.each(this.data[key], function (monthData) {
            if (_.isUndefined(monthData)) {
                return;
            }
            _.each(monthData, function (dayData, dayKey) {
                var leadPrice = dayData.itinerariesList.getLeadPrice();
                monthData[dayKey].leadPrice = leadPrice;
            });
        });
    };

    ShoppingData.prototype.initKeyEntries = function(data, key, monthKey, dayKey) {
        if (_.isUndefined(data)) {
            this.data = {};
        }
        if (!this.data[key]) {
            this.data[key] = {};
        }
        if (!this.data[key][monthKey]) {
            this.data[key][monthKey] = {};
        }
        if (dayKey && !this.data[key][monthKey][dayKey]) {
            this.data[key][monthKey][dayKey] = {
                itinerariesList: new ItinerariesList()
            };
        }
    };

    return ShoppingData;
});