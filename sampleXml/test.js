var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var cheerio = require('cheerio');
var Promise = require('bluebird');
var parseXml = Promise.promisify(require('xml2js').parseString);

var options = {
  currentWeatherFeedUrl: "http://rss.weather.gov.hk/rss/CurrentWeather.xml",
  currentWarningFeedUrl: "http://rss.weather.gov.hk/rss/WeatherWarningSummaryv2.xml",
  airQualityFeedUrl: "http://www.aqhi.gov.hk/epd/ddata/html/out/aqhirss_Eng.xml"
};

function processCurrentWeatherXml(xml, callback) {
  var degreesRegex = /: (\d*) degrees Celsius/,
      humidityRegex = /Relative Humidity : (\d*) per cent/,
      uvIndexRegex = /UV Index [^\d]*([^\r|\n]*)/,
      uvIntensityRegex = /Intensity of UV radiation : ([^\r|\n|$]*)/,
      warningRegex = /(.*) \((\d\d):(\d\d) HKT (\d\d)\/(\d\d)\/(\d\d\d\d)\)/,
      aqDateRegex = /HKSAR Air Quality Health Index at : (.* \+0800)/,// e.g. "HKSAR Air Quality Health Index at : Sun, 15 Feb 2015 16:30:00 +0800 Current Condition"
      aqregionalRegex = /regional Stations: (\d*)( to (\d*))?/, // "regional Stations: 4 to 7 (Health Risk: Moderate to High)</p><p>Roadside Stations: 6 to 10 (Health Risk: Moderate to Very High)"
      aqRoadRegex = /Roadside Stations: (\d*)( to (\d*))?/, // "regional Stations: 4 to 7 (Health Risk: Moderate to High)</p><p>Roadside Stations: 6 to 10 (Health Risk: Moderate to Very High)"
      conditionRegex = /[^\/]+(\d\d)\..*$/; // "http://www.weather.gov.hk/images/wxicon/pic77.png"

  return new Promise(function (resolve, reject) {
    parseXml(xml).then(function(xmlObj) {
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
          weather.rainfall.push({
            start_time: results[1],
            end_time: results[2] + ' ' + results[3],
            station: $(this).children('td').eq(0).text(),
            mm: $(this).children('td').eq(1).text().replace(' mm','').replace(';','').replace('.','')});
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
}

fs.readFile('./CurrentWeather.xml', 'utf8', function (err,xml) {
  if (err) {
    return console.log(err);
  }

  var weather = {
      "scrape_date": new Date(),
      "current_weather": {
        "updated_on": undefined,
        "degrees_c": undefined,
        "humidity_pct": undefined,
        "uv_index": undefined,
        "uv_intensity": undefined,
      },
      "weather_condition": { // Legend: http://www.weather.gov.hk/textonly/explain/wxicon_e.htm
          "number": undefined,
          "caption": undefined,
          "icon_url": undefined
      },
      "weather_warnings": [{ // Legend: http://www.hko.gov.hk/textonly/v2/explain/intro.htm
            "date": undefined,
            "text": undefined,
            "icon_url": undefined
      }],
      "air_quality": {
          "date": undefined,
          "regional": {
              "from": undefined,
              "to": undefined
          },
          'roadside': {
              "from": undefined,
              "to": undefined
          }
      }
    };

  processCurrentWeatherXml(xml).then(function(weather) {
    console.log(weather);
  }).catch(function(err) {
    console.error(err);
  });
});
