/** Stage-aware deep link: open the original ground 3D model while revisions are reviewed. */
(function(){
  const params=new URLSearchParams(window.location.search);
  if(params.get('floor')==='ground' && !params.has('preview')){
    window.location.replace('./ground.html?review=1');
  }
})();
