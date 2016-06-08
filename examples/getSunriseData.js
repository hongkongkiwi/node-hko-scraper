var HongKongWeather = require('../index');
var hkWeather = new HongKongWeather();

hkWeather.getSunriseData()
  .then(function(sunriseData) {
    var prettyJSON = JSON.stringify(sunriseData,null,1);
    console.log(prettyJSON);
  }).catch(console.error);
