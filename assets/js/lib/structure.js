// base = $('base').attr('href');
base = 'https://www.unitedidiomas.com/';

isScrolling = false;
scrollTimeout = null;

var structure = {
    init: function() {
		$.each($('.vitrine .content .itens .item'), function(i, item) {
            $(item).on('mouseenter', structure.mouseEnter);
        });

        contactLead.init();
        contactForm.init();

        $('.carousel-steps').slick({
            slidesToShow: 4,
            slidesToScroll: 4,
            infinite: false,
            responsive: [
                {
                    breakpoint: 1024,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1
                    }
                }
            ]
        });

        $('.carousel-mb').slick({
            infinite: false,
            dots: true,
            prevArrow: '.arrows .nav-prev',
            nextArrow: '.arrows .nav-next'
        });

        $('.carousel-methodology').slick({
            slidesToShow: 3,
            slidesToScroll: 3,
            infinite: false,
            responsive: [
                {
                    breakpoint: 1024,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1
                    }
                }
            ]
        });

        $('.carousel-vitrine').slick({
            arrows: false,
            dots: true,
            infinite: true,
            autoplay: true,
            autoplaySpeed: 5000,
            speed: 500,
            fade: true,
            cssEase: 'linear'
        });

        structure.menuFixo();
        $(window).bind('load', structure.menuFixo);
        $(window).bind('scroll', structure.menuFixo);

        structure.animeBanner();
        $(window).bind('load', structure.animeBanner);
        $(window).bind('scroll', structure.animeBanner);

        if(jQuery.browser.mobile){
            $('.anchor').bind('click', structure.clickMenuMobi);

            $('.masonry').slick({
                infinite: false,
                dots: true,
                arrows: false,
                autoplay: true,
                autoplaySpeed: 5000,
                speed: 500
            });
        } else {
            $('.anchor').bind('click', structure.clickMenu);
        }

        $('.open-menu').on('click', structure.openMenu);
        $('.close-menu').on('click', structure.closeMenu);

        $('#btnBuscar').on('click', structure.filterFAQ);
        $('#busca').on('keyup', structure.filterFAQ);

        $('.open-form').on('click', structure.openForm);
        $('.close-form').on('click', structure.closeForm);

        $('.btn-accept').bind('click', structure.acceptTerms);

        $.each($('.accordeon .open-item'), function(i, item) {
            $(item).on('click', structure.openInfo);
        });

        structure.loadFAQ();

        $(window).on('scroll', structure.checkScrolling);

        wow = new WOW();
        wow.init();
    },

    checkScrolling: function() {
        isScrolling = true;
        $('header').addClass('hide');

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            isScrolling = false;
            $('header').removeClass('hide');
        }, 150);
    },

    mouseEnter: function(e) {
        var _this = $(e.currentTarget);

        $('.vitrine .content .itens .item').removeClass('hover');
        _this.addClass('hover');
    },

    menuFixo: function(){
		var _y = $(this).scrollTop(),
            _header = $('header'),
            _bar = $('.fixed-bar'),
            _lateral = $('.lateral-bar'),
            _cookie = $('.cookie-bar'),
			_top = 100;
		if (_y >= _top) {
            if (!_header.hasClass('fixed')) {
				_header.addClass('fixed');
			}

            if (!_cookie.hasClass('up')) {
				_cookie.addClass('up');
			}

            if (!_bar.hasClass('fixed')) {
				_bar.addClass('fixed');
                _bar.fadeIn();
			}

            if (!_lateral.hasClass('fixed')) {
				_lateral.addClass('fixed');
                _lateral.fadeIn();
			}
		} else {
			_header.removeClass('fixed');

            _cookie.removeClass('up');

            _bar.removeClass('fixed');
            _bar.fadeOut();

            _lateral.removeClass('fixed');
            _lateral.fadeOut();
		}
	},

    clickMenu: function(e) {
        $('html, body').animate( { scrollTop: $(this.hash).offset().top - 100 } , 1000);
        structure.closeMenu();
	},

    clickMenuMobi: function(e) {
        $('html,body').animate( { scrollTop: $(this.hash).offset().top -106 } , 1000);
        structure.closeMenu();
	},

    openMenu: function() {
        $('.menu-mobile').addClass('open');
    },

    closeMenu: function() {
        $('.menu-mobile').removeClass('open');
    },

    animeBanner: function(){
		var _y = $(this).scrollTop(),
            _header = $('.cursos .top .banner'),
			_top = 30;
		if (_y >= _top) {
            if (!_header.hasClass('full')) {
				_header.addClass('full');
			}
		} else {
			_header.removeClass('full');
		}
	},

    loadFAQ: function() {
        $.getJSON(base + 'assets/js/dist/faq.json', function(data) {
            var faq = $('.faq .content-faq article');
            var listFaq = $('.faq .content-faq aside .box ul');
            faq.empty();
            listFaq.empty();

            $.each(data, function(i, item) {
                var question = $('<div class="question" id="' + item.id + '"><a href="javascript:void(0);">' + item.title + '</a></div>');
                var answer = $('<div class="text"><p>' + item.text + '</p></div>');
                var list = $('<li><a href="#" data-id="' + item.id + '">' + item.title + '</a></li>');

                question.append(answer);
                faq.append(question);
                listFaq.append(list);
            });

            // Evento para abrir/fechar perguntas
            $.each($('.question > a'), function(i, item) {
                $(item).on('click', structure.openItem);
            });

            // Evento para filtrar ao clicar na lista lateral
            listFaq.find('a').on('click', function(e) {
                e.preventDefault();
                var id = $(this).data('id');
                $('.question').hide();
                $('#' + id).show();
            });
        });
    },

    openItem: function(e) {
        var _this = $(e.currentTarget);

        if (_this.parent().hasClass('open')) {
            _this.parent().removeClass('open');
            _this.next().slideUp();
        } else {
            $('.question').removeClass('open');
            $('.question .text').slideUp();
            _this.parent().addClass('open');
            _this.next().slideDown();
        }
    },

    openInfo: function(e) {
        var _this = $(e.currentTarget);

        if (_this.hasClass('open')) {
            _this.removeClass('open');
            _this.next().slideUp();
        } else {
            $('.accordeon .open-item').removeClass('open');
            $('.accordeon .content').slideUp();
            _this.addClass('open');
            _this.next().slideDown();
        }
    },

    filterFAQ: function() {
        var search = $('#busca').val().toLowerCase();

        $.getJSON(base + 'assets/js/dist/faq.json', function(data) {
            var faq = $('.faq .content-faq article');
            faq.empty();

            // Filtra as perguntas que contêm o texto digitado
            var filtered = data.filter(function(item) {
                return item.title.toLowerCase().includes(search) || item.text.toLowerCase().includes(search);
            });

            // Exibe apenas os itens filtrados
            $.each(filtered, function(i, item) {
                var question = $('<div class="question" id="' + item.id + '"><a href="javascript:void[0];">' + item.title + '</a></div>');
                var answer = $('<div class="text"><p>' + item.text + '</p></div>');
                question.append(answer);
                faq.append(question);
            });

            // Reaplica o evento de abrir/fechar
            $.each($('.question > a'), function(i, item) {
                $(item).on('click', structure.openItem);
            });
        });
    },

    openForm: function() {
        $('.box-form').fadeIn();
    },

    closeForm: function() {
        $('.box-form').fadeOut();
        $('.box-form .success').fadeOut();
        $('#formBar').find("input[type=text]").val('');
        $('#formBar').find("input[type=text]").removeClass('erro');
        $('#formBar .loading').hide();
    },

    acceptTerms: function() {
        $('.cookie-bar').fadeOut();

        var nDays = 999;
        var cookieName = "unitedSite";
        var cookieValue = "true";

        var today = new Date();
        var expire = new Date();
        expire.setTime(today.getTime() + 3600000*24*nDays);
        document.cookie = cookieName+"="+escape(cookieValue)+";expires="+expire.toGMTString()+";path=/";
    }
};

var contactLead = {

    vNome: null,
	vTelefone: null,
    vEmail: null,
    vUrl: null,
    vCheck: false,

    init: function () {
		
		contactLead.vNome = $("#nome");
		contactLead.vTelefone = $("#telefone");
        contactLead.vEmail = $("#email");
        contactLead.vUrl = $("#url");

        contactLead.vUrl.on('focus', function() {
            $('#formLead button').attr('disabled', 'disabled');
        });

        $('#formLead').find("input[type=text]").val('');

        var SPMaskBehavior = function (val) {
			return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
		},
		spOptions = {
			onKeyPress: function(val, e, field, options) {
				field.mask(SPMaskBehavior.apply({}, arguments), options);
			}
		};
		
		$('#telefone').mask(SPMaskBehavior, spOptions);

        $('#formLead button').bind('click', contactLead.checkAll);
    },

    /* ------------------------------------------
    * @add funcoes de validacao
    * ------------------------------------------
    */

    checkEmail: function (obj) {
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test($(obj).val())) return true;
        else return false;
    },

    checkBlank: function (obj) {
        if ($(obj).val() != '') return true;
        else return false;
    },

    checkAll: function () {
        contactLead.vCheck = true;

        if (!contactLead.checkBlank(contactLead.vNome)) {
            contactLead.vCheck = false;
            contactLead.vNome.addClass('erro');
        }
		
		if (!contactLead.checkBlank(contactLead.vTelefone)) {
            contactLead.vCheck = false;
            contactLead.vTelefone.addClass('erro');
        }

        if (contactLead.checkBlank(contactLead.vUrl)) {
            contactLead.vCheck = false;
            contactLead.vUrl.addClass('erro');
            $('#formLead button').attr('disabled', 'disabled');
        }

        if (!contactLead.checkBlank(contactLead.vEmail) || !contactLead.checkEmail(contactLead.vEmail)) {
            contactLead.vCheck = false;
            contactLead.vEmail.addClass('erro');
        }

        if (contactLead.vCheck) {
            contactLead.enviarCadastro();
        }

        return false;
    },

    validaForm: function () {
        if (!contactLead.checkBlank($(this))) {
            $(this).addClass('erro');
        } else if ($(this).attr("id") == "email" && !contactLead.checkEmail($(this))) {
            $(this).addClass('erro');
        } else {
            $(this).removeClass("erro");
        }

        return false;
    },

    enviarCadastro: function () {

        $('#formLead .loading').fadeIn();

        var _nome = contactLead.vNome.val();
		var _telefone = contactLead.vTelefone.val();
        var _email = contactLead.vEmail.val();
        var _url = contactLead.vUrl.val();
		var _identificador = $('#formLead #identificador').val();
        
        if ($('#unidade').length) {
            var _data = {
                "nome": _nome,
                "telefone": _telefone,
                "email": _email,
                "url": _url,
                "unidade": $('#unidade').val(),
                "identificador": _identificador
            }
        } else {
            var _data = {
                "nome": _nome,
                "telefone": _telefone,
                "email": _email,
                "url": _url,
                "identificador": _identificador
            }
        }

        $.ajax({
            type: "POST",

            url: base + "ajax/formMatricule.php",

            global: true,

            data: _data,

            success: function (msg) {
                if (msg.toLowerCase() == "true") {
                    $('#formLead .success').fadeIn(function () {
                        $('#formLead').find("input[type=text]").val('');
                        $('#formLead .loading').fadeOut();
                    });

                    // setTimeout(function () {
					// 	$('#formLead .success').fadeOut();
                    // }, 4000);
                } else {
                    contactLead.errorCadastro();
				}
            },
            error: function (msg) {
				contactLead.errorCadastro();
            }
		});
		return false;
    },

    errorCadastro: function () {
        alert('Houve um erro, tente novamente!');
    }
};

var contactForm = {

    vNome: null,
	vTelefone: null,
    vEmail: null,
    vUrl: null,
    vCheck: false,

    init: function () {
		
		contactForm.vNome = $("#name");
		contactForm.vTelefone = $("#phone");
        contactForm.vEmail = $("#mail");
        contactForm.vUrl = $("#site");

        contactForm.vUrl.on('focus', function() {
            $('#formBar button').attr('disabled', 'disabled');
        });

        $('#formBar').find("input[type=text]").val('');

        var SPMaskBehavior = function (val) {
			return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
		},
		spOptions = {
			onKeyPress: function(val, e, field, options) {
				field.mask(SPMaskBehavior.apply({}, arguments), options);
			}
		};
		
		$('#phone').mask(SPMaskBehavior, spOptions);

        $('#formBar button').bind('click', contactForm.checkAll);
    },

    /* ------------------------------------------
    * @add funcoes de validacao
    * ------------------------------------------
    */

    checkEmail: function (obj) {
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test($(obj).val())) return true;
        else return false;
    },

    checkBlank: function (obj) {
        if ($(obj).val() != '') return true;
        else return false;
    },

    checkAll: function () {
        contactForm.vCheck = true;

        if (!contactForm.checkBlank(contactForm.vNome)) {
            contactForm.vCheck = false;
            contactForm.vNome.addClass('erro');
        }
		
		if (!contactForm.checkBlank(contactForm.vTelefone)) {
            contactForm.vCheck = false;
            contactForm.vTelefone.addClass('erro');
        }

        if (contactForm.checkBlank(contactForm.vUrl)) {
            contactForm.vCheck = false;
            contactForm.vUrl.addClass('erro');
            $('#formBar button').attr('disabled', 'disabled');
        }

        if (!contactForm.checkBlank(contactForm.vEmail) || !contactForm.checkEmail(contactForm.vEmail)) {
            contactForm.vCheck = false;
            contactForm.vEmail.addClass('erro');
        }

        if (contactForm.vCheck) {
            contactForm.enviarCadastro();
        }

        return false;
    },

    validaForm: function () {
        if (!contactForm.checkBlank($(this))) {
            $(this).addClass('erro');
        } else if ($(this).attr("id") == "email" && !contactForm.checkEmail($(this))) {
            $(this).addClass('erro');
        } else {
            $(this).removeClass("erro");
        }

        return false;
    },

    enviarCadastro: function () {

        $('#formBar .loading').fadeIn();

        var _nome = contactForm.vNome.val();
		var _telefone = contactForm.vTelefone.val();
        var _email = contactForm.vEmail.val();
        var _url = contactForm.vUrl.val();
		var _identificador = $('#formBar #identify').val();

        if ($('#unit').length) {
            var _data = {
                "nome": _nome,
                "telefone": _telefone,
                "email": _email,
                "url": _url,
                "unidade": $('#unit').val(),
                "identificador": _identificador
            }
        } else {
            var _data = {
                "nome": _nome,
                "telefone": _telefone,
                "email": _email,
                "url": _url,
                "identificador": _identificador
            }
        }

        $.ajax({
            type: "POST",

            url: base + "ajax/formMatricule.php",

            global: true,

            data: _data,

            success: function (msg) {
                if (msg.toLowerCase() == "true") {
                    $('.box-form .success').fadeIn(function () {
                        $('#formBar').find("input[type=text]").val('');
                        $('#formBar .loading').fadeOut();
                    });

                    setTimeout(function () {
                        $('.box-form').fadeOut();
						$('.box-form .success').fadeOut();
                    }, 4000);
                } else {
                    contactForm.errorCadastro();
				}
            },
            error: function (msg) {
				contactForm.errorCadastro();
            }
		});
		return false;
    },

    errorCadastro: function () {
        alert('Houve um erro, tente novamente!');
    }
};

$(document).ready(structure.init);