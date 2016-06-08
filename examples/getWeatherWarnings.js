var HongKongWeather = require('../index');
var hkWeather = new HongKongWeather();

hkWeather.getWarnings()
  .then(function(warnings) {
    var prettyJSON = JSON.stringify(warnings,null,1);
    console.log(prettyJSON);
  }).catch(console.error);
