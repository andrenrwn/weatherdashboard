// Imports
dayjs.extend(window.dayjs_plugin_utc);

// Note: Required API keys are stored in config.js
// var myapikeys = {
//   unsplash: "";
//   openweater: "";
//   google: "";
// };

// Global variables

//var latitude = 1.2985181;
//var longitude = 103.8332306; // default location (singapore) under the global scope

var default_latitude = 9.643097;
var default_longitude = 95.642956; // default location (ocean) under the global scope

var unit_deg = {
  standard: "°K",
  metric: "°C",
  imperial: "°F",
};
var unit_dist = {
  standard: "m/s",
  metric: "m/s",
  imperial: "mph",
};
var city = {
  name: "",
  state: "",
  country: "",
  latitude: 0,
  longitude: 0,
};
var backgroundimage = {};

// https://stackoverflow.com/questions/10087819/convert-date-to-another-timezone-in-javascript
/* function convertTZ(date, tzString) {
  let tzStr = "";
  if (config.dataobj.useremotetimezone) {
    // global variable
    tzStr = tzString;
  }

  return (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzStr });
}
 */

// determine if it is day or night based on the timestamp, sunrise and sunset
function isday(timestamp, sunrise, sunset, tzoffset) {
  let offset = 0; // timezone display choice
  if (config.dataobj.useremotetimezone) {
    // global variable
    offset = tzoffset;
  }
  let risemod =
    ((sunrise + tzoffset) % 86400) -
    (Math.floor((sunset + tzoffset) / 86400) - Math.floor((sunrise + tzoffset) / 86400)) * 86400;
  let setmod = (sunset + tzoffset) % 86400;
  let stampmod = (timestamp + tzoffset) % 86400;
  // console.log(timestamp, dayjs.unix(sunrise).format(), dayjs.unix(sunset).format(), stampmod, risemod, setmod);
  if (stampmod >= risemod && stampmod < setmod) {
    return true;
  } else {
    return false;
  }
}

// Drawer side event listeners
// Modified from https://www.w3schools.com/howto/howto_js_collapsible.asp
var drawers = document.getElementsByClassName("drawerside");

function opendrawer(elementId) {
  var thisdrawer = document.getElementById(elementId);
  thisdrawer.classList.add("draweropen");
  var content = thisdrawer.previousElementSibling;
  content.style.maxWidth = content.scrollWidth + "px";
}

for (var i = 0; i < drawers.length; i++) {
  drawers[i].addEventListener("click", function (event) {
    event.preventDefault();
    event.target.classList.toggle("draweropen");
    var content = event.target.previousElementSibling;
    // console.log(content);
    if (content.style.maxWidth) {
      if (content.style.maxWidth != "0px") {
        // console.log(content.style.maxWidth);
        content.style.maxWidth = "0px";
        // console.log(content.style.maxWidth);
      } else {
        // console.log(content.style.maxWidth);
        content.style.maxWidth = content.scrollWidth + "px";
        // console.log(content.style.maxWidth);
      }
    } else {
      // console.log(content.style.maxWidth);
      content.style.maxWidth = content.scrollWidth + "px";
      // console.log(content.style.maxWidth);
    }
  });
}

// var myapikey = ""; // Don't store the API key in the src code // changed - publish it in private.js instead for easier public access

// Define today's forecast cards in html
function createElementFromHTML(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild;
}
var daycard = createElementFromHTML(
  `
    <div class="card flex shadow-xl relative block bg-opacity-90 hover:bg-opacity-50 transition-all overflow-hidden items-stretch">
      <figure class="px-1 pt-1 w-full">
        <img
          src="https://openweathermap.org/img/wn/10d@2x.png"
          alt="day"
          class="rounded-xl"
        />
      </figure>
      <div class="card-body mx-2 my-1 px-2 py-1">
        <h2 class="card-title">11 am</h2>
        <p>
          Temp: <span>30.2 C</span><br />
          Humidity: <span>68</span><br />
          Wind: <span>5.47</span><span>m/s</span>
        </p>
      </div>
    </div>
`
);

// Create an object to get/store search history and preferences
class weatherdashdata {
  constructor() {
    this.dataobj = {};
    this.dataobj.searchistory = []; // [{name: "Singapore", lat: latitude, lng: longitude}, {name: "Seattle",  lat: latitude, lng: longitude}];
    this.dataobj.units = "metric"; // metric (°C), imperial (°F), standard (°K)
    this.dataobj.latitude = default_latitude; // add a default location
    this.dataobj.longitude = default_longitude;
    this.dataobj.useremotetimezone = true; // if the dashboard displays the city's timezone instead of the local browser's timezone
    this.storagekey = "weatherdashdata";
    this.load_data();
  }
  load_data() {
    let newdata = {};
    //console.log("loading from storage");
    newdata = JSON.parse(localStorage.getItem(this.storagekey));
    Object.assign(this.dataobj, newdata); // merge data from storage
    return true;
  }
  // Store data to localstorage
  store_data() {
    //console.log("saving to storage");
    //console.log(this.pdata);
    localStorage.setItem(this.storagekey, JSON.stringify(this.dataobj));
    return true;
  }
  clear_searchistory() {
    this.dataobj.searchistory = [];
    this.store_data();
  }
}

var config = new weatherdashdata(); // store the history and metric settings in the object "config".

// If we aren't publishing our API key, then ask the user for an API key and store it in local storage
/* function getapikey() {
  let loadedapikey = localStorage.getItem("apikey");

  // If we don't have an API key, ask it from the user
  if (loadedapikey) {
    myapikey = loadedapikey;
  } else {
    // console.log(!myapikey, myapikey);
    while (!myapikey) {
      myapikey = prompt("Please enter an API key");
      modalalert("You entered " + myapikey);
      let text = "You entered " + myapikey + "\nStore this key in localstore?";
      // console.log(text);
      if (confirm(text)) {
        localStorage.setItem("apikey", myapikey);
        // console.log("key stored");
      } else {
        myapikey = "";
        // console.log("key cleared");
        break;
      }
    }
  }
}
 */

function refresh_background_info() {
  let heading = "Background image information";
  if (backgroundimage.locationname) {
    heading = backgroundimage.locationname;
  }
  document.getElementById("backgroundheading").innerHTML = `${heading}`;
  document.getElementById(
    "backgroundinfo"
  ).innerHTML = `<h3 class="alert alert-info">${backgroundimage.description}</h3>
  <p>download: <a href="${backgroundimage.links}" class="link link-info" target="_blank" rel="noopener noreferrer" alt="${backgroundimage.alt_description}">${backgroundimage.links}</a><br>
  by ${backgroundimage.name}</p>`;
}

function call_api(apilink) {
  fetch(apilink)
    .then(function (response) {
      if (response.ok) {
        // console.log(response);
        response.json().then(function (data) {
          // console.log(data);

          // Teleport
          //console.log("image is at: " + data.photos[0].image.web);
          //document.getElementById("todaysdash").style.backgroundImage = 'url("' + data.photos[0].image.web + '")';

          // unsplash
          // console.log("image is at: " + data[0].urls.full + "&w=" + window.innerWidth);

          backgroundimage.links = data[0].links.html;
          if (data[0].links.description) {
            backgroundimage.description = data[0].links.description;
          } else {
            backgroundimage.description = data[0].alt_description;
          }
          backgroundimage.alt_description = data[0].alt_description;
          backgroundimage.name = data[0].user.name;
          backgroundimage.locationname = data[0].location.name;
          refresh_background_info();

          document.getElementById("mainscreen").style.backgroundImage =
            'url("' + data[0].urls.full + "&w=" + window.innerWidth + '")';
        });
      } else {
        modalalert("Error on retrieving background image: " + response.statusText);
      }
    })
    .catch(function (error) {
      modalalert("Error : " + error);
    });
}

function modalalert(textmessage, sourcemessage) {
  document.getElementById("errormessage").textContent = textmessage;
  if (sourcemessage) {
    document.getElementById("errormessage2").textContent = sourcemessage;
  }
  my_modal_1.showModal();
}

// Display a picture of the place that we are tracking the weather for
function rendercityimage(city) {
  // Use unsplash source image to find images of places (not an official API, probably backdoor, but requires no API key)
  //let apilink = "https://source.unsplash.com/1600x900/?" + encodeURIComponent(city);
  //document.getElementById("mainscreen").style.backgroundImage = 'url("' + apilink + '")';
  // /unsplash source image

  // Use the unsplash official API which offers random pictures. This requires an API key.
  let apilink =
    "https://api.unsplash.com/photos/random?query=" +
    city +
    "&orientation=landscape&count=1&per_page=1&client_id=" +
    myapikeys.unsplash;

  call_api(apilink);

  /*********Uncomment for Teleport API
  // Teleport API city images
  let apilink = "https://api.teleport.org/api/urban_areas/slug:" + city + "/images/";

  //bg-[url('./assets/images/singapore_web-64dc53f309.jpg')] // teleport class
  // document.getElementById('todaysdash').style.backgroundImage = 'url("./assets/06-server-side-apis-homework-demo.png")';
  //content.photos[0].image.web

  fetch(apilink)
    .then(function (response) {
      if (response.ok) {
        // console.log(response);
        response.json().then(function (data) {
          // console.log(data);
          // console.log("image is at: " + data.photos[0].image.web);
          document.getElementById("todaysdash").style.backgroundImage = 'url("' + data.photos[0].image.web + '")';
        });
      } else {
        modalalert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      // console.log("Error:", error);
    });
  */
}

// Get today's weather data
//   api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}
//   api.openweathermap.org/data/2.5/forecast?q={city name}&appid={API key}
function getweather(city) {
  //let forecast = JSON.parse(testforecast);

  let apilink =
    "https://api.openweathermap.org/data/2.5/weather?lat=" +
    config.dataobj.latitude +
    "&lon=" +
    config.dataobj.longitude +
    "&units=" +
    config.dataobj.units +
    "&appid=2baf085ed1bbea0d1b7d521e3687a9b9";

  fetch(apilink)
    .then(function (response) {
      if (response.ok) {
        // console.log("content for weather openweatherapi response :", response);
        response.json().then(function (data) {
          // console.log("json content for weather openweatherapi call: ", data);
          displayweather(data);
          return;
          // end parse openweathermap API response */
        });
      } else {
        modalmodalalert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      // console.log("Error:", error);
    });

  function displayweather(weather) {
    let ticon = weather.weather[0].icon;
    //let w_isday = ticon.charAt(ticon.length - 1) === "d"; // is it day or night?
    let w_isday = isday(
      parseInt(weather.dt),
      parseInt(weather.sys.sunrise),
      parseInt(weather.sys.sunset),
      parseInt(weather.timezone)
    );
    let wicon = "https://openweathermap.org/img/wn/" + ticon + "@2x.png";

    // console.log("today's weather:", weather);

    if (w_isday) {
      document.getElementById("todaysweathericon").classList.add("bg-cyan-200");
      document.getElementById("todaysweathericon").classList.remove("bg-black");
    } else {
      document.getElementById("todaysweathericon").classList.add("bg-black");
      document.getElementById("todaysweathericon").classList.remove("bg-cyan-200");
    }
    document.getElementById("todaysweathericon").innerHTML = '<img src="' + wicon + '" />';
    document.getElementById("todaysweatherdescription").innerHTML = weather.weather[0].description;
    document.getElementById("todaysweatherdata").innerHTML =
      "🌡 " +
      weather.main.temp +
      unit_deg[config.dataobj.units] +
      " (feels like " +
      weather.main.temp +
      unit_deg[config.dataobj.units] +
      ")<br>🌢 " +
      weather.main.humidity +
      "% humidity<br>";

    document.getElementById("winddirection").style.transform = "rotate(" + weather.wind.deg + "deg)";

    var windgust = "";
    if (weather.wind.gust) {
      windgust = weather.wind.gust + " " + unit_dist[config.dataobj.units] + " (gust)";
    }
    var weatherspeed =
      "<p>⠀" + weather.wind.speed + " " + unit_dist[config.dataobj.units] + " (wind) " + windgust + "</p>";
    // console.log(weatherspeed);
    document.getElementById("todaysweatherspeed").innerHTML = weatherspeed;
  }
}

// Get forecast data
//   api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API key}
//   api.openweathermap.org/data/2.5/forecast?q={city name}&appid={API key}
function getforecast(city) {
  //let forecast = JSON.parse(testforecast); // debug

  var firstdata = {}; // store data from first API call

  // first API call (onecall is the only one that has daily forecasts)
  var apilink =
    "https://api.openweathermap.org/data/3.0/onecall?lat=" +
    config.dataobj.latitude +
    "&lon=" +
    config.dataobj.longitude +
    "&exclude=minutely,hourly&units=" +
    config.dataobj.units +
    "&appid=" +
    myapikeys.openweatheronecall;

  fetch(apilink)
    .then(function (response) {
      if (response.ok) {
        // console.log("content for onecall  openweatherapi response :", response);
        response.json().then(function (data) {
          // console.log("json content for onecall openweatherapi call: ", data);
          firstdata = data;
          // console.log("onecall result: ", firstdata);

          // second API call (3-hour forecast per API requirement)
          apilink =
            "https://api.openweathermap.org/data/2.5/forecast?lat=" +
            config.dataobj.latitude +
            "&lon=" +
            config.dataobj.longitude +
            "&units=" +
            config.dataobj.units +
            "&appid=" +
            myapikeys.openweather;

          fetch(apilink)
            .then(function (response) {
              if (response.ok) {
                // console.log("content for  openweatherapi response :", response);
                response.json().then(function (data) {
                  // console.log("json content for openweatherapi call: ", data);
                  displayforecast(data, firstdata);
                  return;
                  // end parse openweathermap API response */
                });
              } else {
                modalalert("Error: " + response.statusText);
              }
            })
            .catch(function (error) {
              // console.log("Error:", error);
            });
          return;
          // end parse openweathermap API response */
        });
      } else {
        modalalert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      // console.log("Error:", error);
    });

  // 3-hourly forecast api, onecall api daily forecast
  function displayforecast(forecast, forecast1) {
    // local variables
    let timeoffset = parseFloat(forecast1.timezone_offset) / 3600;
    // Display first day's forecast
    // console.log("display forecast ", forecast);
    // console.log("display onecall forecast", forecast1);
    let thisdate = dayjs.unix(parseInt(forecast1.daily[0].dt)).utcOffset(timeoffset);
    // Display the city's name and date on the main dashboard
    document.getElementById("selectedcity").textContent = city;
    document.getElementById("todaysdate").textContent = dayjs()
      .utcOffset(timeoffset)
      .format("dddd, D MMMM YYYY h:mm a");

    // Clear first day card
    document.getElementById("todaysweather").replaceChildren();
    document.getElementById("dayforecast").replaceChildren();
    document.getElementById("fivedayforecast").replaceChildren();

    // create 5 day forecast divs from forecast1
    for (var j = 1; j <= 5; j++) {
      thisdate = dayjs.unix(parseInt(forecast1.daily[j].dt)).utc().utcOffset(timeoffset);
      let wtemp = Math.round(forecast1.daily[j].temp.day * 10) / 10; // 0.1 digit precision
      let whumidity = forecast1.daily[j].humidity;
      let wspeed = forecast1.daily[j].wind_speed;
      let ticon = forecast1.daily[j].weather[0].icon;
      //let w_isday = ticon.charAt(ticon.length - 1) === "d"; // is it day or night?
      let w_isday = isday(
        forecast1.daily[j].dt,
        forecast1.daily[j].sunrise,
        forecast1.daily[j].sunset,
        forecast1.timezone_offset
      );
      let wicon = "https://openweathermap.org/img/wn/" + ticon + "@2x.png";
      let wdescription = forecast1.daily[j].summary;

      let newdaycard = daycard.cloneNode(true);
      newdaycard.querySelector("div > figure > img").src = wicon;
      newdaycard.querySelector("div > div > h2").textContent = thisdate.utc().format("ddd, D MMM YY");
      newdaycard.querySelector("div > div > p").innerHTML =
        wdescription +
        "<br>🌡 " +
        wtemp +
        unit_deg[config.dataobj.units] +
        "<br>🌢 " +
        whumidity +
        "%<br>🌬 " +
        wspeed +
        '<span class="text-xs">' +
        unit_dist[config.dataobj.units] +
        "</span>";
      if (w_isday) {
        newdaycard.classList.add("bg-cyan-200", "text-black");
      } else {
        newdaycard.classList.add("bg-black", "text-white");
      }
      newdaycard.classList.add("w-1/5");
      newdaycard.id = thisdate.utc().date();
      document.getElementById("fivedayforecast").appendChild(newdaycard); // or the five-day cards
    }

    // // create 3-hour forecast divs from forecast (old free API)
    let i = 0;
    thisdate = dayjs.unix(parseInt(forecast.list[0].dt)).utc().utcOffset(timeoffset);
    let prevdate = thisdate;
    let firstdate = thisdate;
    // console.log(
    //   "TIMESTAMP: ",
    //   forecast.list[i].dt,
    //   timeoffset,
    //   "\n THISDATE ",
    //   thisdate.utc(),
    //   "\n THISDATEOFFSET ",
    //   thisdate.utc().utcOffset(timeoffset),
    //   "\n DATE: ",
    //   thisdate.date(),
    //   "\n UTCDATE: ",
    //   thisdate.utc().date()
    // );

    // display all 3-hour forecast on the same day
    while (thisdate.date() === prevdate.date()) {
      let wtemp = Math.round(forecast.list[i].main.temp * 10) / 10;
      let whumidity = forecast.list[i].main.humidity;
      let wspeed = forecast.list[i].wind.speed;
      let ticon = forecast.list[i].weather[0].icon;
      //let w_isday = ticon.charAt(ticon.length - 1) === "d"; // is it day or night?
      let w_isday = isday(
        forecast.list[i].dt,
        parseInt(forecast.city.sunrise),
        parseInt(forecast.city.sunset),
        forecast.city.timezone
      );
      let wicon = "https://openweathermap.org/img/wn/" + ticon + "@2x.png";
      let wdescription = forecast.list[i].weather[0].description;
      /* console.log(
          thisdate.format(),
          //" --- ",
          //forecast.list[i].dt_txt,
          " - temp: ",
          wtemp,
          " - humidity: ",
          whumidity,
          " - wind: ",
          wspeed,
          " - icon: ",
          wicon
        ); */

      let newdaycard = daycard.cloneNode(true);
      newdaycard.querySelector("div > figure > img").src = wicon;
      newdaycard.querySelector("div > div > h2").textContent = thisdate.utc().utcOffset(timeoffset).format("h a");
      newdaycard.querySelector("div > div > p").innerHTML =
        "🌡 " +
        wtemp +
        unit_deg[config.dataobj.units] +
        "<br>🌢 " +
        whumidity +
        "%<br>🌬 " +
        wspeed +
        '<span class="text-xs">' +
        unit_dist[config.dataobj.units] +
        "<br>" +
        wdescription +
        "</span>";
      newdaycard.classList.add("w-[125px]");
      if (w_isday) {
        newdaycard.classList.add("bg-cyan-200", "text-black");
      } else {
        newdaycard.classList.add("bg-black", "text-white");
      }

      // Draw first day card
      if (thisdate.date() === firstdate.date()) {
        document.getElementById("dayforecast").appendChild(newdaycard);
      } else {
        newdaycard.querySelector("div > div > h2").innerHTML = thisdate
          .utc()
          .utcOffset(timeoffset)
          .format("DD/MM<br>h a");
        document.getElementById("fivedayforecast").appendChild(newdaycard); // or the five-day cards
      }

      i++;
      if (i >= forecast.list.length) {
        break;
      } else {
        thisdate = dayjs.unix(parseInt(forecast.list[i].dt)).utcOffset(timeoffset);
        // console.log(
        //   "TIMESTAMP: ",
        //   forecast.list[i].dt,
        //   timeoffset,
        //   "\n THISDATE ",
        //   thisdate.utc(),
        //   "\n THISDATEOFFSET ",
        //   thisdate.utc().utcOffset(timeoffset),
        //   "\n DATE: ",
        //   thisdate.date(),
        //   "\n UTCDATE: ",
        //   thisdate.utc().date()
        // );
      }
    }
    prevdate = thisdate;
    // }

    /* debug
  for (var i = 0; i < forecast.list.length; i++) {
    var x = dayjs.unix(forecast.list[i].dt);
    // console.log(
      forecast.list[i].dt_txt,
      " --- ",
      x.format(),
      " temp: ",
      forecast.list[i].main.temp - 273.15
    );
  }
  */
  }
}

function getplacelocation(placename) {
  // Example of openweathermap geocoding api call:
  // https://api.openweathermap.org/geo/1.0/direct?q=paris,Texas,US&limit=5&appid=2baf085ed1bbea0d1b7d521e3687a9b9

  var apilink = "https://api.openweathermap.org/geo/1.0/direct?q=" + placename + "&limit=15&appid=" + myapikeys.openweather;

  // console.log("fetching ", apilink);

  fetch(apilink)
    .then(function (response) {
      if (response.ok) {
        // console.log(response);
        response.json().then(function (data) {
          var cityoptions = document.getElementById("cityoptions");
          cityoptions.replaceChildren();
          for (i = 0; i < data.length; i++) {
            var cityitem = document.createElement("li");
            var datastate = data[i].state ? "," + data[i].state : ""; // check if this exists
            var datacountry = data[i].country ? "," + data[i].country : ""; // check if this exists
            cityitem.innerHTML =
              '<a class = "z-30" data-latitude="' +
              data[i].lat +
              '" data-longitude="' +
              data[i].lon +
              '">' +
              data[i].name +
              datastate +
              datacountry +
              "</a>";
            cityoptions.appendChild(cityitem);
          }
          var cityoptionsdetails = document.getElementById("citychoicedetails");
          if (cityoptionsdetails.hasAttribute("open")) {
            cityoptionsdetails.removeAttribute("open");
          } else {
            cityoptionsdetails.setAttribute("open", true);
          }
        });
      } else {
        modalalert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      // console.log("Error:", error);
    });
}

// Get the place name (city name) based on the given position, then populate the search text input area with it
function getplacename(position) {
  let localename = "";
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;

  // Example openweathermap reverse geocoding api call:
  // http://api.openweathermap.org/geo/1.0/reverse?lat=1.2985181&lon=103.8332306&limit=&appid=

  // Get the city name of the user's position with openweathermap API
  var apilink =
    "https://api.openweathermap.org/geo/1.0/reverse?lat=" +
    latitude +
    "&lon=" +
    longitude +
    "&limit=&appid=" +
    myapikeys.openweather;

  // Get the city name of the user's position with google API
  // var apilink = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + latitude + "," + longitude + "&key=" + myapikey;

  fetch(apilink)
    .then(function (response) {
      if (response.ok) {
        // console.log(response);
        response.json().then(function (data) {
          // console.log(data);

          // /*  Uncomment to allow API calls out via googleapi ******
          // if (data.plus_code.compound_code) {
          //   // console.log("We are in " + data.plus_code.compound_code.split(" ")[1]);
          // } else {
          //   // console.log("We're in the middle of nowhere");
          // }
          // */
          // /* Parse the openweathermap API response
          localename = data[0].name;
          if (data[0].name) {
            localename = data[0].name;
            // console.log("We are in " + localename);

            // set the city search input text
            document.getElementById("citychoice").value = localename; // Show the city in the input text area
          } else {
            // console.log("We're in the middle of nowhere");
          }
          return localename;
          // end parse openweathermap API response */
        });
      } else {
        modalalert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      // console.log("Error:", error);
    });

  /********** Use debug googleapi response testdata 
  /* (so we don't have to call the API while developing) 
  let data = JSON.parse(testdata);
  // console.log(data);
  // console.log(data.plus_code);
  if (data.plus_code.compound_code) {
    localename = data.plus_code.compound_code.split(" ")[1];
    // console.log("We are in " + localename);

    // set the city search input text
    document.getElementById("citychoice").value = localename;
  } else {
    // console.log("We're in the middle of nowhere");
  }
  ************ googleapi respnose testdata */

  /*********** openweather reverse geocoding response testdata *
  let data = JSON.parse(testowcity);
  // console.log(data);
  localename = data[0].name;
  if (data[0].name) {
    localename = data[0].name;
    // console.log("We are in " + localename);

    // set the city search input text
    document.getElementById("citychoice").value = localename;
  } else {
    // console.log("We're in the middle of nowhere");
  }
  **** /openweather reverse geocoding */

  return false;
}

// Try retrieving the current position of the user
function geoFindMe() {
  const status = document.getElementById("citychoice");
  // const mapLink = document.querySelector("#map-link");
  //
  // mapLink.href = "";
  // mapLink.textContent = "";

  // Display user's position
  function success(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;

    // Display user's position on an a href link
    status.textContent = "";
    // mapLink.href = `https://www.openstreetmap.org/#map=11/${latitude}/${longitude}`;
    // mapLink.textContent = `Latitude: ${latitude} °, Longitude: ${longitude} °`;

    status.dataset.latitude = latitude;
    status.dataset.longitude = longitude;

    config.dataobj.latitude = latitude;
    config.dataobj.longitude = longitude;

    getplacename(position);
  }

  function error() {
    status.textContent = "Unable to retrieve your location";
  }

  if (!navigator.geolocation) {
    status.textContent = "Geolocation not supported by your browser";
  } else {
    status.textContent = "Locating…";
    navigator.geolocation.getCurrentPosition(success, error);
  }
}

// Render the list of the city search history
function displaysearchhistory() {
  // Clear the serach history
  document.getElementById("searchhistory").replaceChildren();
  /*
  let newitem = document.createElement("li");
  newitem.classList.add("menu-title");
  newitem.textContent = "Search History";

  document.getElementById("searchhistory").appendChild(newitem);
  */
  for (var i = config.dataobj.searchistory.length - 1; i >= 0; i--) {
    var newitem = document.createElement("li");
    newitem.innerHTML =
      '<a class="placename" data-lat="' +
      config.dataobj.searchistory[i].lat +
      '" data-lng="' +
      config.dataobj.searchistory[i].lng +
      '">' +
      config.dataobj.searchistory[i].name +
      "</a>";
    document.getElementById("searchhistory").appendChild(newitem);
  }
}

// Reposition the map to locally configured latitude, longitude
function centermap(placename) {
  // Documentation:
  // https://developers.google.com/maps/documentation/embed/embedding-map
  var citychoice = document.getElementById("citychoice");
  var maplink =
    "https://www.google.com/maps/embed/v1/place?key=" +
    myapikeys.google +
    "&center=" +
    citychoice.dataset.latitude +
    "," +
    citychoice.dataset.longitude +
    "&zoom=8&q=" +
    encodeURIComponent(placename);
  // console.log("Centering map to: ", maplink);
  document.getElementById("mainmap").setAttribute("src", maplink);
}

// Start main() body of code

// getapikey();

config.load_data();

displaysearchhistory();

displayunitconfig();

call_api(
  "https://api.unsplash.com/photos/random?query=clouds&orientation=landscape&count=1&per_page=1&client_id=" +
    myapikeys.unsplash
);

document.querySelector("#find-me").addEventListener("click", geoFindMe);

// The user clicks on the get weather button. If the city name is in the searchistory, bring it to the top.
document.querySelector("#getweather").addEventListener("click", function () {
  let city = document.getElementById("citychoice").value.trim(); // sanitize input

  if (city) {
    // check if the city is already in the search history
    let index = config.dataobj.searchistory.findIndex(function (elem) {
      return elem.name.toLowerCase() === city.toLowerCase();
    });
    if (index >= 0) {
      // console.log(city, " is found in the history list at ", index);
      var tempcity = config.dataobj.searchistory[index];
      config.dataobj.searchistory.splice(index, 1); // 2nd parameter means remove one item only
      config.dataobj.searchistory.push(tempcity);
      config.dataobj.latitude = tempcity.lat;
      config.dataobj.longitude = tempcity.lng;
      displaysearchhistory();
      config.store_data();
    } else {
      config.dataobj.searchistory.push({ name: city, lat: config.dataobj.latitude, lng: config.dataobj.longitude }); // if not, add the city to the search history
      // console.log("Added city ", city, " to ", config.dataobj.searchistory);
      displaysearchhistory();
      config.store_data();
    }
    centermap(city);
    getweather(city);
    getforecast(city);
    rendercityimage(city.toLowerCase());
  } else {
    document.getElementById("citychoice").value = "Please enter a city";
  }
});

// Click on search history // TODO: check function
document.getElementById("searchhistory").addEventListener("click", function (event) {
  event.preventDefault();
  if (event.target.classList.contains("placename")) {
    var cityinput = document.getElementById("citychoice");
    cityinput.value = event.target.textContent;
    cityinput.dataset.latitude = event.target.dataset.lat;
    cityinput.dataset.longitude = event.target.dataset.lng;
    // console.log("clicked on searchhistory: ", event.target);
    config.dataobj.latitude = event.target.dataset.lat;
    config.dataobj.longitude = event.target.dataset.lng;
  }
});

// City choice: Click on search city, which should pop out cityoptions below
document.getElementById("lookupcity").addEventListener("click", function (event) {
  event.preventDefault();
  // console.log("click on lookupcity button: ", document.getElementById("citychoice").value.trim());
  if (document.getElementById("citychoicedetails").hasAttribute("open")) {
    document.getElementById("citychoicedetails").removeAttribute("open");
  } else {
    var citychoice = document.getElementById("citychoice").value.trim();
    if (citychoice.length > 0) {
      getplacelocation(encodeURIComponent(document.getElementById("citychoice").value.trim()));
    } else {
      document.getElementById("nocityname_modal").open = true;
    }
  }
});

// City choice: Click selecting city options after clicking lookupcity above
document.getElementById("cityoptions").addEventListener("click", function (event) {
  event.preventDefault();
  // console.log(
  //   "clicked on cityoptions button: ",
  //   event.target.textContent,
  //   event.target.dataset.longitude,
  //   event.target.dataset.latitude
  // );
  var citychoice = document.getElementById("citychoice");
  citychoice.value = event.target.textContent;
  citychoice.dataset.latitude = event.target.dataset.latitude;
  citychoice.dataset.longitude = event.target.dataset.longitude;
  config.dataobj.latitude = event.target.dataset.latitude;
  config.dataobj.longitude = event.target.dataset.longitude;
  // console.log("config ", config.dataobj);
  document.getElementById("citychoicedetails").removeAttribute("open");
});

// Menu: display the default units (C/F) on the navbar menus
function displayunitconfig() {
  let unitselector = document.getElementsByClassName("unitselector");
  for (j = 0; j < unitselector.length; j++) {
    unitselector[j].firstElementChild.textContent = "Units: " + config.dataobj.units;
    // console.log(unitselector[j].getAttribute("open"));
    unitselector[j].removeAttribute("open");
    // console.log(unitselector[j].getAttribute("open"));
  }
}

// Menu: add event listeners to unit selection menu items.
var menus = document.getElementsByClassName("menuselection-units");
for (var i = 0; i < menus.length; i++) {
  menus[i].addEventListener("click", function (event) {
    // console.log("tag: ", event.target.tagName);
    if (event.target.tagName === "A") {
      config.dataobj.units = event.target.dataset.units;
      displayunitconfig();
      config.store_data();
    }
  });
}

// Clear history and save it to localstorage
function clearhistory(event) {
  // console.log("clear history clicked");
  if (confirm("Clear the City Search history?")) {
    config.dataobj.searchistory = [];
    config.store_data();
    displaysearchhistory();
    // console.log("key cleared");
  }
}

// Menu: add event listener to clear history on both responsive menus
document.getElementById("clearhistory").addEventListener("click", clearhistory);
document.getElementById("clearhistory2").addEventListener("click", clearhistory);

// Today's Weather: add event listener to collapse day's cards
document.getElementById("todayscard").addEventListener("click", function (event) {
  event.preventDefault();
  // console.log(event, " --- ", event.currentTarget);
  document.getElementById("dayforecast").classList.toggle("w-0");
  document.getElementById("dayforecast").classList.toggle("h-0");
  // console.log("toggle ", document.getElementById("dayforecast").classList);
});

/* example api calls

Google API reverse geocoding
https://maps.googleapis.com/maps/api/elevation/json?locations=1.2985181,103.8332306&key={api_key}
https://maps.googleapis.com/maps/api/geocode/json?latlng=1.2985181,103.8332306&key={api_key}

Open Weathermap reverse geocoding api call:
http://api.openweathermap.org/geo/1.0/reverse?lat=1.2985181&lon=103.8332306&limit=&appid={api_key}

Open weathermap day forecast
https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}
https://api.openweathermap.org/data/2.5/weather?lat=1.2985181&lon=103.8332306&appid={api_key}

Open weathermap OneCall API
https://api.openweathermap.org/data/3.0/onecall?lat=1.2985181&lon=103.8332306&exclude={part}&appid={API key}

Unsplash official API to retrieve random images from a search query
https://api.unsplash.com/photos/random?query=Seattle&orientation=landscape&count=10&client_id={apikey}
https://images.unsplash.com/photo-1547640084-1dfcc7ef3b22?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.0.3&q=85&ixid={apikey}

Unsplash source random image query (no API key required)
https://source.unsplash.com/1600x900/?Seattle

Teleport city images (no API key required) - some from Flickr
https://api.teleport.org/api/urban_areas/slug:seattle/images/

*/
