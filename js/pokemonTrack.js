/* global google */

// starting location
var startLatitude, startLongitude;

// current location
var curLatitude, curLongitude;

// Google map
var map = null;
var curZoom = 3;

var _draggable = false;
var _clickable = true;

//The current marker InfoWindow
var curInfoWindow;

//The JSON object data
var pokeList, jsonText; //= (window.localStorage.getItem("Pokemons"));


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
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var mapElement = document.getElementById("main-map");
    map = new google.maps.Map(mapElement, mapOptions);

    //Loop through JSON data and display each marker
    pokeList.pokemons.forEach(function (item,index) {
        var markerIcon = {
            url: item.photo,
            //size: new google.maps.Size(42,68),
            origin: new google.maps.Point(0, 0),
            scaledSize: new google.maps.Size(50, 50)
        };

        title = item.name;

        googlePosition = new google.maps.LatLng(item.lat, item.lng);
        var content = "<p class='pokemon-title'>" + item.name.toUpperCase() + "</p>" +
            "<span class='pokemon-label'>Lat:</span> <span>" + parseFloat(item.lat).toFixed(5) + "</span>" +
            "<br><span class='pokemon-label'>Long:</span> <span>" + parseFloat(item.lng).toFixed(5) + "</span>" +
            "<br><span class='pokemon-label'>Date:</span> <span>" + item.date + "</span>" +
            "<img class='gg' src='" + item.photo + "' alt='" + item.name.toUpperCase() + "''>";

        addMarker(map, googlePosition, title, content, markerIcon);
    });

}


// Function to add position marker to the map
function addMarker(map, latlongPosition, title, content, markerIcon) {

    var markerOptions = {
        position: latlongPosition,
        map: map,
        title: title,
        clickable: _clickable === true,
        animation: google.maps.Animation.DROP,
        draggable: _draggable === true,
        icon: markerIcon
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

    //Click a marker to show marker information
    google.maps.event.addListener(marker, 'click', function () {

        //Close the current InfoWindow if it's opened
        if (curInfoWindow != null) {
            curInfoWindow.close();
        }
        popupWindow.open(map);
        curInfoWindow = popupWindow;

        // map.panTo(marker.getPosition());
    });

    //Click anywhere on map to close current InfoWindow
    google.maps.event.addListener(map, 'click', function () {
        curInfoWindow.close();
    });

    //========= Mouseover to open, Mouseout to close ===============//
    // google.maps.event.addListener(marker, 'mouseover', function() {
    //     popupWindow.open(map);
    //    // map.panTo(marker.getPosition());
    // });


    // google.maps.event.addListener(marker, 'mouseout', function() {
    //     popupWindow.close();
    // });
    //=============================================================//

    return marker;
}
