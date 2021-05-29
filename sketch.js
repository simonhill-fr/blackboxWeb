
const target = {
    latitude: 48.89353893327512,
    longitude: 2.3243825143093972
};

var userPosition = {
    lat: 0,
    lon: 0,
}

let myMap;
let canvas;
const mappa = new Mappa('Leaflet');
const mapOptions = {
    lat: 48.89353893327512,
    lng: 2.3243825143093972,
    zoom: 15,
    style: "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
  }

function setup() {
    canvas = createCanvas(640, 640);

    // Create a tile map with the options declared
    myMap = mappa.tileMap(mapOptions); 
    myMap.overlay(canvas);

    // Add a color to our ellipse
    fill(200, 100, 100);

    // Only redraw the point when the map changes and not every frame.
    myMap.onChange(drawUserLocation);

    var gpsOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };
    navigator.geolocation.watchPosition(receivePosition, receivePositionError, gpsOptions);

    getAccel();
}

function draw() {

}

function drawUserLocation(){
    clear();
    ellipse(userPosition.x, userPosition.y, 20, 20);
  }

//======================================================================================
function receivePosition(position) {
    userPosition.lat = position.coords.latitude;
    userPosition.lon = position.coords.longitude;
    userPosition = myMap.latLngToPixel(position.coords.latitude, position.coords.longitude);
    var b = bearing(position.coords.latitude, position.coords.longitude, target.latitude, target.longitude);
    console.log(b);
    // drawUserLocation();
}

function receivePositionError(err) {
    console.warn('ERROR(' + err.code + '): ' + err.message);
}

// Converts from degrees to radians.
function toRadians(degrees) {
    return degrees * Math.PI / 180;
  };
   
  // Converts from radians to degrees.
  function toDegrees(radians) {
    return radians * 180 / Math.PI;
  }
  
  
  function bearing(startLat, startLng, destLat, destLng){
    startLat = toRadians(startLat);
    startLng = toRadians(startLng);
    destLat = toRadians(destLat);
    destLng = toRadians(destLng);
  
    y = Math.sin(destLng - startLng) * Math.cos(destLat);
    x = Math.cos(startLat) * Math.sin(destLat) -
          Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    brng = Math.atan2(y, x);
    brng = toDegrees(brng);
    return (brng + 360) % 360;
  }