const destination='https://makewellness.com/630BA81D95/Shopping/item?itemid=22';
document.getElementById('leadForm').addEventListener('submit',event=>{
  event.preventDefault();
  location.href=destination;
});

document.querySelectorAll('[data-video-player]').forEach(player=>{
  const poster=player.querySelector('.video-poster');
  const video=player.querySelector('video');
  poster.addEventListener('click',()=>{
    player.classList.add('is-playing');
    video.play();
  });
});
