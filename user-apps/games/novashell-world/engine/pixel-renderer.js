export class PixelRenderer {
  constructor(THREE,canvas){
    this.THREE=THREE;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',stencil:false});
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x07060d,1);
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0x141019);
    this.scene.fog=new THREE.Fog(0x262038,34,82);
    this.camera=new THREE.PerspectiveCamera(46,1,.4,150);
    this.target=new THREE.WebGLRenderTarget(320,208,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true,stencilBuffer:false});
    this.postScene=new THREE.Scene();
    this.postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.postMaterial=new THREE.ShaderMaterial({
      uniforms:{tDiffuse:{value:this.target.texture},uSize:{value:new THREE.Vector2(320,208)},uLevels:{value:13},uGain:{value:1.65}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:`precision mediump float;varying vec2 vUv;uniform sampler2D tDiffuse;uniform vec2 uSize;uniform float uLevels;uniform float uGain;
        float bayer(vec2 p){vec2 f=floor(mod(p,4.0));float x=f.x,y=f.y,v=0.0;if(y<.5)v=x<.5?0.0:(x<1.5?8.0:(x<2.5?2.0:10.0));else if(y<1.5)v=x<.5?12.0:(x<1.5?4.0:(x<2.5?14.0:6.0));else if(y<2.5)v=x<.5?3.0:(x<1.5?11.0:(x<2.5?1.0:9.0));else v=x<.5?15.0:(x<1.5?7.0:(x<2.5?13.0:5.0));return v/16.0-.5;}
        void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;c=1.0-exp(-c*uGain*1.3);float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,1.18);float d=bayer(vUv*uSize)/uLevels;c=floor((c+d)*uLevels+.5)/uLevels;gl_FragColor=vec4(c,1.0);}`,
      depthTest:false,depthWrite:false
    });
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.postMaterial));
    this.look=new THREE.Vector3();
    this.resize=()=>{const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight),base=w<640?176:208,bw=Math.max(240,Math.round(base*w/h));this.renderer.setSize(w,h,false);this.target.setSize(bw,base);this.postMaterial.uniforms.uSize.value.set(bw,base);this.camera.aspect=w/h;this.camera.fov=w/h<.8?56:46;this.camera.updateProjectionMatrix()};
    this.resize();addEventListener('resize',this.resize);
  }
  follow(position,dt){
    const THREE=this.THREE,want=new THREE.Vector3(position.x,32,position.z+30),amount=1-Math.exp(-dt*6);
    this.camera.position.lerp(want,amount);this.look.lerp(new THREE.Vector3(position.x,1,position.z-5),amount);this.camera.lookAt(this.look);
  }
  draw(){this.renderer.setRenderTarget(this.target);this.renderer.render(this.scene,this.camera);this.renderer.setRenderTarget(null);this.renderer.render(this.postScene,this.postCamera)}
}
