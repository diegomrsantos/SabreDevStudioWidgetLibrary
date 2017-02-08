define(['util/OrderInSequencePriceClassifier'], function (OrderInSequencePriceClassifier) {
    "use strict";
    describe('classifies correctly', function () {
        var classifier = new OrderInSequencePriceClassifier();
        classifier.train([100.1, 200, 100.1, 200, 500, 500, 100.1]);

        it('classfies correctly existing values', function () {
            expect(classifier.classifyIntoTier(100.1)).toBe(1);
            expect(classifier.classifyIntoTier(200)).toBe(2);
            expect(classifier.classifyIntoTier(500)).toBe(3);
        });
        it('unknown value, returns 0', function () {
            expect(classifier.classifyIntoTier(50)).toBe(0);
        });
    });
});