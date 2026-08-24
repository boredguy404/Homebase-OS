export function createPixelActor(THREE){
  const frameW=16,frameH=24,frames=3,dirs=4,canvas=document.createElement('canvas');canvas.width=frameW*frames;canvas.height=frameH*dirs;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const px=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
  for(let dir=0;dir<dirs;dir++)for(let frame=0;frame<frames;frame++){
    const ox=frame*frameW,oy=dir*frameH,bob=frame===1?-1:0,step=frame===1?1:frame===2?-1:0;
    px(ox+4,oy+17+bob-step,3,5,'#26314a');px(ox+9,oy+17+bob+step,3,5,'#26314a');
    px(ox+3,oy+22+bob-step,4,2,'#10131a');px(ox+9,oy+22+bob+step,4,2,'#10131a');
    px(ox+4,oy+10+bob,8,6,'#346d9b');px(ox+5,oy+16+bob,6,2,'#244c70');
    px(ox+2,oy+11+bob+step,2,6,'#346d9b');px(ox+12,oy+11+bob-step,2,6,'#346d9b');
    px(ox+2,oy+16+bob+step,2,2,'#ddb084');px(ox+12,oy+16+bob-step,2,2,'#ddb084');
    px(ox+5,oy+2+bob,6,6,'#ddb084');px(ox+6,oy+1+bob,4,1,'#ddb084');px(ox+6,oy+8+bob,4,1,'#bd865f');
    px(ox+5,oy+1+bob,6,2,'#332117');px(ox+4,oy+2+bob,8,1,'#332117');
    if(dir!==3){px(ox+(dir===1?5:6),oy+4+bob,1,2,'#101018');px(ox+(dir===2?10:9),oy+4+bob,1,2,'#101018')}
  }
  const texture=new THREE.CanvasTexture(canvas);texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.repeat.set(1/frames,1/dirs);
  const material=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.2});const sprite=new THREE.Sprite(material);sprite.scale.set(1.2,1.8,1);sprite.position.y=.9;
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.72,12),new THREE.MeshBasicMaterial({color:0x08070b,transparent:true,opacity:.45}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.03;
  const group=new THREE.Group();group.add(shadow,sprite);group.position.set(0,0,0);
  let direction=0;
  return {group,update(vx,vz,moving,time){if(Math.abs(vx)>Math.abs(vz))direction=vx<0?1:2;else if(Math.abs(vz)>.02)direction=vz>0?0:3;const frame=moving?1+(Math.floor(time*8)%2):0;texture.offset.set(frame/frames,1-(direction+1)/dirs);sprite.material.rotation=0}};
}
