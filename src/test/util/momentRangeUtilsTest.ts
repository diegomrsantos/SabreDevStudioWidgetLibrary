define(['moment', 'util/momentRangeUtils'], function (moment, momentRangeUtils) {
    'use strict';

    describe('generateAdjacentMonths', function () {
        var centralMonth = moment({year: 2015, month: 5}); // June

        it('if one more month needed then add it to the right', function () {
            var adjacentMonths = moment.generateAdjacentMonths(centralMonth, 1);
            expect(adjacentMonths.start).toEqual(centralMonth);
            expect(adjacentMonths.end).toEqual(centralMonth.clone().add(1, 'month'));
        });

        it('if two more months needed then add one to the right and one to the left', function () {
            var adjacentMonths = moment.generateAdjacentMonths(centralMonth, 2);
            expect(adjacentMonths.start).toEqual(centralMonth.clone().subtract(1, 'month'));
            expect(adjacentMonths.end).toEqual(centralMonth.clone().add(1, 'month'));
        });

        it('5 adjacent months: 2 to left and 3 to the right', function () {
            var adjacentMonths = moment.generateAdjacentMonths(centralMonth, 5);
            expect(adjacentMonths.start).toEqual(centralMonth.clone().subtract(2, 'month'));
            expect(adjacentMonths.end).toEqual(centralMonth.clone().add(3, 'month'));
        });

    });
});