/* jshint esversion: 6 */
// NODE MODULES
const electron = require('electron');
const moment = require('moment');

// CONSTRUCTOR
var Util = function(creator) {
    // defaults
    this.UNDERCONSTRUCTION = 'This feature is still under construction.';
    this.WHOOPS = 'Whoops! Something went wrong...';
    // keep track of who made you
    this.creator = creator;
    // console.log('Util initialized');
};

/**
 * Simple wrapper to call electron's Notification
 * module and create a notification
 * @param  String       title           The title for the notification
 * @param  String       msg             The message for the body of the notification
 * @return Notification
 */
Util.prototype.notify = function (title, msg) {
    // defaults
    title = title || 'Sorry...';
    msg = msg || this.UNDERCONSTRUCTION;
    // notify
    return new Notification(title , {
        body: msg
    });
};

// Export the Util constructor from this module.
module.exports = Util;
