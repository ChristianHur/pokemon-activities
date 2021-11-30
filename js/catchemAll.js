/* global google */

// starting location
var startLatitude, startLongitude;

// current location
var curLatitude, curLongitude;

// Google map
var map = null;
var curZoom = 2;

var _draggable = false;
var _clickable = true;
var score = 0;          //current score
var highScore = 0;      //high score
var delayTime = 5000;   // milliseconds
var points = 10;        //minimum points per catch
var caught = false;

var timeOut = false;       //timeOut or caught it

//The JSON object data
var pokeList, jsonText; //= (window.localStorage.getItem("Pokemons"));
var pokeData;


function getLocation() {

    // asynchronous call with callback success,
    // error functions and options specified

    //Load the existing list
    loadPokemonList();

    var options = {
        enableHighAccuracy: true,
        timeout: 50000,
        maximumAge: 1
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(displayInitialLocation, handleError, options);
    } else {
        alert("Geolocation is not available");
    }

}


function loadPokemonList() {

    //Check to see if local storage already existed
    pokeList = JSON.parse(window.localStorage.getItem("Pokemons"));

    console.log("INITIAL: " + pokeList);
    //if local storage is empty then load XML via AJAX
    if (!pokeList || pokeList === undefined) {
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", "pokemons.xml", true);

        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                setupLocalStorage(xhttp);
            }
        };
        xhttp.onerror = function (e) {
            console.error(xhttp.statusText);
        };

        xhttp.send();

        //Local storage already existed -- just use it!
    } else {
        console.log("Load data from LocalStorage...");
    }

}


//Callback function to load XML to JSON and save to local storage
function setupLocalStorage(xml) {

    var xmlDoc = xml.responseXML;
    var x = xmlDoc.getElementsByTagName("pokemon");

    //Create JSON text
    jsonText = '{"pokemons": [';

    //Loop through the XML and extract node values
    for (var i = 0; i < x.length; i++) {
        var id = x[i].getElementsByTagName("id")[0].childNodes[0].nodeValue;
        var name = x[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
        var lat = x[i].getElementsByTagName("lat")[0].childNodes[0].nodeValue;
        var lng = x[i].getElementsByTagName("lng")[0].childNodes[0].nodeValue;
        var photo = x[i].getElementsByTagName("photo")[0].childNodes[0].nodeValue;
        var date = x[i].getElementsByTagName("date")[0].childNodes[0].nodeValue;

        //Build internal arrays
        jsonText += '{"id":' + id +
            ',"name":"' + name +
            '","lat":"' + lat +
            '","lng":"' + lng +
            '","photo":"' + photo +
            '","date":"' + date + '"}';

        //Add array separator
        if (i != x.length - 1)
            jsonText += ',';
    }
    jsonText += ']}';

    //Parse string to JSON Object Data
    pokeList = JSON.parse(jsonText);

    console.log(("Pokelist: " + pokeList));

    //Save to localStorage
    updateLocalStorage();

    console.log("Load data from AJAX...");

}

//Update the local storage after each successful drop event
function updateLocalStorage() {
    window.localStorage.clear();
    window.localStorage.setItem("Pokemons", JSON.stringify(pokeList));
    console.log("Saved to localStorage!");
}

//Load user's current device location
function displayInitialLocation(position) {

    startLatitude = position.coords.latitude;
    startLongitude = position.coords.longitude;
    curLatitude = startLatitude;
    curLongitude = startLongitude;

    // Show the google map with the position
    showOnMap(position.coords)

}


function handleError(error) {
    switch (error.code) {
        case 1:
            updateStatus("The user denied permission");
            break;
        case 2:
            updateStatus("Position is unavailable");
            break;
        case 3:
            updateStatus("Timed out");
            break;
    }
}


// initialize the map and show the position
function showOnMap(pos) {

    var googlePosition = new google.maps.LatLng(pos.latitude, pos.longitude);

    var mapOptions = {
        zoom: curZoom,
        center: googlePosition,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        draggableCursor : "url(bg/pokeball-32x32.png), auto",   //custom cursor
        draggingCursor :  "url(bg/pokeball-32x32.png), auto"    //custom cursor
    };

    var mapElement = document.getElementById("main-map");
    map = new google.maps.Map(mapElement, mapOptions);

    addMarker(map, getRandCoords());

}

// Function to add position marker to the map
function addMarker(map, latlongPosition, title, content, markerIcon) {

    timeOut = false;
    var rand = Math.floor((Math.random() * pokeList.pokemons.length - 1) + 1);
    console.log(rand);

    curZoom = map.getZoom();

    var markerIcon = {
        url: pokeList.pokemons[rand].photo,
        //size: new google.maps.Size(42,68),
        origin: new google.maps.Point(0, 0),
        scaledSize: new google.maps.Size(50, 50)
    };

    title = pokeList.pokemons[rand].name;

    var markerOptions = {
        position: latlongPosition,
        map: map,
        title: title,
        clickable: _clickable === true,
        animation: google.maps.Animation.DROP,
        draggable: _draggable === true,
        icon: markerIcon
    };

    //Default date
    var d = new Date();
    var defaultDate  = (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear();
    pokeData =
    {
        "id": Math.floor((Math.random() * 1000000000) + 1),
        "name": pokeList.pokemons[rand].name,
        "lat":  latlongPosition.lat(),
        "lng":  latlongPosition.lng(),
        "date": defaultDate,
        "photo": pokeList.pokemons[rand].photo
    };

    //Place a marker
    var marker = new google.maps.Marker(markerOptions);

    //============ Marker InfoWindow options ===================================//
    var popupWindowOptions = {
        content: content,
        position: latlongPosition,
        maxWidth: 120

    };

    var popupWindow = new google.maps.InfoWindow(popupWindowOptions);

    //Click a Pokemon to catch it and earn points
    google.maps.event.addListener(marker, 'click', function () {

        score += points * (map.getZoom() == 0 ? 1 : map.getZoom());
        caught = true;
        updateScore();
        marker.setMap(null);    //clear Marker

    });


    //=============================================================//
    //Generate new Pokemon on map
    function newPokemon() {

       //Save the Pokemon caught
        if (caught) {
            save();
            caught = false;
        }

        marker.setMap(null);    //clear Marker

        timeOut = true;

        //random coordinates

        //Spawn a new Pokemon
        addMarker(map, getRandCoords());
    }

    //delayTime before a new Pokemon spawn
    setTimeout(function () {
        newPokemon()
    }, delayTime); //seconds to capture

    return marker;
}

//Update score on DOM
function updateScore() {
    document.getElementById("score").innerHTML = "Score: " + score;
}

function getRandCoords(){
    var rndLat = Math.ceil(Math.random() * (180)) - 85;
    var rndLng = Math.ceil(Math.random() * (360)) - 180;
    var googlePosition = new google.maps.LatLng(rndLat, rndLng);
    return googlePosition;
}

//Save data to localStorage
function save(){

    pokeList['pokemons'].push(pokeData);
    window.localStorage.clear();
    window.localStorage.setItem("Pokemons", JSON.stringify(pokeList));
    console.log("Caught " + pokeData.name)
    //window.location.assign("index.html");

}