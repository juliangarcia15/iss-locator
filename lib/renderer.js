/* jshint esversion: 6 */
// NODE MODULES/LIBRARIES
const $ = require('jquery');
const electron = require('electron');
const request = require('request');
const moment = require('moment');
const ipc = electron.ipcRenderer; // talk to main
// my MODULES
const Util = require('./js/util');
const IssLocation = require('./js/models/issLocation');

// CONSTRUCTOR
var MainView = function() {
    // init obj variables
    this.locations = [];
    this.markers = [];
    // create the map
    this.earth = this.initializeEarth();
    // and mark the ISS on the map
    this.markISSCurrentLocation(this.earth);
    // finally bind events
    this.bindEvents();
    // and
    this.util = new Util(MainView.name);
    // console.log('MainView initialized', this);
};

// FUCNTIONS
/**
 * Creates the world map for the view and sets up rotation animation
 * @return WE.map The world map created
 */
MainView.prototype.initializeEarth = function () {
    // init WE map
    let earth = new WE.map('iss-location-map',{
        // dragging: false,
        tilting: false,
        zooming: false,
        scrollWheelZoom: false
    });
    // add tileLayer to map
    WE.tileLayer('http://data.webglearth.com/natural-earth-color/{z}/{x}/{y}.jpg', {
        tileSize: 256,
        // bounds: [[-85, -180], [85, 180]],
        minZoom: 0,
        maxZoom: 16,
        attribution: 'WebGLEarth Natural Earth Color',
        tms: true
    }).addTo(earth);

    // Start a simple rotation animation
    var before = null;
    requestAnimationFrame(function animate(now) {
        var c = earth.getPosition();
        var elapsed = before? now - before: 0;
        before = now;
        earth.setCenter([c[0], c[1] + 0.1*(elapsed/30)]);
        requestAnimationFrame(animate);
    });

    return earth;
};

/**
 * Gets the current location of the International Space Station
 * and creates a new marker on the map using the location returned.
 * @param  WE.map       map     The map to apply the marker to
 */
MainView.prototype.markISSCurrentLocation = function (map) {
    let self = this; // remember who you are
    request.get({
        url: 'http://api.open-notify.org/iss-now.json'
    }, function (err, response, body){
        if (err) {
            return self.notifyRequestError('open-notify.org/iss-now', JSON.parse(err).message);
        }
        let location = JSON.parse(body).iss_position;
        // add marker to map
        let marker = WE.marker([location.latitude, location.longitude]).addTo(map);
        // record gathered iss location data
        let now = moment().unix();
        self.locations.push(new IssLocation(location.latitude, location.longitude, now));
        // and record marker placement
        self.markers[now] = marker;
    });
};

/**
 * TODO UNDER CONSTRUCTION
 */
MainView.prototype.flyToLastMark = function (self) {
    self.util.notify();
};

/**
 * Notifies the user of next time that the ISS will pass
 * over a particular latitude and longitude
 * @param  el         form The form passing in the address data
 * @param  MainView   self Reference to MainView
 */
MainView.prototype.notifyPassTime = function (form, self) {
    // get user input
    let data = $(form).serializeArray();
    let n = data[1].value; // TODO add param to url
    if (!data[0].value) { // TODO find better validation library
        alert('Please enter an address.'); // alerts are ugly, only temporary
        return false;
    }
    // console.log('data',data);
    // define address return callback
    let callback = function(location) {
        // create open notify url
        let url = `http://api.open-notify.org/iss-pass.json?lat=${location.lat}&lon=${location.lng}&n=1`;
        // console.log('url',url);
        request.get({
            url: url,
        }, function (err, response, body){
            if (err) {
                return self.notifyRequestError('open-notify.org/iss-pass', JSON.parse(err).message);
            }
            // parse returned data
            let passTime = JSON.parse(body).response;
            let risetime = moment.unix(passTime['0'].risetime).fromNow();
            let duration = moment.duration(passTime['0'].duration, 's').humanize();
            // notify
            let title = 'Look Overhead At:';
            let msg = 'Rising '+ risetime + ' for ' + duration + '.';
            self.util.notify(title,msg);
        });
    }

    // get latLong and provide defined callback
    let location = self.getLatLongFromAddress(data[0].value, callback);
};

/**
 * Notify the user that there was an error retrieving
 * data from the api
 * @param  String   api The api
 * @param  {}       err The error returned by the api
 */
MainView.prototype.notifyRequestError = function (api, err) {
    let u = new Util();
    let msg = 'Error retrieving data from ' + api;
    this.util.notify(u.WHOOPS, msg);
    console.error({
        msg: msg,
        error: err
    });
};

/**
 * Leverages Google's Geocode API to asynchronously get the lat
 * and long of a given address. Then calls the callback with the
 * results as a parameter.
 * @param  String     address  The address provided by the user
 * @param  Function   callback Called with the resulting lat and long
 */
MainView.prototype.getLatLongFromAddress = function (address, callback) {
    if (typeof callback !== 'function') {
        error.log(Util.WHOOPS, 'The callback provided to getLatLongFromAddress is not a function');
        return false;
    }
    // prepare the url for googleapis
    let self = this;
    let GEO_API_KEY = 'AIzaSyBqclJvFHvItEbCcRqx5gjTWp9a6zNIzks';
    let BASE = 'https://maps.googleapis.com/maps/api/geocode/json?';
    //url-ify spaces
    address = address.split(' ').join('+');
    // and make the request
    request.get({
        url: BASE + 'address=' + address + '&key=' + GEO_API_KEY,
    }, function (err, response, body){
        let bod = JSON.parse(body);
        if (bod.status != "OK") {
            return self.notifyRequestError('maps.googleapis.com/maps/api/geocode', bod.status);
        }
        // parse returned data
        var location = bod.results[0].geometry.location;
        // and send it away
        callback(location);
    });
};

/**
 * Bind all events to the main view
 */
MainView.prototype.bindEvents = function () {
    let self = this;
    // JQUERY objs
    let $addNewMark = $('#addNewMark');
    let $flyToLastMark = $('#flyToLastMark')
    let $nextPassesForm = $('#nextPasses');

    // FUNCTION CALLS
    $addNewMark.on('click', function(){
        return self.markISSCurrentLocation(self.earth);
    });
    $flyToLastMark.on('click', function() {
        return self.flyToLastMark(self);
    });
    $nextPassesForm.on('submit',function(event) {
        event.preventDefault();
        return self.notifyPassTime(this,self);
    });
};

// Finally, get this show on the road
var m = new MainView();
