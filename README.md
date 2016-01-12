## Project goal
Javascript widgets for Sabre Dev Studio web services (SDS) were created in order to:

1. create a demo page, build from the widgets, to present functionality of SDS
2. provide widgets that can be embedded on Sabre customer pages (OTA, 3rd party developers)
3. create reusable Javascript components that could be used by third party developers while integrating with SDS.
4. provide demonstration code how SDS services may be consumed

## Dependencies
Main dependencies

- RequireJS
- Angular 1.3.x
- Angular modules: resource, sanitize, ngStorage
- Bootstrap (CSS)
- Angular Bootstrap
- lodash
- moment.js (incl. moment_range)

Dependencies only for some components

- Chart.js
- Angular UI select
- Angular img fallback
- Angular rangeslider
- Angular promize extras
- titatoggle (pure CSS toggle).

No dependency on jQuery.

## How to use
### Embedding widgets in your page
1. Make sure the settings in the `Configuration.js` file are correct for your point of sale and your bridge instance (see [Security notes](#Security)).
 Run grunt `dist` task, to get the minified bundle.
2. Include the widgets minified Javascript bundle, in a non blocking manner:
```html
    <script async src="../widgets/SDSWidgets.min.js"></script>
    </body>
</html>
```
3. Include widgets minified css:
```html
    <link rel="stylesheet" type="text/css" href="../stylesheets/SDSMain.css">
```
4. Include the widgets in you markup. For example:
```html
<body>
    <search-form class="embeddedWidget"></search-form>
    <itinerary-list class="embeddedWidget" active-search="true" active-search-web-service="instaflights"></itinerary-list>
</body>
```
The `class="embeddedWidget"` is for a moment necessary, to have responsive styling.

### Using widgets services from other Angular applications
In dist directory two files are produced:

- SDSWidgets.min.js: this is standalone, auto-booting Angular application. Use it when you include widgets in non-Angular environment
- SDSWidgets.lib.min.js: this build is done in library mode, the widgets will not start itself as application. Use it to include widgets in any Angular application.

When using widgets in library mode, make sure:
1. make your angular modules dependent on `sdsWidgets` module.
2. enable widgets elementQueries: call: //TODO:
$timeout(function () {
      sabreDevStudioWidgets.parseAllStylesheetsToMakeWidgetsResponsive()
}, 10);

## Widgets Architecture

### Overall processing layers description
1. Widgets are implemented as Angular directives. One widget is represented by one directive. So you embed widgets on your web page by using custom HTML5 elements or attributes.
2. One widget directive may depend on other directives, which are called partials.
3. Every widget is represented by one file in `src/widgets` directory, or a subdirectory in that directory.
   Typically one widget consists of the definition of the directive representing it (and its controller, private functions). They constitute the Controller in MVC model.
4. Widgets, to get data from SDS, are calling designated angular services, so called _data services_.
   The responsibility of data services is to provide higher level business abstraction (domain objects) of data available in SDS.
   For example to return Air Shopping itineraries for given day or return lowest fares per given date range.
   Data Services and all layers below constitute the model in MVC. More on data service in [next section](#DataServicesFlowDetails).
5. SDS web services themselves (called by the data services) are represented by angular resources. The resources definitions, for all web services, are in the `WebServicesResourceDefinitions.js` file.
    Most of the resources are of GET type (as the SDS web services).
    All SDS services responses are cached, either by Angular caching mechanism available in resource or by a custom mechanism.
    Custom caching mechanism (for details see the `CachingDecorator` in ``WebServicesResourceDefinitions.js`) is needed because some Sabre Dev Studio services have quite complex request schema
    and are so exposed as POST (not GET) webservices. And Angular does not offer caching of POST web services.
    Those POST webservices are wrapped in the resource and exposed thru custom `sendRequest` method.

    Please note **SDS web services are not called by the widgets directly**, but the widgets are calling a special bridge, and only that bridge calls the SDS services. See details in the [Security](#Security) section.

6. Widget views: the Views are Angular templates. Typically there is one view per widget. In case of more complex views, or when common view components (partials) were identified,
the widgets views include other, partial views. The other, partial views are also Angular directives.


### <a name="DataServicesFlowDetails"></a> Data services flow details
There are multiple relations used between the data services, the business abstraction they provide, and the actual SDS services they consume. Whatever that relation is, there is always only one data service that consumes one SDS web service (and one SDS web services is consumed by one one data service).
- There is only one data service exposing access to a given business abstraction. This data service consumes only one SDS service, and this SDS service is consumed by only that one data service. These are simplest cases, like Low Fare Range, or Low Fare History.
- There are multiple services exposing given business abstraction. For example both Bargain Finder Max data service and Instaflight data service expose Shopping itineraries per given day. Both data services consume their respective SDS web services.
- One data service may expose multiple data abstractions. For example Advanced Calendar data service is exposing both cheapest options per date range, itineraries per given day, and the alternate days matrix for given plus minus travel dates flexibility. In other words one data service implements multiple interfaces.

One widget consumes only one abstraction provided by one (rarely more) data service. One data service may be consumed by multiple widgets. For example lead prices for date range is consumed by both Calendar widget and by lead price chart widget. In simples case one data service abstraction is consumed by ony one widget, like the For example the `FareForecastWidget` consumes `FareForecastDataService`.
Data services, apart from being consumed by the widgets, also provide higher level business abstraction API to get data from SDS for the 3rd party developers.

From code perspective data services are located in `src\webservices` directory and are source file with name ending with `DataService`.

The data services are instantiated by clients (widgets) either directly or, optionally, thru the factories called _search strategy factories_.
A _search strategy_ represents one data service, or a set of data services (exposing the same abstraction) which are orchestrated to provide
the same business abstraction (for example by calling two data services in parallel and merging results).
An example of such orchestration is the `ItinerariesSearchStrategyFactory`, which when called in some mode, creates orchestrated data service with calls Instaflights SDS web service, and then there or no results in Instaflights, it called Bargain Finder Max web services.
In other mode it can also produce other orchestrated service which first calls Instaflights and then calls Bargain Finder Max.

Same search strategy factories are reused across multiple widgets.

From data services implementation perspective, several complexity levels are possible:
- Simplest: data service is not doing any much work, it just calls the actual web service. It works as a pass-thru, or pass thru with some small transformation or decoration of request, and/or some minimal pre-parsing of web service response
- More complex: it may include all, or some elements of the below:
    * transformation of incoming search criteria into web service request, including calling external web service request builders.
    * checking internal cache of the domain objects (the higher level business abstraction exposed by data services) and returning domain objects from cache if found (in such case the call to the web service not done). The query to the cache and if needed the call to the web service, is always done.
    * actual calling the web service.
    * parsing web service response into domain objects, which may include using external (reusable) parsers for a given response type.

### Communication between widgets
Widgets collaborate with each other in following cases:
1. The Search Form Widget, which collects user search criteria, must pass these criteria to any other widget which does the _active search_ in SDS services (for example Itineraries List Widget or Calendar Widget).
_active search_ means that the widget which executes it, on receiving search criteria, is the one that initiates the search in the SDS (and also presents response data in its view).
This is in contrary to the _passive_ mode, in which, the search and populating web services response cache, is initiated by other (_acive search_) widget, while the widget in _passive_ mode is reusing the data from cache.
2. Active search widgets, for example Calendar Widget or Lead Price Chart Widget, must pass information that user selected some view element (like calendar day cell or day bar price) and needs to be shown more data in a detailed display (like in Itineraries List Widget).
Then the active search widget must inform the passive search widget on what what details user requested (like selected date of travel), and give reference to the data service where the passive widget can get the data from (the data retrieved by active search and cache in data service).
3. The Itineraries Filtering Panel must be able to request information on the statistics of the data currently presented, so that it can configure its values shown to customer for filtering.
   In response, the widget presenting itineraries, like the Itineraries List Widget, must send the statics on the current data currently presented to the Itineraries Filtering Panel.
4. Itineraries Filtering Panel must send information to the widgets, for example to the Itineraries List Widget, that the user selected/updated filtering criteria, so the new filtering criteria must be applied.

All above communication is implemented by Angular events system ($broadcast, $on). The $broadcast call is wrapped into simple Angular messaging service (one service per one event type) and the message sender is calling the service to send the event, previously calling service setters to provide message details.
The receiver is listening ($on) for the event, and then reading the message from the communication service.
In case of point 3. (statistics on current itineraries presented) it is further decoupled into a publish-subscribe mechanism.

### <a name="WidgetsWorkflow"></a>Widgets use cases and workflow
Widgets itself (the classes in `widgets` directory) are commonly implementing this behaviour:
1. If search criteria elements were predefined in as widget directive attributes, assembly SearchCriteria object, validate it and execute search
2. Upon receiving new search criteria event, validate the search criteria received. If validation is not successful then you may return validation error messages to the user.
3. When search criteria are valid, execute search in data service. Update Angular scope objects that the view listens on and renders.
4. If data service does not return data or returns errors, present information to the user that the result for given city pair could not be produced.
5. For subsequent search criteria received, apart from processing and updating scope objects, make sure you clear all old scope results, in particular old error messages if present.

### <a name="Security"></a> Security
SDS REST services use token based authentication (OAuth 2). In order to obtain the token, users must provide SDS username and password.
We cannot allow that username and password to be stored in Javascript file that is downloaded to the end-user browsers. That is why some kind of proxy (bridge) is needed to participate in communication between the widgets (end user browser) and SDS services.
Such bridge implementation in Java is available on [Github](https://github.com/SabreDevStudio/SabreRESTJavaBridge). Tomcat J2EE container is needed to run that bridge, see details in [Github](https://github.com/SabreDevStudio/SabreRESTJavaBridge).
Then, it is the bridge which has Sabre SDS username and password and which calls SDS services, on getting requests from the widgets.

Please note that it is **your responsibility** to properly secure access to the bridge you are setting up for your end customers.

#### Use of browser local storage
On the first widget run, widgets are making calls to the SDS lookup (decode) services (airport lookup, country lookup, airline lookup, aircraft lookup), to populate dictionaries for decoding.
Upon getting successful response from SDS and parsing, these dictionaries are stored in local storage of the browser, and then not fetched again.
There is not expiration or renew policy for those dictionaries in local storage.

### Error handling
We can have following error categories:
1. Network connectivity errors (like link down, packages dropped by firewall)
2. All non-successful HTTP response code (all HTTP response codes other than 200 series).
From SDS user perspective, the error code then is nearly always 404, and there is actual business error message in the response (like no fares available for given search criteria)
3. User input validation errors: like particular search form fields do not work with each other, the search form criteria are not handled by the web service (like length of stay over 16 days not supported).

All errors from point 1. and 2. are presented (presented, not caught) in the same place, which is the designated widget called ErrorDisplayWidget.

All errors of type 1. (network connectivity) are caught by one Angular response error interceptor, which broadcasts the event on network connectivity issue.
These events are caught and displayed by the ErrorDisplayWidget. On next new search criteria event, the ErrorDisplayWidget clears all (previous) errors.

Regarding errors of type 2 (HTTP error message), the HTTP error code only is caught by the interceptor and the event is broadcast,
but the parsing of the business error message is done in the (promise) reject handler of the data service.
The reject handler broadcasts the error event, which is caught by ErrorDisplayWidget, and also rejects the data service promise with parsed business error message.
The widget, on getting data service promise rejected may do nothing (its previous successful data are still presented), may clear previous successful data, but does not need to handle displaying error messages, as it is the responsibility of the ErrorDisplayWidget.

## Development
### Development dependencies
1. NPM for managing development dependencies
2. Bower for managing application dependencies
3. Grunt
4. SASS and Compass

Currently there are no unit test and no integration tests.

### Implementing new widget
1. Make sure the web service you are going to consume is defined in the `WebServicesResourceDefinitions.js` file.
2. Check data services using given web service, if they already offer the business abstractions you need. Extend existing data service (or multiple data services if you want to consume same data abstraction from multiple services), or create new data service.
   Data service will typically offer some getSomeBusinessAbstraction/getSomeDomainObjects method, which will be passed the `SearchCriteria` object. The `SearchCriteria` object is created by the Search form widget or build internally by the widget when the search criteria elements (departure airport, arrival airport, travel times) are provided as the widget directive attributes.
   You will also typically add new domain objects to represent the business abstraction: add new classes to the `datamodel` directory.
3. Create the actual widget which will consume the data service abstractions and present it visually.
   Please note that the widget should be the controller + view only, and it should not model domain objects or implement any business logic. Please put domain objects in 'datamodel' directory, and for any business logic create separate angular services.
4. At least for test purposes you will also create a test HTML page that will use only this widget (typically paired with the Search Form widget). Please see `www` directory for examples.

If your widget (controller) logic is similar to the workflow described in previous section [Widgets use cases and workflow](#WidgetsWorkflow),
then you may reuse (inherit from) the `BaseController`, which implements the skeleton for all the workflow described above.
As `BaseController` was identified later, not every widget which could uses it, but all new widgets should use it.

Regarding the widget view templates, please you may reuse the patterns currently used:
- ngIf checking if there are any results available which encloses all rendering for successful results. The method for checking is there are any data available is exposed by widget controller (or link function). Typically it is checking if some model property is defined, some domain object array has any elements, and similar.
- another ngIf checking if there are any error messages, which enclose rendering of errors. Function to check if there are error messages is exposed by the controller. Typically when function from point 1 returns true, this error messages function returns false and the other way round.
- please see the `view-templates\partials` for partials you could reuse
- the Angular filters defined in `util\CommonFilters` and `util\Lookups` files may be useful.

### Styling
All styling is based Twitter Bootstrap 3 classes. When Bootstrap classes were not sufficient, minimal custom styling was added.
All custom styling classes have the prefix `SDS` to differentiate from Bootstrap or the user classes.
All custom styling is authored in SASS and Compass and all SASS files are located in `widgets\style\*.scss` files.
You will notice that, apart from the `_SDSCommon.scss` file, there are only several custom classes defined per widget.

### RWD
Regarding being responsive or not, widgets fall into following categories:
1. widget is fully responsive. Done for all widgets that are intended to be shown on every viewport, and which are not very small and simple. For example Search Form, Itinerary List
2. widget styling does not have any responsive instructions, but the widget is very small and/or simple and shold work on small resolutions anyway. For example Fare Range.
3. widget does not have responsive instructions and is not intended to be presented on smaller viewports. For example the Alternate Dates matrix.

Widgets are responsive in relation to the containing div, not in relation to viewport width. So _element media queries_ are used, not screen media queries. For concept of element queries see [that article](http://www.smashingmagazine.com/2013/06/25/media-queries-are-not-the-answer-element-query-polyfill/).
Queries on element level are necessary as widgets will be embedded in various pages, being granted various width to expand to within their host element.

For detection of current element size (width) the [elementQuery](https://github.com/tysonmatanich/elementQuery) library was used.

Mimicking Bootstrap responsive grid system, the custom responsive-element grid system was created (see `_SDSElementsGrid.scss `). This grid system is used to style widgets (for example set number of grid columns) responsive to the current element size.
Styling instructions are mobile first.

### i18n
Widgets do not support any special localization or internationalization apart from what is supported by Angular.
But all [Angular i18n](https://docs.angularjs.org/guide/i18n) should work. Currently the included `angular.js` file has the default (US) localization.

Currency symbol:
_Warning_: Angular native `currency` filter is overridden with the `isoCurrency` filter from `iso-currency` (see bower.json, see `SDSWidgets`).
In all views the (overridden) currency filter have currency passed as argument, so the prices are presented in the currency as they come from the SDS web service.

Date display formats:
All dates are represented by Moment.js dates and are given explicit formatting, so they are presented in the same format regardless of browser locale or Angular locale.
We use the default Moment.js build, without default (English) locale strings. It is possible to bundle moment.js with [other locale](http://momentjs.com/docs/#/i18n/).

## General notes on API usage
- all index-type arguments of API methods (like for example findMealForFlight(legIndex, segmentIndex)) are 0-based. All returned indexes are 0-based.
- all arguments with names of origin, destination, departure airport, arrival airport are IATA 3-character airport or city codes, for example NYC. Same for returned airports
- when any variable or method has _airport_ in name, then it may mean also city.
- by default all dates are in the format YYYY-MM-dd, for example 2015-12-31
- by default all date times are ISO 8601 date times without timezone offset. For example 2015-10-14T13:13:20
- all dates and date times, after being parsing from web service or from the user, are internally stored and passed between functions as Moment.js objects. The date or date time returning methods also returns them as Moment.js objects.
- the notion of <em>segment</em> is the same as <em>flight</em>.
- the notion of _relative_ and _absolute_ flight (segment) indexes: _absolute_ flight index is the index of flight in the whole travel. _relative_ flight index is the index in a given leg.
