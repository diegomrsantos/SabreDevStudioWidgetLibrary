xdescribe('Lead Price Widget working with Search Form: ', function() {

    var originInputField;
    var destinationInputField;
    var departureDateField;
    var returnDateField;
    var searchButton;

    beforeEach(function() {
        browser.get('SearchForm.html');
        originInputField = element(by.model('Origin'));
        destinationInputField = element(by.model('Destination'));
        departureDateField = element(by.model('DepartureDate'));
        returnDateField = element(by.model('ReturnDate'));
        searchButton = element(by.buttonText('Search'));
    });

    xit('Search form presented', function() {
       expect(originInputField).toBeDefined();
       expect(destinationInputField).toBeDefined();
       expect(searchButton).toBeDefined();
    });

    it('lead price chart shown on triggering new search', function (done) {
        var searchCriteria = {
              departure: "LAX"
            , arrival: "DFW"
            , departureDate: "2015-01-01"
            , returnDate: "2015-02-01"
        };

        originInputField.sendKeys(searchCriteria.departure);
        destinationInputField.sendKeys(searchCriteria.arrival);
        departureDateField.sendKeys(searchCriteria.departureDate);
        returnDateField.sendKeys(searchCriteria.returnDate);

        searchButton.click();
        browser.isElementPresent(by.css('.SDSLeadPriceWidget')).then(function () { //TODO ugly, non NG way
            console.log("FOUND");
            verifyLeadPriceWidgetDisplayed();
            verifyHeaderAndSummaryUpdated(searchCriteria);
            done();
        });
            //

        //    verifyHeaderAndSummaryUpdated(searchCriteria);
        //    console.log("COMPLETE");
        //    verifyBarChartIsDisplayed();
        //    console.log("COMPLETE");
        //    verifyPrevLinkActive(false);
        //    verifyNextLinkActive(true);
        //    done();
        //}, function (reason) {
        //    fail("asynchronous action after click has not completed successfully. Reason: " + reason);
        //});
    });

    function verifyLeadPriceWidgetDisplayed() {
        var leadPriceWidget = element(by.css('.SDSLeadPriceWidget')); //TODO more classes
        expect(leadPriceWidget.isPresent()).toBeTruthy();
    }

    function verifyHeaderAndSummaryUpdated(searchCriteria) {
        console.log("before: " + searchCriteria.departure);
        //expect(element(by.binding('departureAirport'))).toBe(searchCriteria.departure);
        console.log("before 2 : " + searchCriteria.departure);
        //TODO: protractor hangs on selecting, both by css class or by binding
        expect(element(by.css('.SDSDepartureAirport'))).toBe(searchCriteria.departure);
        //expect(element(by.css('.SDSPrevLink')).isPresent()).toBeTruthy();
        console.log("after");
        expect(element(by.className('SDSArrivalAirport'))).toBe(searchCriteria.arrival);

        //expect(element(by.binding('minDateAndPricePair.totalFareAmount'))).toBeGreaterThan(0);
        //expect(element(by.binding('minDateAndPricePair.date'))).toBeDefined();
    }

    function verifyBarChartIsDisplayed() {
        //todo
    }

    function verifyPrevLinkActive(isActive) {
        var prevLink = element(by.css('SDSPrevLink'));
        if (isActive) {
            expect(prevLink).not.toHaveClass('SDSInactive');
        } else {
            expect(prevLink).toHaveClass('SDSInactive');
        }
    }

    function verifyNextLinkActive(isActive) {
        var nextLink = element(by.css('SDSNextLink'));
        if (isActive) {
            expect(nextLink).not.toHaveClass('SDSInactive');
        } else {
            expect(nextLink).toHaveClass('SDSInactive');
        }
    }


});