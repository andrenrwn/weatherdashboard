// Global variables
//var latitude = 1.2985181;
//var longitude = 103.8332306; // default location under the global scope

var latitude = 9.643097;
var longitude = 95.642956; // default location under the global scope

// var apikey_openstreetmap = "";
// var apikey_openweather = "";
// var apikey_google = "";

var myapikey = ""; // Don't store the API key in the src code

// Define today's forecast cards in html
function createElementFromHTML(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild;
}
var daycard = createElementFromHTML(
  `
    <div class="card flex shadow-xl bg-opacity-90 hover:bg-opacity-50">
      <figure class="px-1 pt-1">
        <img
          src="https://openweathermap.org/img/wn/10d@2x.png"
          alt="day"
          class="rounded-xl"
        />
      </figure>
      <div class="card-body m-2 p-2">
        <h2 class="card-title">11 am</h2>
        <p>
          Temp: <span>30.2 C</span><br />
          Humidity: <span>68</span><br />
          Wind: <span>5.47 Kph</span>
        </p>
      </div>
    </div>
`
);

// Create an object to get/store search history and preferences
class weatherdashdata {
  constructor() {
    this.dataobj = {};
    this.dataobj.searchistory = []; // ["Singapore", "Seattle", "Tokyo", "Amsterdam", "Sydney"];
    this.dataobj.units = "metric";
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
}

var config = new weatherdashdata(); // store the history and metric settings in the object "config".

// Store an API key in local storage
function getapikey() {
  let loadedapikey = localStorage.getItem("apikey");

  // If we don't have an API key, ask it from the user
  if (loadedapikey) {
    myapikey = loadedapikey;
  } else {
    console.log(!myapikey, myapikey);
    while (!myapikey) {
      myapikey = prompt("Please enter an API key", "");
      let text = "You entered " + myapikey + "\nStore this key in localstore?";
      console.log(text);
      if (confirm(text)) {
        localStorage.setItem("apikey", myapikey);
        console.log("key stored");
      } else {
        myapikey = "";
        console.log("key cleared");
        break;
      }
    }
  }
}

function rendercityimage(city) {
  // Teleport API city images
  let apilink = "https://api.teleport.org/api/urban_areas/slug:" + city + "/images/";

  //bg-[url('./assets/images/singapore_web-64dc53f309.jpg')] // teleport class
  // document.getElementById('todaysdash').style.backgroundImage = 'url("./assets/06-server-side-apis-homework-demo.png")';
  //content.photos[0].image.web

  function errorCallback(error) {
    console.log("Error:", error.message);
  }

  fetch(apilink)
    .then(function (response) {
      if (response.ok) {
        // console.log(response);
        response.json().then(function (data) {
          console.log(data);
          console.log("image is at: " + data.photos[0].image.web);
          document.getElementById("todaysdash").style.backgroundImage = 'url("' + data.photos[0].image.web + '")';
        });
      } else {
        alert("Error: " + response.statusText);
      }
    })
    .catch(function (error) {
      console.log("Error:", error);
    });
}

// Get weather data
//   api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API key}
//   api.openweathermap.org/data/2.5/forecast?q={city name}&appid={API key}
function getforecast(city) {
  let forecast = JSON.parse(testforecast);

  // Display first day's forecast
  let thisdate = dayjs.unix(forecast.list[0].dt);
  let prevdate = thisdate;
  let firstdate = thisdate;
  let i = 0;

  // Display the city's name and date on the main dashboard
  document.getElementById("selectedcity").textContent = city;
  document.getElementById("todaysdate").textContent = thisdate.format("dddd D MMMM YYYY");

  // Clear first day card
  document.getElementById("todaysweather").replaceChildren();
  document.getElementById("fivedayforecast").replaceChildren();

  while (i < forecast.list.length) {
    while (thisdate.date() === prevdate.date()) {
      let wtemp = Math.round((forecast.list[i].main.temp - 273.15) * 10) / 10;
      let whumidity = forecast.list[i].main.humidity;
      let wspeed = forecast.list[i].wind.speed;
      let ticon = forecast.list[i].weather[0].icon;
      let w_isday = ticon.charAt(ticon.length - 1) === "d"; // is it day or night?
      let wicon = "https://openweathermap.org/img/wn/" + ticon + "@2x.png";
      let wdescription = forecast.list[i].weather[0].description;
      console.log(
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
      );

      let newdaycard = daycard.cloneNode(true);
      newdaycard.querySelector("div > figure > img").src = wicon;
      newdaycard.querySelector("div > div > h2").textContent = thisdate.format("h a");
      newdaycard.querySelector("div > div > p").innerHTML =
        wdescription + "<br>" + "🌡 " + wtemp + "C<br>🌢 " + whumidity + "%<br>🌬: " + wspeed + "Kph";
      if (w_isday) {
        newdaycard.classList.add("bg-cyan-200", "text-black");
      } else {
        newdaycard.classList.add("bg-black", "text-white");
      }

      // Render first day card
      if (thisdate.date() === firstdate.date()) {
        document.getElementById("todaysweather").appendChild(newdaycard);
      } else {
        newdaycard.querySelector("div > div > h2").innerHTML = thisdate.format("DD/MM<br>h a");
        document.getElementById("fivedayforecast").appendChild(newdaycard); // or the five-day cards
      }

      i++;
      if (i >= forecast.list.length) {
        break;
      } else {
        thisdate = dayjs.unix(forecast.list[i].dt);
      }
    }

    prevdate = thisdate;

    console.log("-------------------");
  }

  /* debug
  for (var i = 0; i < forecast.list.length; i++) {
    var x = dayjs.unix(forecast.list[i].dt);
    console.log(
      forecast.list[i].dt_txt,
      " --- ",
      x.format(),
      " temp: ",
      forecast.list[i].main.temp - 273.15
    );
  }
  */
}

// Render the map and autocomplete text after we get the city locale name of the user's current location
function setplacename(position) {
  let localename = "";
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;

  // Example openweathermap reverse geocoding api call:
  // http://api.openweathermap.org/geo/1.0/reverse?lat=1.2985181&lon=103.8332306&limit=&appid=

  // Get the city name of the user's position with google API
  var apilink =
    "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + latitude + "," + longitude + "&key=" + myapikey;

  /*  Uncomment to allow API calls out
    function errorCallback(error) {
        console.log('Error:', error.message);
    }

    fetch(apilink2)
        .then(function (response) {
            if (response.ok) {
                // console.log(response);
                response.json().then(function (data) {
                    //console.log(data);
                    if (data.plus_code.compound_code) {
                        console.log("We are in " + data.plus_code.compound_code.split(" ")[1]);
                    } else {
                        console.log("We're in the middle of nowhere");
                    }
                });
            } else {
                alert('Error: ' + response.statusText);
            }
        })
        .catch(function (error) {
            console.log('Error:', error);
        });
    */

  /********** Use debug googleapi response testdata (so we don't have to call the API while developing) 
  let data = JSON.parse(testdata);
  console.log(data);
  console.log(data.plus_code);
  if (data.plus_code.compound_code) {
    localename = data.plus_code.compound_code.split(" ")[1];
    console.log("We are in " + localename);

    // set the city search input text
    document.getElementById("citychoice").value = localename;
  } else {
    console.log("We're in the middle of nowhere");
  }
  ************ googleapi respnose testdata */

  /*********** openweather reverse geocoding */
  let data = JSON.parse(testowcity);
  console.log(data);
  localename = data[0].name;
  if (data[0].name) {
    localename = data[0].name;
    console.log("We are in " + localename);

    // set the city search input text
    document.getElementById("citychoice").value = localename;
  } else {
    console.log("We're in the middle of nowhere");
  }
  /**** /openweather reverse geocoding */

  return localename;
}

// Try retrieving the current position of the user
function geoFindMe() {
  const status = document.querySelector("#status");
  const mapLink = document.querySelector("#map-link");

  mapLink.href = "";
  mapLink.textContent = "";

  // Display user's position
  function success(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;

    // Display user's position on an a href link
    status.textContent = "";
    mapLink.href = `https://www.openstreetmap.org/#map=11/${latitude}/${longitude}`;
    mapLink.textContent = `Latitude: ${latitude} °, Longitude: ${longitude} °`;

    setplacename(position);
  }

  function error() {
    status.textContent = "Unable to retrieve your location";
  }

  if (!navigator.geolocation) {
    status.textContent = "Geolocation is not supported by your browser";
  } else {
    status.textContent = "Locating…";
    navigator.geolocation.getCurrentPosition(success, error);
  }
}

// Start main body of code

getapikey();

config.load_data();

document.querySelector("#find-me").addEventListener("click", geoFindMe);

document.querySelector("#getweather").addEventListener("click", function () {
  let city = document.getElementById("citychoice").value.trim();
  if (city) {
    if (config.dataobj.searchistory.find(function (elem) { if (elem.toLowerCase() === city.toLowerCase()) {return elem;}})) {
      console.log(city, " is found in the history list");
    } else {
      config.dataobj.searchistory.push(city);
      console.log("Added city ", city, " to ", config.dataobj.searchistory);
      config.store_data();
    }
    getforecast(city);
    rendercityimage(city.toLowerCase());
  } else {
    document.getElementById("citychoice").value = "Please choose a city";
  }
});

/* example calls
Google API reverse geocoding
https://maps.googleapis.com/maps/api/elevation/json?locations=1.2985181,103.8332306&key={api_key}
https://maps.googleapis.com/maps/api/geocode/json?latlng=1.2985181,103.8332306&key={api_key}
*/
