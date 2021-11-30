/* global google */
//Sources:
// http://www.geoimgr.com/en/tool
// http://www.htmlgoodies.com/html5/javascript/drag-files-into-the-browser-from-the-desktop-HTML5.html#fbid=9cuL6fUzzKO


// starting location
var startLatitude, startLongitude;

// Google map
var map = null;

// Path
var path = [];

//Marker info
var title = "Location Details";
var curZoom = 3;
//var marker;
var allMarkers = Array();
var pokeData;
var popupWindow;
var _clickable = true;
var _draggable = true;

//Default Pokeman name
var newPokemon = "Pikachu";

//File info
var curFileName;
var newFileName;
var binImg;

//DOM objects
var dropTitle;
var dropDate;
var defaultDate;
var dropLatitude;
var dropLongitude;

//JSON data
var pokeList;

//Get the initial location and place marker on map
function getLocation() {

    // asynchronous call with callback success, 
    // error functions and options specified

    pokeList = JSON.parse(window.localStorage.getItem("Pokemons"));

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

//Place marker on map
function displayInitialLocation(position) {

    //startLatitude = dropLatitude !== undefined ? dropLatitude.value : position.coords.latitude;
    //startLongitude = dropLongitude !== undefined ? dropLongitude.value : position.coords.longitude;
    //newFileName = dropTitle !== undefined ? dropTitle.value : "Temp Title";

    curFileName = newFileName !== undefined ? newFileName.toUpperCase() : newPokemon.toUpperCase();

    var d = new Date();
    defaultDate  = (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear();
    pokeData =
    {
        "id": Math.floor((Math.random() * 1000000000) + 1),
        "name": curFileName.toUpperCase(),
        "lat":  position.coords.latitude,
        "lng":  position.coords.longitude,
        "date": defaultDate,
        "photo": binImg !== undefined ? binImg : "images/pikachu.png"
    };

    // Show the google map with the position
    showOnMap(position.coords);

    addAll()

    buttonOverlay();
}

//Update and display coordinates on DOM
function displayLocationCoords() {
    document.getElementById("drop-latitude").value = parseFloat(pokeData.lat).toFixed(5);
    document.getElementById("drop-longitude").value = parseFloat(pokeData.lng).toFixed(5);
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

    // var googlePosition = new google.maps.LatLng(pos.latitude, pos.longitude);
    var googlePosition = new google.maps.LatLng(pokeData.lat, pokeData.lng);
    var mapOptions = {
        zoom: curZoom,
        center: googlePosition,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var mapElement = document.getElementById("map");
    map = new google.maps.Map(mapElement, mapOptions);

    //add the marker to the map
    var markerIcon = { url:pokeData.photo,
        //size: new google.maps.Size(42,68),
        origin: new google.maps.Point(0, 0),
        scaledSize: new google.maps.Size(50, 50)};

        content = getContent();

    if (newFileName !== undefined) {
        addMarker(map, googlePosition, title, content, markerIcon);
    }
}

//Save data to localStorage
function save(){
    pokeList['pokemons'].push(pokeData);
    window.localStorage.clear();
    window.localStorage.setItem("Pokemons", JSON.stringify(pokeList));

    window.location.assign("index.html");
}

//Update the Pokeman name
function updateTitle() {

    if (dropTitle.value.toLowerCase() != curFileName.toLowerCase()) {
        curZoom = map.getZoom();
        pokeData.name = dropTitle.value.capitalize();
       // getLocation();
    }
}

//Update the date
function updateDate() {
    pokeData.date = dropDate.value;
}

//Update the marker coordinates
function updateMarker() {

    //Remove previous Marker.
    if (marker != null) {
        marker.setMap(null);
    }

    //Update current coordinates
    pokeData.lat = document.getElementById("drop-latitude").value;
    pokeData.lng = document.getElementById("drop-longitude").value;
    displayLocationCoords();

    //Set new Marker location on Map
    var googlePosition = new google.maps.LatLng(pokeData.lat, pokeData.lng);
    var markerIcon = { url:pokeData.photo,
        origin: new google.maps.Point(0, 0),
        scaledSize: new google.maps.Size(50, 50)};

    var content = getContent();
    var title = pokeData.name;

    addMarker(map, googlePosition, title, content, markerIcon);

}

function addAll(){
    //Loop through JSON data and display each marker

    pokeList.pokemons.forEach(function (item) {
        var markerIcon = {
            url: item.photo,
            //size: new google.maps.Size(42,68),
            origin: new google.maps.Point(0, 0),
            scaledSize: new google.maps.Size(50, 50)
        };

        googlePosition = new google.maps.LatLng(item.lat, item.lng);
        var content = "<p class='pokemon-title'>" + item.name.toUpperCase() + "</p>" +
            "<span class='pokemon-label'>Lat:</span> <span>" + parseFloat(item.lat).toFixed(5) + "</span>" +
            "<br><span class='pokemon-label'>Long:</span> <span>" + parseFloat(item.lng).toFixed(5) + "</span>" +
            "<br><span class='pokemon-label'>Date:</span> <span>" + item.date + "</span>" +
            "<img class='gg' src='" + item.photo + "' alt='" + item.name.toUpperCase() + "''>";
        //addMarker(map, googlePosition, title, content, markerIcon);

        var markerOptions = {
            position: googlePosition,
            map: map,
            title: item.name,
            clickable: true,
            draggable: false,
            icon: markerIcon
        };

        //Place the marker
        tempMarker = new google.maps.Marker(markerOptions);
        allMarkers.push(tempMarker);

    });

    hideAll();
}


function showAll(){
    // hide all the markers
    for(var i = 0 ; i< allMarkers.length; i++) allMarkers[i].setVisible(true);
}

function hideAll(){
    // hide all the markers
    for(var i = 0 ; i< allMarkers.length; i++) allMarkers[i].setVisible(false);
}

function ShowHideControls(controlDiv, map) {

    // Set CSS for the Show All control border.
    var controlUI = document.createElement('div');
    var att = document.createAttribute("id");
    att.value = "showAll";
    controlUI.setAttributeNode(att);
    controlUI.style.backgroundColor = '#FCB362';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '2px';
    controlUI.style.textAlign = 'center';
    controlUI.style.width = '80px';
    controlUI.title = 'Click to show all Pokemons';
    controlDiv.appendChild(controlUI);

    // Set CSS for the Show All control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Show All';
    controlUI.appendChild(controlText);

    // Setup the click event listeners: display all Pokemons on map.
    controlUI.addEventListener('click', function() {
        showAll();
        controlUI2.style.display = 'block';
        controlUI.style.display = 'none';
    });

    // Set CSS for the Hide All control border.
    var controlUI2 = document.createElement('div');
    var att2 = document.createAttribute("id");
    att2.value = "hideAll";
    controlUI.setAttributeNode(att2);
    controlUI2.style.backgroundColor = '#000';
    controlUI2.style.border = '2px solid #fff';
    controlUI2.style.borderRadius = '3px';
    controlUI2.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI2.style.cursor = 'pointer';
    controlUI2.style.marginBottom = '2px';
    controlUI2.style.textAlign = 'center';
    controlUI2.style.display = 'none';
    controlUI2.style.width = '80px';
    controlUI2.title = 'Click to hide all Pokemons';
    controlDiv.appendChild(controlUI2);

    // Set CSS for the Hide All control interior.
    var controlText2 = document.createElement('div');
    controlText2.style.color = '#FCB362';
    controlText2.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText2.style.fontSize = '16px';
    controlText2.style.lineHeight = '38px';
    controlText2.style.paddingLeft = '5px';
    controlText2.style.paddingRight = '5px';
    controlText2.innerHTML = 'Hide All';
    controlUI2.appendChild(controlText2);

    // Setup the click event listeners: hide all Pokemons on map.
    controlUI2.addEventListener('click', function() {
        hideAll();
        controlUI2.style.display = 'none';
        controlUI.style.display = 'block';
    });

}

function buttonOverlay() {

    // Create the DIV to hold the control and call the CenterControl()
    // constructor passing in this DIV.
    var overlayControlDiv = document.createElement('div');
    var overlayControl = new ShowHideControls(overlayControlDiv, map);

    overlayControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(overlayControlDiv);
}

//Return the Pokemon content info to InfoWindow
function getContent(){
    return ("<p class='pokemon-title'>" + pokeData.name + "</p>" +
    "<span class='pokemon-label'>Lat:</span> <span>" + parseFloat(pokeData.lat).toFixed(5) + "</span>" +
    "<br><span class='pokemon-label'>Long:</span> <span>" + parseFloat(pokeData.lng).toFixed(5) + "</span>" +
    "<br><span class='pokemon-label'>Date:</span> <span>" + pokeData.date + "</span>" +
    "<img class='gg' src='"+pokeData.photo+"' alt='"+pokeData.name+"''>");
}

function addMarker(map, latlongPosition, title, content, markerIcon) {

    var markerOptions = {
        position: latlongPosition,
        map: map,
        title: title,
        clickable: _clickable === true,
        draggable: _draggable === true,
        icon: markerIcon
    };

    //Place the marker
    marker = new google.maps.Marker(markerOptions);

    //When marker is being dragged
    google.maps.event.addListener(marker, "dragend", function (event) {

        pokeData.lat = event.latLng.lat();
        pokeData.lng = event.latLng.lng();
        displayLocationCoords();
        latlongPosition = new google.maps.LatLng(pokeData.lat, pokeData.lng);
    });

    //Show InfoWindow when marker is clicked
    google.maps.event.addListener(marker, 'click', function () {

        content=getContent();

        var popupWindowOptions = {
            content: content,
            position: latlongPosition,
            maxWidth: 150
        };

        popupWindow = new google.maps.InfoWindow(popupWindowOptions);
        popupWindow.open(map);
    });

    //Click anywhere on map to close current InfoWindow
    google.maps.event.addListener(map, 'click', function() {
        popupWindow.close();
    });

    return marker;
}

////////////////////////////////////////////////
// The following code is for dragging a file from
// a local drive onto the target Map
// Extract file info
if (window.FileReader) {
    var drop;

    addEventHandler(window, 'load', function () {
        var status = document.getElementById('status');
        drop = document.getElementById('map');
        var list = document.getElementById('list');

        function cancel(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            return false;
        }

        function dragOverHandler(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }

            addClass(e, 'dragged');
            // e.target.classList.add(addClass('dragged'));

            return false;
        }

        function dragLeaveHandler(e) {
            removeClass(e, 'dragged');
            // this.classList.remove(removeClass('dragged'));
        }

        function dropHandler(e) {
            e = e || window.event; // get window.event if e argument missing (in IE)
            if (e.preventDefault) {
                e.preventDefault();
            } // stops the browser from redirecting off to the image.

            dropTitle = document.getElementById('drop-title');
            dropDate = document.getElementById('drop-date');
            dropLatitude = document.getElementById('drop-latitude');
            dropLongitude = document.getElementById('drop-longitude');
           // startLatitude = dropLatitude.value;
           // startLongitude = dropLongitude.value;
            _clickable = true;
            getLocation();

            var dt = e.dataTransfer;
            var files = dt.files;

            document.getElementById('drop-status').style.display = 'block';
            // document.getElementById('drop-map').style.display = 'block';

            for (var i = 0; i < 1; i++) {
                var file = files[i];
                var reader = new FileReader();

                //attach event handlers here...

                reader.readAsDataURL(file);
                addEventHandler(reader, 'loadend', function (e, file) {
                    binImg = this.result;
                    newFileName = file.name.split(".")[0];  //trim off extension

                    displayLocationCoords();

                    dropTitle.value = newFileName.capitalize();

                    dropDate.value = defaultDate;
                    status.innerHTML = "Drag the marker to set a new location.";
                    list.innerHTML = '<img src="' + binImg + '" id="newPokemon" alt="' + newFileName.capitalize() + '">';
                    pokeData.photo = binImg;

                }.bindToEventHandler(file));
            }
            removeClass(e, 'dragged');
            return false;
        }

        function addClass(e, c) {
            e.target.classList.add(c);
        }


        function removeClass(e, c) {
            e.target.classList.remove(c);
        }

        // Eventlisteners for dragover, dragenter, dragleave
        addEventHandler(drop, 'dragover', dragOverHandler);
        addEventHandler(drop, 'dragenter', cancel);
        addEventHandler(drop, 'dragleave', dragLeaveHandler);

        //Drop event
        addEventHandler(drop, 'drop', dropHandler);

        Function.prototype.bindToEventHandler = function bindToEventHandler() {
            var handler = this;
            var boundParameters = Array.prototype.slice.call(arguments);
            //create closure
            return function (e) {
                e = e || window.event; // get window.event if e argument missing (in IE)
                boundParameters.unshift(e);
                handler.apply(this, boundParameters);
            }
        };
    });
} else {
    document.getElementById('status').innerHTML = 'Your browser does not support the HTML5 FileReader.';
}

function addEventHandler(obj, evt, handler) {
    if (obj.addEventListener) {
        // W3C method
        obj.addEventListener(evt, handler, false);
    } else if (obj.attachEvent) {
        // IE method.
        obj.attachEvent('on' + evt, handler);
    } else {
        // Old school method.
        obj['on' + evt] = handler;
    }
}

//A prototype function to capitalize first character of every word
//Usage:  var str = "pokemon characters".capitalize()   =>  results in "Pokemon Characters"
String.prototype.capitalize = function(){
    return this.toLowerCase().replace( /\b\w/g, function (t) {
        return t.toUpperCase();
    });
};