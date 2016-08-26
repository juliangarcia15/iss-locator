/* jshint esversion: 6 */
// NODE MODULES/LIBRARIES
const $ = require('jquery');
const electron = require('electron');
const request = require('request');
const moment = require('moment');
const ipc = electron.ipcRenderer; // talk to main
// my MODULES
const Util = require('./js/util');

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
    console.log('MainView initialized', this);
};

// FUCNTIONS
/**
 * Creates the world map for the view and sets up rotation animation
 * @return WE.map The world map created
 */
MainView.prototype.initializeEarth = function () {
    earth = new WE.map('iss-location-map');
    WE.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution: '© OpenStreetMap contributors'
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
        // console.log('location',body);
        let location = JSON.parse(body).iss_position;
        let marker = WE.marker([location.latitude, location.longitude]).addTo(map);
        let now = moment().unix();

        self.locations[now] = location;
        self.markers[now] = marker;
    });
};

/**
 * Notifies the user of next time that the ISS will pass
 * over a particular latitude and longitude
 * @param  $.event   event [description]
 * @return {[type]}       [description]
 */
MainView.prototype.notifyPassTime = function (event) {
    event.preventDefault();
    let self = this;

    request.get({
        url: 'http://api.open-notify.org/iss-pass.json?lat=44&lon=123&n=1',
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
 * Bind all events to the main view
 */
MainView.prototype.bindEvents = function () {
    let self = this;
    // JQUERY objs
    let $refresh = $('#refresh');
    let $passTime = $('#pass-time');

    // FUNCTION CALLS
    $refresh.on('click', function(){
        return self.markISSCurrentLocation(self.earth);
    });
    $passTime.on('click',this.notifyPassTime);
};

// Finally, get this show on the road
var m = new MainView();
