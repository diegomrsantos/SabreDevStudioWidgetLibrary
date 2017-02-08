define(['util/TiersPriceClassifier'], function (TiersPriceClassifier) {
    "use strict";
    describe('TiersPriceClassifier: classify unsorted input', function () {
        var classifier = new TiersPriceClassifier();
        const tiers = 3;
        classifier.train([10, 9, 8, 1, 2, 3, 4, 5, 6, 7]);
        it('classfies correctly existing values', function () {
            expect(classifier.classifyIntoTier(1, tiers)).toBe(1);
            expect(classifier.classifyIntoTier(2, tiers)).toBe(1);
            expect(classifier.classifyIntoTier(3, tiers)).toBe(1);

            expect(classifier.classifyIntoTier(4, tiers)).toBe(2);
            expect(classifier.classifyIntoTier(6, tiers)).toBe(2);

            expect(classifier.classifyIntoTier(7, tiers)).toBe(3);
            expect(classifier.classifyIntoTier(10, tiers)).toBe(3);
        });
        it('unknown value, throws exception', function () {
            expect(() => {classifier.classifyIntoTier(50, tiers)}).toThrow();
        });

    });

    describe('TiersPriceClassifier: classify input with duplicates', function () {
        var classifier = new TiersPriceClassifier();
        const tiers = 2;
        classifier.train([1, 2, 3, 4, 1, 2, 3, 4]);
        it('classfies correctly existing values', function () {
            expect(classifier.classifyIntoTier(1, tiers)).toBe(1);
            expect(classifier.classifyIntoTier(2, tiers)).toBe(1);

            expect(classifier.classifyIntoTier(3, tiers)).toBe(2);
            expect(classifier.classifyIntoTier(4, tiers)).toBe(2);
        });
    });

    describe('TiersPriceClassifier: boundary conditions tests', function () {

        it('empty training set', function () {
            var classifier = new TiersPriceClassifier();
            const tiers = 1;
            classifier.train([]);
            expect(() => {classifier.classifyIntoTier(50, tiers)}).toThrow();
        });

        it('more tiers than elements', function () {
            var classifier = new TiersPriceClassifier();
            classifier.train([100]);
            const tiers = 2;
            expect(() => {classifier.classifyIntoTier(1, tiers)}).toThrow();
        });

        it('one element', function () {
            var classifier = new TiersPriceClassifier();
            classifier.train([100]);
            const tiers = 1;
            expect(classifier.classifyIntoTier(100, tiers)).toBe(1);
        });
    });
});