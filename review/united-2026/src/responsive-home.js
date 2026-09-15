(function($){
 'use strict';
 if(!$)return;
 $(function(){
  if(!document.querySelector('.about-home'))return;
  var mobile=window.matchMedia('(max-width:1024px)');
  var motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function update(){
   var reviews=$('.avaliacoes .masonry');
   if(mobile.matches&&!reviews.hasClass('slick-initialized')){
    reviews.slick({infinite:false,dots:true,arrows:false,autoplay:!motion.matches,autoplaySpeed:5000,speed:motion.matches?0:500,adaptiveHeight:true});
   }else if(!mobile.matches&&reviews.hasClass('slick-initialized')){
    reviews.slick('unslick');
   }else if(reviews.hasClass('slick-initialized')){
    reviews.slick('slickSetOption',{adaptiveHeight:true,autoplay:!motion.matches,speed:motion.matches?0:500},true);
   }
   $('.carousel-steps.slick-initialized').slick('slickSetOption',{
    adaptiveHeight:mobile.matches,
    responsive:[{breakpoint:1025,settings:{slidesToShow:1,slidesToScroll:1}}]
   },true);
   $('.carousel-steps .slick-prev').attr('aria-label','Cartão anterior');
   $('.carousel-steps .slick-next').attr('aria-label','Próximo cartão');
  }
  update();
  if(mobile.addEventListener)mobile.addEventListener('change',update);else mobile.addListener(update);
  if(motion.addEventListener)motion.addEventListener('change',update);else motion.addListener(update);
 });
})(window.jQuery);
