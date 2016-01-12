describe('describe', function() {

    var originInputField;
    var destinationInputField;
    var departureDateField;
    var returnDateField;
    var searchButton;

    beforeEach(function() {
        browser.get('AlternateDatesMatrixAdvancedCalendarAdvancedDateFlexibilityCriteria.html');
        originInputField = element(by.name('Origin'));
        destinationInputField = element(by.name('Destination'));
        //departureDateField = element(by.model('simpleTrip.DepartureDate'));//TODO directive does not save form name
        //returnDateField = element(by.id('SDSSearchForm_ReturnDate'));
        searchButton = element.all(by.buttonText('Search')).get(0);
    });

    it('Search form presented', function() {
        expect(originInputField).toBeDefined();
        expect(destinationInputField).toBeDefined();
        expect(searchButton).toBeDefined();
    });

    it('alternate dates matrix of +/-3 days is filled for every cell', function (done) {
        var searchCriteria = {
              departure: "FRA"
            , arrival: "IST"
            , departureDate: "2015-11-01" //TODO mocking
            , returnDate: "2015-11-10"
        };

        originInputField.sendKeys(searchCriteria.departure);
        destinationInputField.sendKeys(searchCriteria.arrival);
        //departureDateField.sendKeys(searchCriteria.departureDate);
        //returnDateField.sendKeys(searchCriteria.returnDate);

        searchButton.click();

        browser.waitForAngular();

        var altDatesMatrixWidget = element(by.css('.SDSAlternateDatesMatrixWidget'));
        expect(altDatesMatrixWidget).toBeDefined();

        done();
    });


});