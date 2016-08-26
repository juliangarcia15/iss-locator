const $ = require('jquery');

module.exports = function (text) {
  return $(`
    <iframe
        width="300"
        height="400"
        
        src="${source}">
    </iframe>
  `);
};
