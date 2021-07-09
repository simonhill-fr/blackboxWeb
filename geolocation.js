import Utm, { LatLon, Dms } from 'https://cdn.jsdelivr.net/npm/geodesy@2.2.1/utm.js';
import Vector3d from 'https://cdn.jsdelivr.net/npm/geodesy@2/vector3d.js';


unmuteButton.addEventListener('click', function () {
  document.getElementById('unmuteButton').remove();

  setNextWaypoint();
  // setNextCuepoint();

  watchGPS();
  getCompass();
  startAudio();
  document.body.style.backgroundColor = "red";
});




// =============================================================================
// GEOLOC
// =============================================================================

var waypointIdx = -1;
var cuepointIdx = -1;

const waypoints = [
  {
    latitude: 48.89450765151001,
    longitude: 2.3218926474015618
  },
  {
    latitude: 48.89588697553153, 
    longitude: 2.323020786869134
  },
  {
    latitude: 48.89586710605865,
    longitude: 2.323685561777184
  },
  {
    latitude: 48.89428190739545,
    longitude: 2.3225372089108327
  }
];

const cuepoints = [
  {
    latitude: 11.11,
    longitude: 12.12
  },
  {
    latitude: 13.13,
    longitude: 14.14
  }
];

var originVector = new Vector3d(0, 1, 0);
var targetVector = new Vector3d(0, 0, 0);

class CircularGeofenceRegion {
  constructor(opts) {
    Object.assign(this, opts)
  }

  inside(lat2, lon2) {
    const lat1 = this.latitude
    const lon1 = this.longitude
        const R = 63710; // Earth's radius in m

    return Math.acos(Math.sin(lat1)*Math.sin(lat2) + 
                     Math.cos(lat1)*Math.cos(lat2) *
                     Math.cos(lon2-lon1)) * R < this.radius;
  }
}

const waypointFence = new CircularGeofenceRegion({
  name: 'waypoint fence',
  latitude: 0,
  longitude: 0,
  radius: 10 // meters
});

const cuepointFence = new CircularGeofenceRegion({
  name: 'cuepoint fence',
  latitude: 0,
  longitude: 0,
  radius: 10 // meters
});

function watchGPS() {
  var gpsOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };
  navigator.geolocation.watchPosition(receivePosition, receivePositionError, gpsOptions);
}

function getCompass() {
  DeviceMotionEvent.requestPermission().then(response => {
    if (response == 'granted') {
      // Add a listener to get smartphone orientation 
      window.addEventListener('deviceorientation', receiveCompass);
    }
  });
}


// ==============================================================================================================
function receiveCompass(event) {
  
  var compass = event.webkitCompassHeading;
  let rotatedTargetVector = targetVector.rotateAround(new Vector3d(0, 0, 1), compass).times(targetVector.length);

  // get aim
  var radians = originVector.angleTo(rotatedTargetVector);
  var degrees = radians * 180 / Math.PI;
  var aim = scale(degrees, 180, 0, 0, 1);
  document.getElementById("aim").innerHTML = "Aim:" + aim.toFixed(2);

  // get angle
  var radians = originVector.angleTo(rotatedTargetVector, new Vector3d(0, 0, 1));
  if (radians < 0) {
    radians += 2 * Math.PI;
  }
  var degrees = radians * 180 / Math.PI;
  document.getElementById("azimuth").innerHTML = "Azimuth:" + degrees.toFixed(2);

  audioFilter(aim);
  audioPan(radians);
}

function receivePosition(position) {
  
  if (waypointFence.inside(position.coords.latitude, position.coords.longitude)){
    document.getElementById("waymatch").innerHTML = "Match: True";
    setNextWaypoint();
  } else {
    document.getElementById("waymatch").innerHTML = "Match: False";
  }
  
  if (cuepointFence.inside(position.coords.latitude, position.coords.longitude)){
    document.getElementById("cuematch").innerHTML = "Match: True";
  } else {
    document.getElementById("cuematch").innerHTML = "Match: False";
  }

  document.getElementById("waypoint").innerHTML = "Waypoint:" + waypointIdx;


  const p = new LatLon(position.coords.latitude, position.coords.longitude);
  const t = new LatLon(waypoints[waypointIdx].latitude, waypoints[waypointIdx].longitude);

  const pUtm = p.toUtm();
  const tUtm = t.toUtm();

  var x = tUtm.easting - pUtm.easting;
  var y = tUtm.northing - pUtm.northing;

  targetVector.x = x;
  targetVector.y = y;
}

function receivePositionError(err) {
  console.warn('ERROR(' + err.code + '): ' + err.message);
}

function setNextWaypoint(){
  if (waypointIdx < waypoints.length) {
    waypointIdx++;
    waypointFence.latitude = waypoints[waypointIdx].latitude;
    waypointFence.longitude = waypoints[waypointIdx].longitude;
  }
  document.getElementById("waypoint").innerHTML = "Waypoint:" + waypointIdx;
  console.log("setNextWaypoint! Idx:" + waypointIdx + " lat:" + waypointFence.latitude + " long:" + waypointFence.longitude);
}

function setNextCuepoint(){
  if (cuepointIdx < cuepoints.length) {
    cuepointIdx++;
    cuepointFence.latitude = cuepoints[cuepointIdx].latitude;
    cuepointFence.longitude = cuepoints[cuepointIdx].longitude;
  }
}

// =============================================================================
// AUDIO
// =============================================================================

const panner = new Tone.Panner(0).toDestination();
var filter = new Tone.Filter(50000, "lowpass").connect(panner);

function startAudio() {
  Tone.start();
  const player = new Tone.Player("https://raw.githubusercontent.com/simonhill-fr/asset/master/pad.wav").connect(filter);
  player.loop = true;
  Tone.loaded().then(() => {
    player.start();
  });
}

function audioFilter(aim) {
  filter.frequency.value = linearToLogarithmic(aim, 150, 20000);
  
  let brightness = scale(aim, 0, 1, -0.8, 0)
  var color = shadeHexColor('#FF0000', brightness);
  document.body.style.backgroundColor = color;
}

function audioPan(angle) {
  var pan = Math.sin(angle * -1);
  pan = scale(pan, -1, 1, -0.6, 0.6);
  // console.log(pan);
  panner.pan.value = pan;
}

function playCue()
{
  const player = new Tone.Player("https://raw.githubusercontent.com/simonhill-fr/asset/master/katerine-pour-toi.wav").connect(filter);
  player.start();
}
// =============================================================================
// HELPERS
// =============================================================================

function shadeHexColor(color, percent) {
  var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
  return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

function scale(num, in_min, in_max, out_min, out_max) {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function linearToLogarithmic(linearValue, minValue, maxValue) {
  var range = maxValue - minValue
  var value = Math.round(Math.pow(range + 1, linearValue) + minValue - 1);

  if (value < minValue) {
    value = minValue;
  } else if (value > maxValue) {
    value = this.maxValue;
  }
  return value;
}

function logarithmicToLinear(value, minValue, maxValue) {
  var range = maxValue - minValue
  var normalizedValue = value - minValue + 1;

  if (normalizedValue <= 0) {
    return 0;
  } else if (value >= maxValue) {
    return 1;
  } else {
    return Math.log(normalizedValue) / Math.log(range + 1);
  }
}