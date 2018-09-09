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
  var self = this;

  var reqptions = _.extendOwn({
    method: 'GET',
    uri: self.options.nineDayForecastFeedUrl
  }, self.options.requestOptions);

  return new Promise(function (resolve, reject) {
    return rp(reqptions)
      .then(function(xml) {
        return parseXml(xml);
      }).then(function(xmlObj) {
        var forecasts = [];
        var weatherXml = _.pick(xmlObj.rss.channel[0].item[0], 'title', 'description');
        var $ = cheerio.load(weatherXml.description[0], {normalizeWhitespace: true});
        console.log($('p'));
        $('p').each(function(i, elm) {
          var text = $(this).text();

          var stripText = function(text, start, end)
          {
            return text.substring(0, start) + text.substring(end, text.length);
          }

          text = stripText(text, text.indexOf("Wind:"), text.indexOf("Temp range:") + "Temp range:".length);
          text = stripText(text, 0, text.indexOf("Date/Month:") + "Date/Month:".length);

          var mmdd = text.substring(0, 6);
          var weekday = (text.split('(')[1]);
          var temp_low = null;
          var temp_high = null;
          var rh_low = null;
          var rh_high = null;

          if (weekday) {
            weekday = weekday.split(')')[0];
            temp_low = text.split(')  ')[1].split(' - ')[0];
            temp_high = text.split(' - ')[1].split(' C')[0];
            rh_low = text.split('range: ')[1].split(' - ')[0];
            rh_high = text.split(' - ')[2].split(' per Cent')[0];
          }

          console.log(text, mmdd, weekday, temp_low, temp_high, rh_low, rh_high);
          if (mmdd && weekday && temp_low && temp_high)
          {
            forecasts.push({
              mmdd: mmdd,
              weekday: weekday,
              temp_low: temp_low,
              temp_high: temp_high,
              rh_low: rh_low,
              rh_high: rh_high,
            })
          }

          //weather.warnings.push({"description": $(this).text().replace('Please be reminded that:','')}); // for testing do text()
        });

        resolve(forecasts);

        // var weather = {
        //   regional: {
        //     title: undefined,
        //     degrees_c: undefined,
        //     humidity_pct: undefined,
        //     uv_index: undefined,
        //     uv_index_at: undefined,
        //     uv_intensity: undefined,
        //     warnings: []
        //   },
        //   temperatures: {},
        //   rainfall: []
        // };

/*
<rss version="2.0">
  <channel>
    <title>9-day Weather Forecast</title>
    <link>http://www.weather.gov.hk/wxinfo/currwx/fnd.htm</link>
    <description>9-day Weather Forecast</description>
    <language>en-us</language>
    <webMaster>mailbox@hko.gov.hk</webMaster>
    <copyright>The content available in this file, including but not limited to all text, graphics, drawings, diagrams, photographs and compilation of data or other materials are protected by copyright. The Government of the Hong Kong Special Administrative Region is the owner of all copyright works contained in this website.</copyright>
    <image>
      <url>http://rss.weather.gov.hk/img/logo_dblue.gif</url>
      <title>9-day Weather Forecast</title>
      <link>http://www.weather.gov.hk/</link>
    </image>
    <item>
      <guid isPermaLink="false">http://rss.weather.gov.hk/rss/SeveralDaysWeatherWeatherForecast/20180909113000</guid>
      <pubDate>Sun, 09 Sep 2018 03:30:00 GMT</pubDate>
      <title>Bulletin updated at 11:30 HKT 09/Sep/2018</title>
      <category>F</category>
      <author>Hong Kong Observatory</author>
      <link>http://www.weather.gov.hk/wxinfo/currwx/fnd.htm</link>
      <description><![CDATA[ 
            
    General Situation:<br/>The northeast monsoon will affect the coast of Guangdong in the next couple of days. An area of low pressure is expected to bring unsettled weather to the vicinity of Taiwan to the northern part of the South China Sea in the next few days, but its development and movement remain uncertain.<p/><p/>
    Date/Month:
    10/09 (Monday)<br/>
    Wind:         
    East to northeast force 4, force 5 offshore at first.<br/>
    Weather:    
    Mainly cloudy with one or two rain patches. Sunny periods in the afternoon.<br/>
    Temp range: 
    26 -  
    30 C<br/>
    R.H. range:  
    70 -  
    90 per Cent<br/><p/><p/>
    Date/Month:
    11/09 (Tuesday)<br/>
    Wind:         
    Northeast force 4.<br/>
    Weather:    
    Sunny periods. One or two showers later.<br/>
    Temp range: 
    26 -  
    31 C<br/>
    R.H. range:  
    70 -  
    90 per Cent<br/><p/><p/>
    Date/Month:
    12/09 (Wednesday)<br/>
    Wind:         
    Northeast force 4 to 5, occasionally force 6 offshore later.<br/>
    Weather:    
    Sunny periods. A few showers and isolated thunderstorms later.<br/>
    Temp range: 
    27 -  
    31 C<br/>
    R.H. range:  
    75 -  
    95 per Cent<br/><p/><p/>
    Date/Month:
    13/09 (Thursday)<br/>
    Wind:         
    East to southeast force 4 to 5, occasionally force 6 offshore at first.<br/>
    Weather:    
    Cloudy with a few showers and thunderstorms.<br/>
    Temp range: 
    26 -  
    30 C<br/>
    R.H. range:  
    75 -  
    95 per Cent<br/><p/><p/>
    Date/Month:
    14/09 (Friday)<br/>
    Wind:         
    East force 3 to 4.<br/>
    Weather:    
    Sunny periods and one or two showers.<br/>
    Temp range: 
    27 -  
    32 C<br/>
    R.H. range:  
    70 -  
    90 per Cent<br/><p/><p/>
    Date/Month:
    15/09 (Saturday)<br/>
    Wind:         
    North force 2 to 3.<br/>
    Weather:    
    Mainly fine but hazy. Chance of showers and thunderstorms in the evening.<br/>
    Temp range: 
    28 -  
    33 C<br/>
    R.H. range:  
    65 -  
    90 per Cent<br/><p/><p/>
    Date/Month:
    16/09 (Sunday)<br/>
    Wind:         
    North to northwest force 3 to 4, force 5 later.<br/>
    Weather:    
    Sunny periods. Hazy at first. There will be squally showers and thunderstorms later.<br/>
    Temp range: 
    28 -  
    33 C<br/>
    R.H. range:  
    65 -  
    90 per Cent<br/><p/><p/>
    Date/Month:
    17/09 (Monday)<br/>
    Wind:         
    West to southwest force 5 to 6.<br/>
    Weather:    
    Cloudy with squally showers and thunderstorms.<br/>
    Temp range: 
    26 -  
    30 C<br/>
    R.H. range:  
    75 -  
    95 per Cent<br/><p/><p/>
    Date/Month:
    18/09 (Tuesday)<br/>
    Wind:         
    South to southeast force 4 to 5.<br/>
    Weather:    
    Mainly cloudy with a few showers and thunderstorms.<br/>
    Temp range: 
    26 -  
    30 C<br/>
    R.H. range:  
    75 -  
    95 per Cent<br/>
    <p/>Sea surface 
    temperature at  
    7 A.M.      09/09/2018 
    at North Point      was 25 degrees C.<br/>Soil 
    temperatures at   
    7 A.M.      09/09/2018 
    at Hong Kong Observatory      :<br/>0.5 M below surface was 29.2 degrees C
        <br/>1.0 M below surface was 29.4 degrees C
        <br/>
            ]]></description>
    </item>
  </channel>
</rss>*/
    });
  });
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
