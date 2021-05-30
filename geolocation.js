import Utm, { LatLon, Dms } from 'https://cdn.jsdelivr.net/npm/geodesy@2.2.1/utm.js';
import Vector3d from 'https://cdn.jsdelivr.net/npm/geodesy@2/vector3d.js';


unmuteButton.addEventListener('click', function () {
  watchGPS();
  getCompass();
  startAudio();
});




// =============================================================================
// GEOLOC
// =============================================================================

const target = {
  latitude: 48.89353893327512,
  longitude: 2.3243825143093972
};

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

const fenceA = new CircularGeofenceRegion({
  name: 'myfence',
  latitude: 48.89353893327512,
  longitude: 2.3243825143093972,
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
    console.log(response);
    if (response == 'granted') {
      // Add a listener to get smartphone orientation 
      window.addEventListener('deviceorientation', receiveCompass);
    }
  });
}

function receiveCompass(event) {
  var compass = event.webkitCompassHeading;

  let rotatedTargetVector = targetVector.rotateAround(new Vector3d(0, 0, 1), compass).times(targetVector.length);
  // console.log("rotated:" + rotatedTargetVector.x + " " + rotatedTargetVector.y + " " + rotatedTargetVector.z);

  // get aim
  var radians = originVector.angleTo(rotatedTargetVector);
  var degrees = radians * 180 / Math.PI;
  var aim = scale(degrees, 180, 0, 0, 1);
  document.getElementById("aim").innerHTML = "Aim:" + aim;
  // console.log("aim:" + aim);

  // // get angle
  var radians = originVector.angleTo(rotatedTargetVector, new Vector3d(0, 0, 1));
  if (radians < 0) {
    radians += 2 * Math.PI;
  }
  var degrees = radians * 180 / Math.PI;
  document.getElementById("azimuth").innerHTML = "Azimuth:" + degrees;
  // console.log("angle:" + degrees);

  audioFilter(aim);
  audioPan(radians);
}

function receivePosition(position) {
  if (fenceA.inside(position.coords.latitude, position.coords.longitude)){
    document.getElementById("aim").innerHTML = "Match: TRUE";
  }

  const p = new LatLon(position.coords.latitude, position.coords.longitude);
  const t = new LatLon(target.latitude, target.longitude);

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
  // console.log(filter.frequency.value);
}

function audioPan(angle) {
  
  // var pan = scale(angle, 0, 360, -90, 90);
  var pan = Math.sin(angle * -1);
  pan = scale(pan, -1, 1, -0.6, 0.6);
  console.log(pan);
  panner.pan.value = pan;
}

// =============================================================================
// HELPERS
// =============================================================================

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