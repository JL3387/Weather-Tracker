'use strict'

//cors sharing
function weatherRequest(url, successfulCall) {
  let req;

  if(XMLHttpRequest) {
    req = new XMLHttpRequest();

    if('withCredentials' in req) {
        req.open('GET', url, true);
        req.onreadystatechange = function() {
          if (req.readyState === 4) {
            if (req.status >= 200 && req.status < 400) {
              successfulCall(req);
            } else {
              console.error('Status: ' + req.status);
              console.error('StatusText: ' + req.statusText);
            }
          }
        };
      req.send();
    }
  }
}

//get users location on load
(function() {

  let geoOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  }

  function success(pos) {
    if(!'geolocation' in navigator) {
      console.warn("You don't have geolocation enabled");
    } else {
      weatherByCoords(pos);
    }
  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  //plug in coords and send to cors function
  function weatherByCoords(pos) {
    let crd = pos.coords;
    weatherRequest('http://api.wunderground.com/api/b99b8321e01431a9/conditions/q/' + crd.latitude + ',' + crd.longitude + '.json', currentWeatherResponse);
    weatherRequest('http://api.wunderground.com/api/b99b8321e01431a9/forecast/q/' +  crd.latitude + ',' + crd.longitude + '.json', forecastResponse);
}

  navigator.geolocation.getCurrentPosition(success, error, geoOptions);
})();

//create current weather area
function currentWeatherResponse(req) {
  let response = JSON.parse(req.response).current_observation;
  document.getElementById('currentCondition').innerHTML = '<h1>' + response.display_location.full + '</h1>' + '<br />' +
  '<h3>' + 'Current Conditions' + '</h3>' + '<br />' +
  '<img ' + 'src=' + response.icon_url + ' alt=' + '"' + response.icon + '"' + '/>' + '<br />' +
  '<h4>' + response.temp_f + '&#176' + 'F' + '</h4>' + '<br />' +
  '<h4>' + 'Feels Like ' + response.feelslike_f + '&#176' + 'F' + '</h4>';
}

//create future forecast area
function forecastResponse(req) {
  let response;
  let timeAndDayElement;
  for(let i = 0; i < document.getElementsByClassName('timeAndDay').length; i++) {
    response = JSON.parse(req.response).forecast.txt_forecast.forecastday[i+1];
    timeAndDayElement = document.getElementsByClassName('timeAndDay')[i];
    timeAndDayElement.querySelector('.time').innerHTML = '<h4>' + response.title + '</h4>';
    timeAndDayElement.querySelector('.weatherIcon').innerHTML = '<img ' + 'src = ' + response.icon_url + ' alt = ' + response.icon + '/>';
    timeAndDayElement.querySelector('.condition').innerHTML = '<p>' + response.fcttext + '</p>';
  }
}

function myDisplayFunction(myObj) {
  let cityLink;
  let cityResults = myObj.RESULTS;
  let city = cityResults.slice(0, 5); // slice users cities match to avoid referance error, only want to display 1st 5 matched cities
  const dropDownMatches = document.getElementById('citiesMatchDropdown');
  dropDownMatches.innerHTML = ' ';
  for(let i = 0; i < city.length; i++) {
    //create city elements in drop down
    cityLink = document.createElement('a');
    cityLink.setAttribute('href', '#');
    cityLink.setAttribute('class', 'city');
    cityLink.innerHTML = (city[i].name); //i is the cities returned from WU autocomplete api after slicing them
    cityClickEvent(cityLink); //add click event to each city that is created
    dropDownMatches.appendChild(cityLink);
  }
}

function cityClickEvent(cityLink) {
  cityLink.onclick = function() {
    weatherRequest('http://api.wunderground.com/api/b99b8321e01431a9/conditions/q/' + this.innerHTML + '.json', currentWeatherResponse);
    weatherRequest('http://api.wunderground.com/api/b99b8321e01431a9/forecast/q/' +  this.innerHTML + '.json', forecastResponse);
    document.getElementById('usersLocation').value = '';
    document.getElementById('citiesMatchDropdown').innerHTML = '';
  }
}

//when user types in location and releases the key the drop drop down cities is updated
document.getElementById('usersLocation').onkeyup = function() {
  const input = document.getElementById('usersLocation');
  const dropDownMatches = document.getElementById('citiesMatchDropdown');
  let response;
  if(input.value.length >= 2) { //only show drop down if input string is equal or greater than 2
    let s = document.createElement('script');
    s.src = 'http://autocomplete.wunderground.com/aq?query=' + input.value +'&cb=myDisplayFunction';
    dropDownMatches.appendChild(s); //add and remove the returned cities autocomplete api request so it doesn't clutter html
    dropDownMatches.removeChild(s);
  } else {
    dropDownMatches.innerHTML = ''; //if input value is less than 2 clear drop down
  }
}


// when user clicks value input show cities drop down
document.getElementById('usersLocation').onfocus = function() {
document.getElementById('citiesMatchDropdown').classList.remove('hide');
}

// when the user clicks in outside of user input hide drop down
window.onclick = function(e) {
  if(!e.target.matches('#usersLocation')) {
    let dropDown = document.getElementById('citiesMatchDropdown');
    if(!dropDown.classList.contains('hide')) {
      dropDown.classList.add('hide');
    }
  }
}
