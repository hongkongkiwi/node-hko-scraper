var HongKongWeather = require('../index');
var hkWeather = new HongKongWeather();

hkWeather.getTidalData()
  .then(function(tidalData) {
    var prettyJSON = JSON.stringify(tidalData,null,1);
    console.log(prettyJSON);
  }).catch(console.error);
