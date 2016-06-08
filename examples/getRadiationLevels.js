var HongKongWeather = require('../index');
var hkWeather = new HongKongWeather();

hkWeather.getRadiationLevels()
  .then(function(radiationLevels) {
    var prettyJSON = JSON.stringify(radiationLevels,null,1);
    console.log(prettyJSON);
  }).catch(console.error);
