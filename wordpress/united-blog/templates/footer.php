<?php if (!defined('ABSPATH')) { exit; } ?>
<footer id="rodape" class="site-footer">
<div class="wrap">
<div class="site-footer-main">
<div class="site-footer-brand">
<a class="brand" href="<?php echo esc_url(ub26_site_url()); ?>" aria-label="United — página inicial">
<img src="<?php echo esc_url(ub26_asset('images/logo-united.webp')); ?>" width="258" height="164" alt="United">
</a>
<p>Inglês para a vida.<br>E para os seus próximos passos.</p>
<div class="site-footer-socials" aria-label="Redes sociais da United">
<a href="https://www.instagram.com/unitedidiomas/" target="_blank" rel="noopener">Instagram</a>
<a href="https://www.facebook.com/unitedinstitute/" target="_blank" rel="noopener">Facebook</a>
<a href="https://br.linkedin.com/company/united-institute" target="_blank" rel="noopener">LinkedIn</a>
<a href="https://www.youtube.com/@unitedidiomas" target="_blank" rel="noopener">YouTube</a>
</div>
</div>
<div class="site-footer-links">
<nav aria-label="Cursos da United">
<h2>Cursos</h2>
<a href="https://unitedondemand.com.br/" target="_blank" rel="noopener" aria-label="OnDemand · inglês no seu ritmo (abre em nova aba)">OnDemand · inglês no seu ritmo</a>
<a href="<?php echo esc_url(ub26_site_url('cursos/live-class/')); ?>">Live Class · inglês online e ao vivo</a>
<a href="<?php echo esc_url(ub26_site_url('cursos/business/')); ?>">Business · inglês para negócios</a>
<a href="<?php echo esc_url(ub26_site_url('cursos/full/')); ?>">Full · Live Class + Business</a>
</nav>
<nav aria-label="Conheça a United">
<h2>A United</h2>
<a href="<?php echo esc_url(ub26_site_url()); ?>">Página inicial</a>
<a href="<?php echo esc_url(ub26_site_url('quem-somos/')); ?>">Quem somos</a>
<a href="<?php echo esc_url(ub26_site_url('quem-somos/#unidades')); ?>">Nossas unidades</a>
<a href="<?php echo esc_url(ub26_site_url('faq/')); ?>">Perguntas frequentes</a>
<a href="<?php echo esc_url(ub26_blog_url()); ?>" aria-current="page">Blog</a>
<a href="https://www.reclameaqui.com.br/empresa/united-idiomas/" target="_blank" rel="noopener">United no Reclame Aqui</a>
</nav>
<nav aria-label="Atendimento da United">
<h2>Atendimento</h2>
<a href="<?php echo esc_url(ub26_site_url('#contato')); ?>" <?php if (ub26_settings()['contact']) { echo 'data-contact-form'; } ?>>Formulário de contato</a>
<a href="https://wa.me/5511940040658" target="_blank" rel="noopener">WhatsApp · fale com a United</a>
<a href="tel:+551130782346">Head Office · (11) 3078-2346</a>
<a href="https://liveclass.app.br" target="_blank" rel="noopener">Área do aluno</a>
<a href="https://wa.me/5511958575315" target="_blank" rel="noopener">Parcerias &amp; Convênios</a>
<a href="https://wa.me/5511958575315" target="_blank" rel="noopener">Seja um franqueado</a>
</nav>
</div>
</div>
<div class="site-footer-bottom">
<span>© United <?php echo esc_html(wp_date('Y')); ?>.</span>
<span>Todos os direitos reservados.</span>
<a href="#inicio">Voltar ao topo</a>
</div>
</div>
</footer>
<div class="floating-contact">
<a class="whatsapp-float" href="https://wa.me/5511940040658" target="_blank" rel="noopener" aria-label="Conversar com a United pelo WhatsApp">
<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
<path d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.4 23.5l5.9-1.6a11.8 11.8 0 0 0 5.6 1.4h.1A11.8 11.8 0 0 0 20.5 3.5ZM12 21.3a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.5.9.9-3.4-.2-.4A9.8 9.8 0 1 1 12 21.3Zm5.4-7.3c-.3-.1-1.7-.8-2-.9-.2-.1-.4-.1-.6.2-.2.3-.7.9-.9 1-.1.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.4.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3l1.6.6c.6.2 1.2.2 1.7.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.3Z"/>
</svg>
</a>
<a class="floating-cta" href="<?php echo esc_url(ub26_site_url('#contato')); ?>" <?php if (ub26_settings()['contact']) { echo 'data-contact-form'; } ?>>Quero conhecer</a>
</div>
