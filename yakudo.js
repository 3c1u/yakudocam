//yakudo.js

(function(_global) {

var gl    = document.getElementById("contentView")
                      .getContext("webgl");

var video = document.createElement("video");

var program;

function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ]), gl.STATIC_DRAW);
}

function drawToCanvas() {
  //if the browser does not support WebGL, then return
  if(!gl) return;
  if(video.videoWidth == 0) {
    requestAnimationFrame(drawToCanvas);
    return;
  }
  
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setRectangle(gl, 0, 0, video.videoWidth, video.videoHeight);
  var texcoordBuffeer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffeer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0
  ]), gl.STATIC_DRAW);

  //bind the textue
  var tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D,
                   gl.TEXTURE_WRAP_S,
                   gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,
                   gl.TEXTURE_WRAP_T,
                   gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,
                   gl.TEXTURE_MIN_FILTER,
                   gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,
                   gl.TEXTURE_MAG_FILTER,
                   gl.LINEAR);
  
  var callback = () => {
  //assign video frame to 2d texture
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
  
  //clear
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //use the shader program
  gl.useProgram(program);
  
  //setup position
  var positionLocation = gl.getAttribLocation(program, "pos");
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  
  //setup vertex
  var vertexLocation = gl.getAttribLocation(program, "vertex");
  gl.enableVertexAttribArray(vertexLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffeer);
  gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(gl.getUniformLocation(program, "res"),
               gl.canvas.width,
               gl.canvas.height);
  
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl.flush();

  //draw another frame
  requestAnimationFrame(callback);
  };
  callback();
}

function initView() {
  //if the browser doesn't supporr WebGL, abort
  if(!gl) return;

  //clear the view with rgba(0,0,0,1) (black)
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  //load shaders
  var loadShader = (_shaderId, _type) => {
    var shaderElement = document.getElementById(_shaderId);
    var shader        = gl.createShader(_type);
    gl.shaderSource(shader, shaderElement.text);
    gl.compileShader(shader);

    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      return shader;
    else {
      console.log(gl.getShaderInfoLog(shader));
      throw new Error("Failed to compile shader.");
    }
  };
  var vtxShader = loadShader("2d-vertex-shader", gl.VERTEX_SHADER);
  var fgtShader = loadShader("2d-fragment-shader", gl.FRAGMENT_SHADER);
  
  //create program
  program = gl.createProgram();
  gl.attachShader(program, vtxShader);
  gl.attachShader(program, fgtShader);
  gl.linkProgram(program);

  if(!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error("Failed to link the program.");
}

initView();

navigator.mediaDevices
          .getUserMedia({video:true})
          .then(_stream => {
            console.log("Success.");
            video.srcObject = _stream;
            video.play();
            console.log(video);
            drawToCanvas();
          })
          .catch(_error => {
            console.log(_error);
          });

})(window);