const destination='https://makewellness.com/630BA81D95/Shopping/item?itemid=22';
document.getElementById('leadForm').addEventListener('submit',event=>{
  event.preventDefault();
  location.href=destination;
});
