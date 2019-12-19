var rad = document.getElementsByName("g");
var prev = null;
for (var i = 0; i < rad.length; i++) {
    console.log("gravity vector changed");
    rad[i].addEventListener('change', function() {
        if ( this.value === '-x' ){
            gravityVec = new THREE.Vector2(-gravityAbs, 0);
        }
        else if ( this.value === '+x'){
            gravityVec = new THREE.Vector2(gravityAbs, 0);
        }
        else if ( this.value === '-y'){
            gravityVec = new THREE.Vector2(0, -gravityAbs);
        }
        else if ( this.value === '+y'){
            gravityVec = new THREE.Vector2(0, gravityAbs);
        }
    });
}

var offsetX = ( ratio - boxWidth ) / 2;
var canvas  = document.getElementsByTagName("canvas")[0];
canvas.addEventListener("mousedown", function(e){
    isAddingParticle = true;
    console.log("mouse down");
    // valveX =  e.offsetX*ratio/window.innerWidth - offsetX;
    // valveY = boxHeight - e.offsetY/window.innerHeight;
});

canvas.addEventListener("mousemove", function(e){
    valveX =  e.pageX*ratio/window.innerWidth - offsetX;
    valveY = boxHeight - e.pageY/window.innerHeight;
})

canvas.addEventListener("mouseup", function(){
    isAddingParticle = false;
});

var valveSliderX = document.getElementById("valve-v-x");
valveSliderX.setAttribute("min", -maxValveV+"");
valveSliderX.setAttribute("max", maxValveV+"");
valveSliderX.setAttribute("value", "0");
var valveVXText = document.getElementById("valve-v-x-text")
valveVXText.textContent = "0";

var valveSliderY = document.getElementById("valve-v-y");
valveSliderY.setAttribute("min", -maxValveV+"");
valveSliderY.setAttribute("max", maxValveV+"");
valveSliderY.setAttribute("value", initialValveV+"");
var valveVYText = document.getElementById("valve-v-y-text");
valveVYText.textContent = initialValveV;

valveSliderX.oninput = function(){
    valveVX = parseFloat(this.value);
    valveVXText.textContent = valveVX;
}

valveSliderY.oninput = function(){
    valveVY = parseFloat(this.value);
    valveVYText.textContent = valveVY;
}