Hong Kong Weather API
=====================================

## What is this for?

Weather in Hong Kong varies greatly day by day and has a huge impact on the life of the average Hongkonger. Normal weather services are not accurate for this region. Luckily the Hong Kong Observatory has really great reporting employing over 300 secientists to carefully monitor weather, storms and typhoons.

The Hong Kong Observatory provide an official [website](http://www.hko.gov.hk) an [app](https://itunes.apple.com/hk/app/myobservatory/id361319719?mt=8). As part of the governments open data initiative they also offer [RSS feeds](http://rss.weather.gov.hk/rsse.html) for the data.

I've found that the official feed is lacking a lot of detail, so as well as using that, I looked at the unofficial JSON feeds that the mobile app uses and created a helpful node module to parse those.

This module uses a combination of both of these to generate useful and reliable data.


## Install

`npm install --save hongkong-weather`


## Usage

You can create the instance using the following

```javascript
var HongKongWeather = require('hongkong-weather');

var hkWeather = HongKongWeather();

hkWeather.getForecast().then(function(forecast){
    console.log(forecast);
});
```


## Supported Methods



## Example data

All methods return JSON, please see the examples linked above for more info on how to call each method.

```javascript
hkWeather.getForecast()
  .then(function(forecast) {
    var prettyJSON = JSON.stringify(forecast,null,1);
    console.log(prettyJSON);
});
```

Gives this response

```json
{
 "regional": {
  "title": "At 4 p.m. at the Hong Kong Observatory",
  "degrees_c": "29",
  "humidity_pct": "81",
  "uv_index": "4",
  "uv_index_at": "King's Park",
  "uv_intensity": "moderate",
  "warnings": [],
  "updated_on": "2016-06-08T08:11:00.000Z",
  "weather_condition": {
   "icon_url": "http://rss.weather.gov.hk/img/pic54.png"
  }
 },
 "temperatures": {
  "Hong Kong Observatory": "29",
  "King's Park": "29",
  "Wong Chuk Hang": "29",
  "Ta Kwu Ling": "29",
  "Lau Fau Shan": "29",
  "Tai Po": "27",
  "Sha Tin": "29",
  "Tuen Mun": "29",
  "Tseung Kwan O": "28",
  "Sai Kung": "28",
  "Cheung Chau": "27",
  "Chek Lap Kok": "30",
  "Tsing Yi": "29",
  "Shek Kong": "29",
  "Tsuen Wan Ho Koon": "28",
  "Tsuen Wan Shing Mun Valley": "29",
  "Hong Kong Park": "29",
  "Shau Kei Wan": "27",
  "Kowloon City": "29",
  "Happy Valley": "30",
  "Wong Tai Sin": "29",
  "Stanley": "27",
  "Kwun Tong": "29",
  "Sham Shui Po": "30",
  "Kai Tak Runway Park": "28",
  "Yuen Long Park": "30"
 },
 "rainfall": [
  {
   "station": "Yuen Long",
   "mm": "10"
  },
  {
   "station": "North District",
   "mm": "6"
  },
  {
   "station": "Tai Po",
   "mm": "1"
  }
 ]
}
```

## Issues

I'm happy to fix any issues, but make sure to send a [Gist](https://gist.github.com) of your XML or HTML content so I can recreate the problem. The government feeds are inconsistent so sometimes I might not be able to recreate the problem.


## Other Handy Modules

* [hongkong-pollution](https://www.github.com/hongkongkiwi/node-hongkong-pollution) - For Air Quality and Pollution Data for Hong Kong.


## Contributing

Feel free to submit any pull requests or add functionality, I'm usually pretty responsive.

If you like the module, please consider donating some bitcoin or litecoin.

__Bitcoin__

![LNzdZksXcCF6qXbuiQpHPQ7LUeHuWa8dDW](http://i.imgur.com/9rsCfv5.png?1)

__LiteCoin__

![LNzdZksXcCF6qXbuiQpHPQ7LUeHuWa8dDW](http://i.imgur.com/yF1RoHp.png?1)
