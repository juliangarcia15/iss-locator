/* jshint esversion: 6 */
// NODE MODULES/LIBRARIES
const electron = require('electron');
const $ = require('jquery');
const moment = require('moment');

var IssLocation = function(latitude, longitude, time) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.time = time || moment().unix();
};

// Export the IssLocation constructor from this module.
module.exports = IssLocation;
