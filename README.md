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
var hkWeather = new HongKongWeather();

hkWeather.getCurrent().then(function(forecast){
  console.log(forecast);
});
```

## More?
Check original repo, but seems like not maintained atm.
