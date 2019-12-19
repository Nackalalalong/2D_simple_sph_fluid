var isAddingParticle = false;
var valveX;
var valveY;
var valveVX;
var valveVY;
//////

const ratio = window.innerWidth / window.innerHeight;
console.log(ratio);
var boxHeight = 1;
var glassHieght = 0*boxHeight;
// var boxWidth = boxHeight * ratio;
var boxWidth = 1;
var scene = new THREE.Scene();
var camera = new THREE.OrthographicCamera( (boxWidth-ratio)/2.0, (boxWidth+ratio)/2.0, 0, boxHeight, 1, 1000 );
// var camera = new THREE.OrthographicCamera( 0, boxWidth, 0, boxHeight, 1, 1000 );
camera.position.z = 10;

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

let PI = 3.14159265358979323846;

var mass = 0.02;
var numberOfParticles = 400;
var h = 0.05;
var radius =0.02;
var restDensity = 998;
var stiffness = 2;
var viscosityCoef = 2;

var gravityAbs = 9.81;
var gravityVec = new THREE.Vector2(0,-gravityAbs);
var epsilon = 0.1;

var h2 = h*h;
var h6 = h2*h2*h2;

var poly6 =  315 / ( 64 * PI * h6*h*h*h);
var gradientSpiky = -45 / ( PI * h6);
var laplacVis = 45 / ( PI * h6);

var poly6 = 315 / ( 64 * PI * Math.pow(h,9));
var gradSpiky = -45 / ( PI * h6);
var laplacVis = 45 / ( PI * h6);

var deltaT = 0.002;
var deltaTH = deltaT / 2;

var maxDensity;

//////////
var initialValveV = gravityAbs * 500 * deltaT;
const maxValveV = gravityAbs * 1500 * deltaT;
valveVX = gravityVec.x * 500 * deltaT ;
valveVY = gravityVec.y * 500 * deltaT ;
////////////

var positions = new Array(numberOfParticles);
var velocities = new Array(numberOfParticles);
var velocitiesHalf = new Array(numberOfParticles);
var accelerations = new Array(numberOfParticles);
var pressures = new Array(numberOfParticles);
var densities = new Array(numberOfParticles);
var neighbors = new Array(numberOfParticles);
var meshes = new Array(numberOfParticles);

function initParticles(){
  let i = 0;
  let rt = radius;
    for(let x = radius; x < boxWidth - radius && i < numberOfParticles; x += rt){
        for(let y = boxHeight/8+radius;y<boxHeight - radius && i < numberOfParticles; y += rt ){
            positions[i] = new THREE.Vector2(x,y);
            velocities[i] = new THREE.Vector2(((Math.random()%10)-5)*1,0);
            accelerations[i] = new THREE.Vector2(gravityVec.x, gravityVec.y);
            densities[i] = restDensity;
            pressures[i] = 0;

            velocitiesHalf[i] = new THREE.Vector2(0,0);
            ++i;
        }
    }
}

function updateNeighbors(){
  if ( isAddingParticle ){
    numberOfParticles++;
    console.log(valveVX+ " " + valveVY);
    positions.push(new THREE.Vector2(valveX+(Math.random()-0.5)*0.01,valveY));
    velocities.push(new THREE.Vector2(valveVX,valveVY));
    accelerations.push(new THREE.Vector2(gravityVec.x,gravityVec.y));
    velocitiesHalf.push(new THREE.Vector2(accelerations[numberOfParticles-1].x*deltaTH,accelerations[numberOfParticles-1].y*deltaTH));
    pressures.push(0);
    densities.push(restDensity);
    neighbors.push([]);

    var geometry = new THREE.SphereGeometry( radius, 16);
    var material = new THREE.MeshBasicMaterial( {color: 0x2FA1D6} );
    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(positions[numberOfParticles-1].x, positions[numberOfParticles-1].y, -20);
    meshes[numberOfParticles-1] = mesh;
    this.scene.add(mesh);
  
  }
  for(let i=0; i<numberOfParticles;++i){
      neighbors[i] = [];
      for(let j=0; j<numberOfParticles; ++j){
          let diff = new THREE.Vector2(positions[i].x - positions[j].x, positions[i].y -positions[j].y);
          if ( diff.length() < h){
              neighbors[i].push(j);
          }
      }
    }
}

function updateDensityAndPressure(){
  maxDensity = densities[0];
  for(let i=0; i<numberOfParticles; ++i){
    let den = 0;
    let pres = 0;
    for(let index=0; index<neighbors[i].length; ++index){
      let j = neighbors[i][index];
      let diffPos = new THREE.Vector2(positions[i].x - positions[j].x, positions[i].y -positions[j].y);
      let length = diffPos.length();
      let length2 = length * length;
      if ( length2 < h2 && length2 >= 0 ){
        den += poly6 * Math.pow(( h2 - length2), 3);
      } 
    }
    den *= mass;
    pres = stiffness * ( den - restDensity );
    densities[i] = den;
    pressures[i] = pres;
    if ( den < 1 ){
      console.log(i + " " + den);
    }
    if ( den > maxDensity ) maxDensity = den;
  }
}

function computeAccelerations(){
  for(let i=0; i<numberOfParticles; ++i){
    accelerations[i].x = gravityVec.x;
    accelerations[i].y = gravityVec.y;
  }

  //pressure force
  for(let i=numberOfParticles-1; i>0; --i){
    for(let index=0; index<neighbors[i].length; ++index){
      let j = neighbors[i][index];
      if ( i === j ) continue;
      let diffPos = new THREE.Vector2(positions[i].x - positions[j].x, positions[i].y -positions[j].y);
      let length = diffPos.length();
      let f = (mass/densities[j]) * ( pressures[i] + pressures[j]) * 0.5 * gradientSpiky * Math.pow(h - length, 2);
      f /= densities[i];
      if ( length > 0.001 ){
        accelerations[i].x -= f * diffPos.x / length;
        accelerations[i].y -= f * diffPos.y / length;
      }
      
    }
  }

  // viscosity force
  for(let i=0; i<numberOfParticles; ++i){
    for(let index=0; index<neighbors[i].length; ++index){
      let j = neighbors[i][index];
      if ( i === j ) continue;
      let diffPos = new THREE.Vector2(positions[i].x - positions[j].x, positions[i].y -positions[j].y);
      let diffVel = new THREE.Vector2(velocities[j].x - velocities[i].x, velocities[j].y -velocities[i].y);
      let f =  viscosityCoef * (mass/densities[j]) * laplacVis * ( h - diffPos.length() ) / densities[i];
      accelerations[i].x += f * diffVel.x;
      accelerations[i].y += f * diffVel.y;
    }
  }


  
}

function updateLeapFrog(){
  for(let i=0; i<numberOfParticles; ++i){
    velocitiesHalf[i].x = velocities[i].x + accelerations[i].x*deltaT;
    velocitiesHalf[i].y = velocities[i].y + accelerations[i].y*deltaT;

    positions[i].x = positions[i].x + velocitiesHalf[i].x*deltaTH;
    positions[i].y = positions[i].y + velocitiesHalf[i].y*deltaTH;

    velocities[i].x = velocitiesHalf[i].x + accelerations[i].x*deltaT;
    velocities[i].y = velocitiesHalf[i].y + accelerations[i].y*deltaT;

    let damp = -0.75;
    if ( positions[i].x > boxWidth - radius - 0.001){
      positions[i].x = boxWidth - radius - 0.001;
      velocities[i].x *= damp;
      velocitiesHalf[i].x *damp;
    }
    else if ( positions[i].x < radius + 0.001 ){
      positions[i].x = radius+ 0.001;
      velocities[i].x *= damp;
      velocitiesHalf[i].x *= damp;
    }
    else if ( positions[i].y > boxHeight - radius - 0.001){
      positions[i].y = boxHeight - radius - 0.001;
      velocities[i].y *= damp;
      velocitiesHalf[i].y *= damp;
    }
    else if ( positions[i].y < radius+ 0.001){
      positions[i].y = radius+ 0.001;
      velocities[i].y *= damp;
      velocitiesHalf[i].y *= damp;
    }
  }
}

function initialLeapFrog(){
  for(let i=0; i<numberOfParticles;++i){
    velocitiesHalf[i].x = velocities[i].x + accelerations[i].x * deltaTH;
    velocitiesHalf[i].y = velocities[i].y + accelerations[i].y * deltaTH;
  
   // Update velocity
   velocities[i].x = accelerations[i].x * deltaTH;
   velocities[i].y = accelerations[i].y * deltaTH;
   
   // Update position
   positions[i].x += velocitiesHalf[i].x * deltaT;
   positions[i].y += velocitiesHalf[i].y * deltaT;
  }
}

function updateParticles(){
  updateDensityAndPressure();
  computeAccelerations();
  updateLeapFrog();
}

function updateMeshes(){
  for (let i = 0; i < numberOfParticles; i++) {
    this.meshes[i].position.set(positions[i].x,boxHeight - positions[i].y, -20);
    let denRatio =1 - Math.abs(densities[i]/maxDensity) + 0.5;
    this.meshes[i].material.color.setRGB(0,0, denRatio);
  }
}

var createMeshes = function(){
  var geometry = new THREE.SphereGeometry( radius, 16);
  var material = new THREE.MeshBasicMaterial( {color: 0x2FA1D6} );
  for(let i=0; i<numberOfParticles; ++i){
    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(positions[i].x, positions[i].y, -20);
    meshes[i] = mesh;
    this.scene.add(mesh);
  }
  
  material = new THREE.LineBasicMaterial({color: 0xff0000, linewidth: 1});
  geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(0,glassHieght, -20));
  geometry.vertices.push(new THREE.Vector3(0,boxHeight, -20));
  var line = new THREE.Line(geometry, material);
  this.scene.add(line);

  geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(boxWidth,glassHieght, -20));
  geometry.vertices.push(new THREE.Vector3(boxWidth,boxHeight, -20));
  line = new THREE.Line(geometry, material);
  this.scene.add(line);
}

var animate = function () {
  requestAnimationFrame( this.animate.bind(this) );

    this.updateNeighbors();
    this.updateParticles();
    this.updateMeshes();  

  this.renderer.render( this.scene, this.camera );
};

this.initParticles();
this.initialLeapFrog();
this.createMeshes();
this.animate();

