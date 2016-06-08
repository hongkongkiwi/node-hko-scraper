var HongKongWeather = require('../index');
var hkWeather = new HongKongWeather();

hkWeather.getCurrent()
  .then(function(current) {
    var prettyJSON = JSON.stringify(current,null,1);
    console.log(prettyJSON);
  }).catch(console.error);
