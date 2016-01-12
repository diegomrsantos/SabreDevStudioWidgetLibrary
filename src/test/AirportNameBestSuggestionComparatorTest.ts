define(['widgets/searchForm/AirportNameBestSuggestionComparator'], function (Comparator) {
    "use strict";

    describe('autocomplete best suggestions', function () {

        it('full matching 3 letter airport IATA airport code always wins', function () {
            var comparator = new Comparator('KRK');
            var first = {
                fullName: "Krakow (KRK)",
                airportCode: "KRK"
            };
            var second = {
                fullName: "Akron (AKO)",
                airportCode: "AKO"
            };
            expect(comparator(first, second)).toBeGreaterThan(0);
        });

        it('prefer start of line matches over other position matches', function () {
            var comparator = new Comparator('KRAKOW');
            var startOfLineMatch = {
                fullName: "KRAKOW (XXX)",
                airportCode: "XXX"
            };
            var inLineMatch = {
                fullName: "xxxxKRAKOWxxxxx (XXX)",
                airportCode: "XXX"
            };
            expect(comparator(startOfLineMatch, inLineMatch)).toBeGreaterThan(0);
        });

        it('prefer start of line matches over other position matches ignore case', function () {
            var comparatorDifferentCase = new Comparator('Krakow');
            var startOfLineMatch = {
                fullName: "KRAKOW (XXX)",
                airportCode: "XXX"
            };
            var inLineMatch = {
                fullName: "xxxxKRAKOWxxxxx (XXX)",
                airportCode: "XXX"
            };
            expect(comparatorDifferentCase(startOfLineMatch, inLineMatch)).toBeGreaterThan(0);
        });

    });

    describe('autocomplete best suggestions use in sort sample suggestions array', function () {
        it('user starts typing full name', function () {
            var array = [
            {
                fullName: "Paso Delos Libres (AOL)",
                airportCode: "AOL"
            },
            {
                fullName: "Klosters (ZHS)",
                airportCode: "ZHS"
            },
            {
                fullName: "Los Angeles (LAX)",
                airportCode: "LAX"
            },
            {
                fullName: "Volos (VOL)",
                airportCode: "VOL"
            }
            ];

            var comparator = new Comparator("Los");

            array.sort(comparator);

            expect(array[array.length - 1].airportCode).toBe('LAX');
        });
    });
});