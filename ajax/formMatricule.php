<?php

include_once('config-new.php');

$nome = $_POST['nome'];
$telefone = $_POST['telefone'];
$email = $_POST['email'];
if (!isset($email)) {
    $email = 'comercial@united18.com.br';
}
$unidade = $_POST['unidade'];
$identificador = $_POST['identificador'];

if (isset($unidade)) {
    $query = $db->query("SELECT * FROM tbl_unidades WHERE unidade='{$unidade}'");
    $reg = $query->fetch_row();

    $emailEnvio = $reg[20];
    $emailCopia = $reg[21];
    $emailCopia2 = $reg[22];

    if (empty($emailCopia)) {
        $emailCopia = 'comercial@united18.com.br';
    }

    if (empty($emailCopia2)) {
        $emailCopia2 = 'comercial@united18.com.br';
    }
} else {
    $query = $db->query("SELECT * FROM tbl_unidades WHERE inadimplente='0' AND fila='0' AND ativo='0' LIMIT 0, 1");
    $count = $query->fetch_row();

    if ($count == 0) {
        $query2 = $db->query("UPDATE tbl_unidades SET fila='0'");

        $query3 = $db->query("SELECT * FROM tbl_unidades WHERE inadimplente='0' AND fila='0' AND ativo='0' LIMIT 0, 1");
        $reg2 = $query3->fetch_row();
        $unidade = $reg2[1];
        $emailEnvio = $reg2[20];
        $emailCopia = $reg2[21];
        $emailCopia2 = $reg2[22];

        if (empty($emailCopia)) {
            $emailCopia = 'comercial@united18.com.br';
        }
    
        if (empty($emailCopia2)) {
            $emailCopia2 = 'comercial@united18.com.br';
        }

        $query4 = $db->query("UPDATE tbl_unidades SET fila='1' WHERE unidade='$unidade'");
    } else {
        $query2 = $db->query("SELECT * FROM tbl_unidades WHERE inadimplente='0' AND fila='0' AND ativo='0' LIMIT 0, 1");

        $reg3 = $query2->fetch_row();
        $unidade = $reg3[1];
        $emailEnvio = $reg3[20];
        $emailCopia = $reg3[21];
        $emailCopia2 = $reg3[22];

        if (empty($emailCopia)) {
            $emailCopia = 'comercial@united18.com.br';
        }
    
        if (empty($emailCopia2)) {
            $emailCopia2 = 'comercial@united18.com.br';
        }

        $query3 = $db->query("UPDATE tbl_unidades SET fila='1' WHERE unidade='$unidade'");
    }
}

require_once 'phpmailer/class.phpmailer.php';
$mail = new PHPMailer();
$mail->CharSet = 'UTF-8';
$mail->IsSMTP();
// $mail->SMTPDebug = 1;
$mail->SMTPAuth = true;
$mail->SMTPSecure = 'tls';
$mail->Host = "smtp.gmail.com";
$mail->Port = 587;
$mail->Username = 'unitedmatriculas@gmail.com';
// $mail->Password = 'pmsite11';
$mail->Password = 'asdhhjwdakmtprqm';

$mensagem = '<html><head><title>United Idiomas</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"><style>/* reset */img{border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none;}table{border-collapse: collapse !important;}body{height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important;}/* iOS BLUE LINKS */a[x-apple-data-detectors]{color: inherit !important;text-decoration: none !important;font-size: inherit !important;font-family: inherit !important;font-weight: inherit !important;line-height: inherit !important;}/* ANDROID CENTER FIX */div[style*="margin: 16px 0;"]{margin: 0 !important;}</style></head><body style="margin: 0 !important;padding: 0 !important; background-color: #ffffff;" bgcolor="#ffffff"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px;"><tbody><tr><td align="center" valign="top" width="100%" style="background-color: #1f2f54; background-image: url(https://www.unitedidiomas.com/email-marketing/lead/images/top.jpg); background-position: center top;" background="https://www.unitedidiomas.com/email-marketing/lead/images/top.jpg" bgcolor="#1f2f54"><table style="max-width: 600px;" align="center" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td height="50"></td></tr><tr><td align="center" height="190" width="100%" valign="top"><img src="https://www.unitedidiomas.com/email-marketing/lead/images/logo.png" alt="United Idiomas"></td></tr><tr align="center" height="168" width="100%" valign="top"><td><img src="https://www.unitedidiomas.com/email-marketing/lead/images/art.png" alt=""></td></tr><tr><td align="center" width="100%" valign="top" style="color: #fff; font-family: Arial, sans-serif; font-size: 36px; font-weight: 700;">Olá, chegou novo contato!</td></tr><tr><td align="center" height="110" width="100%" valign="top" style="color: #fff; font-family: Arial, sans-serif; font-size: 16px;"><p>A '. $unidade .' recebeu um novo contato pelo site, para visualizá-lo acesse:</p><p><a href="https://www.unitedidiomas.com/gerenciador" target="_blank" style="color: #ffffff; font-size: 20px; font-weight: bold;">www.unitedidiomas.com/gerenciador</a></p></td></tr></tbody></table></td></tr></tbody></table></body></html>';

$mail->FromName = 'United Idiomas';
$mail->From = 'unitedmatriculas@gmail.com';
$mail->AddAddress($emailEnvio);
$mail->AddCC($emailCopia);
$mail->AddCC($emailCopia2);
$mail->Subject = utf8_decode('United Idiomas - PM '. $unidade);
$mail->MsgHTML($mensagem);

if ($mail->Send()) {
    $mail2 = new PHPMailer();
    $mail2->CharSet = 'UTF-8';
    $mail2->IsSMTP();
    // $mail2->SMTPDebug = 1;
    $mail2->SMTPAuth = true;
    $mail2->SMTPSecure = 'tls';
    $mail2->Host = "smtp.gmail.com";
    $mail2->Port = 587;
    $mail2->Username = 'unitedmatriculas@gmail.com';
    // $mail2->Password = 'pmsite11';
    $mail2->Password = 'asdhhjwdakmtprqm';

    $mensagem2 = '<html><head><title>United Idiomas</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"><style>/* reset */img{border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none;}table{border-collapse: collapse !important;}body{height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important;}/* iOS BLUE LINKS */a[x-apple-data-detectors]{color: inherit !important;text-decoration: none !important;font-size: inherit !important;font-family: inherit !important;font-weight: inherit !important;line-height: inherit !important;}/* ANDROID CENTER FIX */div[style*="margin: 16px 0;"]{margin: 0 !important;}</style></head><body style="margin: 0 !important;padding: 0 !important; background-color: #ffffff;" bgcolor="#ffffff"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px;"><tbody><tr><td align="center" valign="top" width="100%" style="background-color: #1f2f54; background-image: url(https://www.unitedidiomas.com/email-marketing/lead/images/top.jpg); background-position: center top;" background="https://www.unitedidiomas.com/email-marketing/lead/images/top.jpg" bgcolor="#1f2f54"><table style="max-width: 600px;" align="center" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td height="50"></td></tr><tr><td align="center" height="190" width="100%" valign="top"><img src="https://www.unitedidiomas.com/email-marketing/lead/images/logo.png" alt="United Idiomas"></td></tr><tr align="center" height="168" width="100%" valign="top"><td><img src="https://www.unitedidiomas.com/email-marketing/lead/images/art.png" alt=""></td></tr><tr><td align="center" width="100%" valign="top" style="color: #fff; font-family: Arial, sans-serif; font-size: 36px; font-weight: 700;"><font style="color: #fff; font-family: Arial, sans-serif; font-size: 36px; font-weight: 700;">Obrigado pelo contato!</font></td></tr><tr><td align="center" height="110" width="100%" valign="top" style="color: #fff; font-family: Arial, sans-serif; font-size: 16px;"><font style="color: #fff; font-family: Arial, sans-serif; font-size: 16px;"><strong>Estamos aqui para te ajudar a vencer o desafio de falar inglês.</strong><br>Em até <strong>24hrs</strong>, um consultor da United entrará em contato com você.</font></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px;"><tbody><tr><td align="center" valign="top" width="100%"><table style="max-width: 600px;" align="center" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td align="center" height="156" width="100%" style="color: #343434; font-family: Arial, sans-serif; font-size: 20px;"><font style="color: #343434; font-family: Arial, sans-serif; font-size: 20px;">E sabemos que a <strong>Metodologia Híbrida da United</strong> foi<br>decisória para te convencer a dar o 1º passo!<br>Vamos reforçar alguns pontos?</font></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px;"><tbody><tr><td align="center" valign="top" width="100%"><table style="max-width: 600px;" align="center" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td align="center" width="50%" height="75" style="color: #b62332; font-family: Arial, sans-serif; font-size: 20px; font-weight: 900;"><font style="color: #b62332; font-family: Arial, sans-serif; font-size: 20px; font-weight: 900;">O MELHOR DO ENSINO PRESENCIAL</font></td><td align="center" width="50%" height="75" style="color: #355a87; font-family: Arial, sans-serif; font-size: 20px; font-weight: 900;"><font style="color: #355a87; font-family: Arial, sans-serif; font-size: 20px; font-weight: 900;">COM A PRATICIDADE DO ONLINE</font></td></tr><tr><td height="5" width="50%" bgcolor="#b62332"></td><td height="5" width="50%" bgcolor="#355a87"></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px;"><tbody><tr><td align="center" valign="top" width="100%"><table style="max-width: 600px;" align="center" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td width="50%"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" width="50%" style="padding-top: 20px; padding-bottom: 20px;"><img src="https://www.unitedidiomas.com/email-marketing/lead/images/ico-01.png" alt=""></td><td width="50%" style="color: #b62332; font-family: Arial, sans-serif; font-size: 15px;"><font style="color: #b62332; font-family: Arial, sans-serif; font-size: 15px;">Curso rápido com foco em 18 meses</font></td></tr><tr><td align="center" width="50%" style="padding-top: 20px; padding-bottom: 20px;"><img src="https://www.unitedidiomas.com/email-marketing/lead/images/ico-03.png" alt=""></td><td width="50%" style="color: #b62332; font-family: Arial, sans-serif; font-size: 15px;"><font style="color: #b62332; font-family: Arial, sans-serif; font-size: 15px;">Horários flexíveis e programáveis</font></td></tr><tr><td align="center" width="50%" style="padding-top: 20px; padding-bottom: 20px;"><img src="https://www.unitedidiomas.com/email-marketing/lead/images/ico-05.png" alt=""></td><td width="50%" style="color: #b62332; font-family: Arial, sans-serif; font-size: 15px;"><font style="color: #b62332; font-family: Arial, sans-serif; font-size: 15px;">Turmas reduzidas com foco em conversação</font></td></tr></table></td><td width="50%"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td><table><tbody><tr><td align="center" width="50%" style="padding-top: 20px; padding-bottom: 20px;"><img src="https://www.unitedidiomas.com/email-marketing/lead/images/ico-02.png" alt=""></td><td width="50%" style="color: #355a87; font-family: Arial, sans-serif; font-size: 15px;"><font style="color: #355a87; font-family: Arial, sans-serif; font-size: 15px;">Agendamento de aula pelo App</font></td></tr></tbody></table></td></tr><tr><td><table><tr><td align="center" width="50%"><img src="https://www.unitedidiomas.com/email-marketing/lead/images/ico-04.png" alt="" style="padding-top: 20px; padding-bottom: 20px;"></td><td width="50%" style="color: #355a87; font-family: Arial, sans-serif; font-size: 15px;"><font style="color: #355a87; font-family: Arial, sans-serif; font-size: 15px;">Plataforma EAD Completa</font></td></tr></table></td></tr><tr><td align="center" width="100%" style="padding-top: 20px; padding-bottom: 20px;"><a href="https://www.unitedidiomas.com/o-curso" target="_blank"><img src="https://www.unitedidiomas.com/email-marketing/lead/images/button.png" alt="" border="0"></a></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px;"><tbody><tr><td valign="top" width="100%" style="background-color: #1f2f54; background-image: url(https://www.unitedidiomas.com/email-marketing/lead/images/bottom.jpg); background-position: center top;" background="https://www.unitedidiomas.com/email-marketing/lead/images/bottom.jpg" bgcolor="#1f2f54"><table style="max-width: 300px;" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td align="center" height="332" width="100%"><img src="https://www.unitedidiomas.com/email-marketing/lead/images/logo-unitedon.png" alt=""></td></tr><tr><td align="center" height="150" width="100%" style="color: #fff; font-family: Arial, sans-serif; font-size: 16px;"><font style="color: #fff; font-family: Arial, sans-serif; font-size: 16px;">E lembre-se, você tem acesso<br>completo aos módulos<br>interativos complementares do<br><strong>UnitedOn Student</strong>.</font></td></tr><tr><td height="20" width="100%"></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px;"><tbody><tr><td align="center" valign="top" width="100%"><table style="max-width: 600px;" align="center" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td height="55" width="100%"></td></tr><tr><td width="100%" height="92" align="center" valign="top" style="color: #353535; font-family: Arial, sans-serif; font-size: 40px; font-weight: 700;"><font style="color: #353535; font-family: Arial, sans-serif; font-size: 40px; font-weight: 700;">FICOU COM<br>ALGUMA DÚVIDA?</font></td></tr><tr><td width="100%" height="82" align="center" valign="top" style="color: #353535; font-family: Arial, sans-serif; font-size: 21px;"><font style="color: #353535; font-family: Arial, sans-serif; font-size: 21px;">Não tem problema! Você poderá esclarecer tudo<br>sobre o curso da United com os nossos consultores.</font></td></tr><tr><td width="100%" align="center"><img src="https://www.unitedidiomas.com/email-marketing/lead/images/logo2.png" alt="United Idiomas"></td></tr><tr><td height="55" width="100%"></td></tr></tbody></table></td></tr></tbody></table></body></html>';

    $mail2->FromName = 'United Idiomas';
    $mail2->From = 'unitedmatriculas@gmail.com';
    $mail2->AddAddress($email);
    $mail2->Subject = utf8_decode('United Idiomas - Quero ser aluno');
    $mail2->MsgHTML($mensagem2);

    if ($mail2->Send()) {
        $insert = $db->query("INSERT INTO tbl_pedidos_matriculas (nome, telefone, email, unidade, identificador, data_mensagem, data_status) VALUES('{$nome}', '{$telefone}', '{$email}', '{$unidade}', '{$identificador}', now(), now())");

        if ($db->affected_rows > 0){
            echo "true";
        } else {
            echo "false";
        }
    } else {
        echo 'false';
    }
} else {
    echo 'false';
}

?>