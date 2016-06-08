var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var cheerio = require('cheerio');
var Promise = require('bluebird');
var rp = require('request-promise');
var parseXml = Promise.promisify(require('xml2js').parseString);

var HongKongWeather = function(options) {
  this.options = _.extendOwn({
    currentWeatherFeedUrl: "http://rss.weather.gov.hk/rss/CurrentWeather.xml",
    currentWarningSummaryFeedUrl: "http://rss.weather.gov.hk/rss/WeatherWarningSummaryv2.xml",
    currentWarningBulletonUrl: "http://rss.weather.gov.hk/rss/WeatherWarningBulletin.xml",
    localForecastFeedUrl: "http://rss.weather.gov.hk/rss/LocalWeatherForecast.xml",
    nineDayForecastFeedUrl: "http://rss.weather.gov.hk/rss/SeveralDaysWeatherForecast.xml",
    worldEarthquakeFeedUrl: "http://rss.weather.gov.hk/rss/QuickEarthquakeMessage.xml",
    localEathquakeFeedUrl: "http://rss.weather.gov.hk/rss/FeltEarthquake.xml",

    requestOptions: {

      }
  }, options);
};

HongKongWeather.prototype.getCurrent = function() {
  var self = this;

  var reqptions = _.extendOwn({
    method: 'GET',
    uri: self.options.currentWeatherFeedUrl
  }, self.options.requestOptions);

  return new Promise(function (resolve, reject) {
    return rp(reqptions)
      .then(function(xml) {
        return parseXml(xml);
      }).then(function(xmlObj) {
        var weatherXml = _.pick(xmlObj.rss.channel[0].item[0], 'title', 'description');
        var $ = cheerio.load(weatherXml.description[0], {normalizeWhitespace: true});

        var weather = {
          regional: {
            title: undefined,
            degrees_c: undefined,
            humidity_pct: undefined,
            uv_index: undefined,
            uv_index_at: undefined,
            uv_intensity: undefined,
            warnings: []
          },
          temperatures: {},
          rainfall: []
        };

        $('p').first().children('font').each(function(i, elm) {
          weather.regional.warnings.push({color: $(this).attr('color'), description: $(this).text().replace('Please be reminded that:','')});
          //weather.warnings.push({"description": $(this).text().replace('Please be reminded that:','')}); // for testing do text()
        });

        $('p').first().contents().filter(function() {
            return this.type === 'text';
        }).each(function(i, elm) {
          var text = $(this).text().trim();

          switch(i) {
            case 0:
              weather.regional.title = text.replace(' :', '');
              break;
            case 1:
              weather.regional.degrees_c = text.replace('Air temperature : ','').replace(' degrees Celsius','');
              break;
            case 2:
              weather.regional.humidity_pct = text.replace('Relative Humidity : ','').replace(' per cent','');
              break;
            case 3:
              weather.regional.uv_index_at = text.replace('During the past hour the mean UV Index recorded at ','').split(' : ')[0];
              weather.regional.uv_index = text.replace('During the past hour the mean UV Index recorded at ','').split(' : ')[1];
              break;
            case 4:
              weather.regional.uv_intensity =  text.replace('Intensity of UV radiation : ','');
              break;
          }
        });

        $('table').eq(0).children('tr').each(function(i, elm) {
          weather.temperatures[$(this).children('td').eq(0).text()] = $(this).children('td').eq(1).text().replace(' degrees ','').replace(';','').replace('.','');
        });

        var regex = /Between (\d{1,2}:\d{1,2}) and (\d{1,2}:\d{1,2})\s(\w.\w.), the maximum rainfall recorded in various regions were:/;
        var results = regex.exec($.html());

        $('table').eq(1).children('tr').each(function(i, elm) {
          var rainfallObj = {};
          if (results) {
            rainfallObj.start_time = results[1];
            rainfallObj.end_time = results[2] + ' ' + results[3];
          }
          rainfallObj.station = $(this).children('td').eq(0).text();
          rainfallObj.mm = $(this).children('td').eq(1).text().replace(' mm','').replace(';','').replace('.','');

          weather.rainfall.push(rainfallObj);
        });

        //
        // .contents().filter(function() {
        //     return this.type === 'text';
        // }).each(function(i, elm) {
        //   var text = $(this).text().trim();
        //
        //   console.log(text);
        //
        //   switch(i) {
        //
        //   }
        // });


        weather.regional.updated_on = moment(weatherXml.title[0].replace('Bulletin updated at ','').replace('HKT ',''),'HH:mm DD/MM/YYYY').toDate();
        //weather.degrees_c = $('p');

        weather.regional.weather_condition = {
          "icon_url": $('img').attr('src'),
        };

        //console.log(warning);
        resolve(weather);
    });
  });
};

HongKongWeather.prototype.getWeatherWarnings = function() {
  // TODO: Implement me
};


HongKongWeather.prototype.getShortForecast = function() {
  // TODO: Implement me
};

HongKongWeather.prototype.getLongForecast = function() {
  // TODO: Implement me
};

HongKongWeather.prototype.getRadiationLevels = function() {
  // TODO: Implement me
};

HongKongWeather.prototype.getLocalEarthqakes = function() {
  // TODO: Implement me
};

HongKongWeather.prototype.getWorldEarthqakes = function() {
  // TODO: Implement me
};

HongKongWeather.prototype.getTidalData = function() {
  // TODO: Implement me
};

HongKongWeather.prototype.getSunriseData = function() {
  // TODO: Implement me
};

module.exports = HongKongWeather;
