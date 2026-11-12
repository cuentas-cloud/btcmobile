/* Bitcoin Mobile — shared motion: scroll progress, cursor-lit cards, rotating planet */
(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches;

  // Thin progress line across the top of the page
  var bar=document.createElement('div');bar.className='scroll-progress';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar);
  function prog(){var m=document.documentElement.scrollHeight-window.innerHeight;bar.style.transform='scaleX('+(m>0?Math.min(window.scrollY/m,1):0).toFixed(4)+')'}
  window.addEventListener('scroll',prog,{passive:true});window.addEventListener('resize',prog);prog();

  // Cards light up where the cursor is
  if(fine){
    Array.prototype.forEach.call(document.querySelectorAll('.spot'),function(el){
      el.addEventListener('pointermove',function(e){
        var r=el.getBoundingClientRect();
        el.style.setProperty('--mx',(e.clientX-r.left)+'px');
        el.style.setProperty('--my',(e.clientY-r.top)+'px');
      });
    });
  }

  // Rotating dotted planet with signal arcs
  function globe(wrap){
    var c=wrap.querySelector('canvas');if(!c||!c.getContext)return;
    var ctx=c.getContext('2d'),S=wrap.clientWidth||1100,dpr=Math.min(window.devicePixelRatio||1,1.5);
    c.width=c.height=Math.round(S*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    var small=window.innerWidth<700,N=small?800:1700,pts=[],i;
    for(i=0;i<N;i++){var y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),th=i*2.399963;pts.push([Math.cos(th)*r,y,Math.sin(th)*r,Math.random()<.03])}
    function rv(){var u=Math.random()*2-1,t=Math.random()*6.2832,q=Math.sqrt(1-u*u);return[q*Math.cos(t),u,q*Math.sin(t)]}
    function arc(delay){var a=rv(),b=rv(),d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2],n=0;
      while((d>.86||d<.15)&&n++<20){b=rv();d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
      return{a:a,b:b,w:Math.acos(Math.max(-1,Math.min(1,d))),t:-(delay||0),sp:.22+Math.random()*.22}}
    var arcs=[];for(i=0;i<(small?6:11);i++)arcs.push(arc(Math.random()*2.5));
    var tilt=1.02,ct=Math.cos(tilt),st=Math.sin(tilt),R=S/2-3,cx=S/2,cy=S/2,ang=0,last=0,running=false,cut=S*.6;
    function proj(p,ca,sa,k){
      var x=p[0]*ca+p[2]*sa,z=-p[0]*sa+p[2]*ca,y=p[1],y2=y*ct-z*st,z2=y*st+z*ct;
      return[cx+x*R*k,cy-y2*R*k,z2];
    }
    function draw(dt){
      ang+=dt*.055;
      var ca=Math.cos(ang),sa=Math.sin(ang),q,p,a,j,k;
      ctx.clearRect(0,0,S,S);
      for(i=0;i<N;i++){
        p=pts[i];q=proj(p,ca,sa,1);
        if(q[2]<=0||q[1]>cut)continue;
        a=q[2];
        if(p[3]){ctx.fillStyle='rgba(255,160,50,'+(.3+a*.7).toFixed(3)+')';ctx.beginPath();ctx.arc(q[0],q[1],2,0,6.2832);ctx.fill()}
        else{ctx.fillStyle='rgba(255,255,255,'+(.12+a*.6).toFixed(3)+')';ctx.fillRect(q[0]-.85,q[1]-.85,1.7,1.7)}
      }
      ctx.lineWidth=1.5;ctx.lineCap='round';
      for(j=0;j<arcs.length;j++){
        var A=arcs[j];A.t+=dt*A.sp;
        if(A.t>1.45){arcs[j]=arc(Math.random()*1.2);continue}
        if(A.t<0)continue;
        var head=Math.min(A.t,1),tail=Math.max(0,A.t-.45),fade=A.t>1?1-(A.t-1)/.45:1,so=Math.sin(A.w),prev=null,v=[0,0,0];
        for(k=0;k<=22;k++){
          var s=tail+(head-tail)*k/22,f1=Math.sin((1-s)*A.w)/so,f2=Math.sin(s*A.w)/so;
          v[0]=A.a[0]*f1+A.b[0]*f2;v[1]=A.a[1]*f1+A.b[1]*f2;v[2]=A.a[2]*f1+A.b[2]*f2;
          q=proj(v,ca,sa,1+.15*Math.sin(Math.PI*s));
          if(q[2]<=0||q[1]>cut){prev=null;continue}
          if(prev){ctx.strokeStyle='rgba(255,176,70,'+(k/22*.9*fade).toFixed(3)+')';ctx.beginPath();ctx.moveTo(prev[0],prev[1]);ctx.lineTo(q[0],q[1]);ctx.stroke()}
          prev=[q[0],q[1]];
        }
        if(prev&&A.t<=1){ctx.fillStyle='#FFD08A';ctx.shadowColor='#F7931A';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(prev[0],prev[1],2.4,0,6.2832);ctx.fill();ctx.shadowBlur=0}
      }
    }
    function loop(now){
      if(!running)return;
      var dt=Math.min((now-last)/1000||0,.05);last=now;draw(dt);requestAnimationFrame(loop);
    }
    draw(0);
    if(reduce)return;
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        var on=es[0].isIntersecting;
        if(on&&!running){running=true;last=performance.now();requestAnimationFrame(loop)}
        else if(!on){running=false}
      }).observe(wrap);
    } else {running=true;requestAnimationFrame(loop)}
  }
  Array.prototype.forEach.call(document.querySelectorAll('.globe'),globe);
})();
