const destination='https://makewellness.com/630BA81D95/shopping/item?itemId=22&categoryID=11';
const trackClick=(product,cta)=>navigator.sendBeacon('/api/track',new Blob([JSON.stringify({product,cta})],{type:'application/json'}));

document.querySelectorAll('[data-checkout-product]').forEach(link=>link.addEventListener('click',()=>{
  trackClick(link.dataset.checkoutProduct,link.dataset.checkoutCta);
}));

document.getElementById('leadForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const button=form.querySelector('button[type="submit"]');
  const status=document.getElementById('formStatus');
  const data=new FormData(form);
  button.disabled=true;
  status.textContent='Saving your details…';
  try{
    const response=await fetch('/api/lead',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({firstName:data.get('first_name'),lastName:data.get('last_name'),email:data.get('email'),phone:data.get('phone'),consent:data.get('consent')==='on'})
    });
    const payload=await response.json();
    if(!response.ok)throw new Error(payload.error||'Unable to save your details.');
    trackClick('lean','lead-form');
    location.href=destination;
  }catch(error){
    status.textContent=error.message;
    button.disabled=false;
  }
});

document.querySelectorAll('[data-video-player]').forEach(player=>{
  const poster=player.querySelector('.video-poster');
  const video=player.querySelector('video');
  poster.addEventListener('click',()=>{
    player.classList.add('is-playing');
    video.play();
  });
});
