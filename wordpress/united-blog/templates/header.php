<?php if (!defined('ABSPATH')) { exit; } ?>
<a class="skip-link" href="#conteudo">Ir para o conteúdo</a>
<header class="header site-header">
<div class="wrap nav">
<a class="brand" href="<?php echo esc_url(ub26_site_url()); ?>" aria-label="United — página inicial">
<img src="<?php echo esc_url(ub26_asset('images/logo-united.webp')); ?>" width="258" height="164" alt="United">
</a>
<nav class="desktop-nav" aria-label="Navegação principal">
<a href="<?php echo esc_url(ub26_site_url()); ?>">Início</a>
<a href="<?php echo esc_url(ub26_site_url('quem-somos/')); ?>">Quem somos</a>
<details class="site-courses">
<summary>Cursos</summary>
<div class="site-course-menu">
<a href="<?php echo esc_url(ub26_site_url('cursos/live-class/')); ?>">
<strong>Live Class</strong>
<span>Inglês online e ao vivo</span>
</a>
<a href="<?php echo esc_url(ub26_site_url('cursos/business/')); ?>">
<strong>United Business</strong>
<span>Inglês para negócios</span>
</a>
<a href="<?php echo esc_url(ub26_site_url('cursos/full/')); ?>">
<strong>United Full</strong>
<span>Live Class + Business</span>
</a>
</div>
</details>
<a href="<?php echo esc_url(ub26_site_url('faq/')); ?>">FAQ</a>
<a href="<?php echo esc_url(ub26_blog_url()); ?>" aria-current="page">Blog</a>
<a href="<?php echo esc_url(ub26_site_url('#contato')); ?>" <?php if (ub26_settings()['contact']) { echo 'data-contact-form'; } ?>>Contato</a>
</nav>
<a class="student" href="https://liveclass.app.br" target="_blank" rel="noopener" aria-label="Área do aluno" aria-describedby="student-access-caption">
<span id="student-access-caption" class="student-caption">Aulas ao vivo</span>Área do aluno</a>
<button class="menu-button" type="button" aria-expanded="false" aria-haspopup="dialog" aria-controls="mobile-menu" aria-label="Abrir menu">
<span>
</span>
<span>
</span>
<span>
</span>
</button>
</div>
</header>
<dialog id="mobile-menu" class="mobile-menu site-mobile-menu" aria-label="Menu de navegação" data-site-menu-managed>
<div class="mobile-menu-top">
<a class="brand" href="<?php echo esc_url(ub26_site_url()); ?>" aria-label="United — página inicial">
<img src="<?php echo esc_url(ub26_asset('images/logo-united.webp')); ?>" width="258" height="164" alt="United">
</a>
<button type="button" class="dialog-close mobile-menu-close" aria-label="Fechar menu">
<span aria-hidden="true">×</span>
</button>
</div>
<div class="mobile-student-access">
<p>Já é aluno?</p>
<a class="student" href="https://liveclass.app.br" target="_blank" rel="noopener">Área do aluno</a>
</div>
<nav aria-label="Menu principal no celular">
<ul class="mobile-menu-links">
<li>
<a href="<?php echo esc_url(ub26_site_url()); ?>">Início</a>
</li>
<li>
<a href="<?php echo esc_url(ub26_site_url('quem-somos/')); ?>">Quem somos</a>
</li>
<li>
<span class="mobile-course-label">Cursos</span>
<div class="mobile-course-links">
<a href="<?php echo esc_url(ub26_site_url('cursos/live-class/')); ?>">Live Class</a>
<a href="<?php echo esc_url(ub26_site_url('cursos/business/')); ?>">United Business</a>
<a href="<?php echo esc_url(ub26_site_url('cursos/full/')); ?>">United Full</a>
</div>
</li>
<li>
<a href="<?php echo esc_url(ub26_site_url('faq/')); ?>">FAQ</a>
</li>
<li>
<a href="<?php echo esc_url(ub26_blog_url()); ?>" aria-current="page">Blog</a>
</li>
<li>
<a href="<?php echo esc_url(ub26_site_url('#contato')); ?>" <?php if (ub26_settings()['contact']) { echo 'data-contact-form'; } ?>>Contato</a>
</li>
</ul>
</nav>
<ul class="mobile-menu-socials" aria-label="Redes sociais">
<li>
<a href="https://www.facebook.com/unitedinstitute/" target="_blank" rel="noopener" aria-label="Facebook">
<img src="<?php echo esc_url(ub26_asset('images/icon-menu-facebook.webp')); ?>" width="15" height="25" alt="">
</a>
</li>
<li>
<a href="https://www.instagram.com/unitedidiomas/" target="_blank" rel="noopener" aria-label="Instagram">
<img src="<?php echo esc_url(ub26_asset('images/icon-menu-instagram.webp')); ?>" width="24" height="24" alt="">
</a>
</li>
<li>
<a href="https://br.linkedin.com/company/united-institute" target="_blank" rel="noopener" aria-label="LinkedIn">
<img src="<?php echo esc_url(ub26_asset('images/icon-menu-linkedin.webp')); ?>" width="25" height="24" alt="">
</a>
</li>
</ul>
</dialog>
