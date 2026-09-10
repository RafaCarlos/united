<?php

    include_once('config-new.php');

    $nome = $_POST['nome'];
    $telefone = $_POST['telefone'];
    $email = $_POST['email'];
    $unidade = $_POST['unidade'];
    $identificador = $_POST['identificador'];
    $date = $_POST['date'];

    $dateMod = implode('-', array_reverse(explode('/', $date)));

    $query = $db->query("SELECT * FROM tbl_unidades WHERE unidade='{$unidade}'");
    $reg = $query->fetch_row();
    $check1 = $reg[1];
    $check2 = $reg[20];
    $check3 = $reg[21];
    $check4 = $reg[22];

    $emailEnvio = $check2;

    if (empty($check3)) {
        $emailCopia = 'comercial@united18.com.br';
    } else {
        $emailCopia = $check3;
    }

    if (empty($check4)) {
        $emailCopia2 = 'comercial@united18.com.br';
    } else {
        $emailCopia2 = $check4;
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
    $mail->Password = 'asdhhjwdakmtprqm';

    $mensagem = '<html><head><title>United Idiomas</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"><style>/* reset */img{border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none;}table{border-collapse: collapse !important;}body{height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important;}/* iOS BLUE LINKS */a[x-apple-data-detectors]{color: inherit !important;text-decoration: none !important;font-size: inherit !important;font-family: inherit !important;font-weight: inherit !important;line-height: inherit !important;}/* ANDROID CENTER FIX */div[style*="margin: 16px 0;"]{margin: 0 !important;}</style></head><body style="margin: 0 !important;padding: 0 !important; background-color: #ffffff;" bgcolor="#ffffff"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px;"><tbody><tr><td align="center" valign="top" width="100%" style="background-color: #1f2f54; background-image: url(https://www.unitedidiomas.com/email-marketing/lead/images/top.jpg); background-position: center top;" background="https://www.unitedidiomas.com/email-marketing/lead/images/top.jpg" bgcolor="#1f2f54"><table style="max-width: 600px;" align="center" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td height="50"></td></tr><tr><td align="center" height="190" width="100%" valign="top"><img src="https://www.unitedidiomas.com/email-marketing/lead/images/logo.png" alt="United Idiomas"></td></tr><tr align="center" height="168" width="100%" valign="top"><td><img src="https://www.unitedidiomas.com/email-marketing/lead/images/art.png" alt=""></td></tr><tr><td align="center" width="100%" valign="top" style="color: #fff; font-family: Arial, sans-serif; font-size: 36px; font-weight: 700;">Olá, chegou novo contato!</td></tr><tr><td align="center" height="110" width="100%" valign="top" style="color: #fff; font-family: Arial, sans-serif; font-size: 16px;"><p>A '. $unidade .' recebeu um novo contato pelo site, para visualizá-lo acesse:</p><p><a href="https://www.unitedidiomas.com/gerenciador" target="_blank" style="color: #ffffff; font-size: 20px; font-weight: bold;">www.unitedidiomas.com/gerenciador</a></p></td></tr></tbody></table></td></tr></tbody></table></body></html>';

    // $mensagem = '<html><body>';
    // $mensagem .= '<h1 style="font-size:15px;">' . utf8_decode('United Idiomas - Quero ser aluno') . '</h1>';
    // $mensagem .= '<table style="border-color: #666; font-size:11px" cellpadding="10">';
    // $mensagem .= '<tr style="background: #eee;"><td><strong>Nome:</strong> </td><td>' . utf8_decode($nome) . '</td></tr>';
    // $mensagem .= '<tr><td><strong>E-mail:</strong> </td><td>' . utf8_decode($email) . '</td></tr>';
    // $mensagem .= '<tr><td><strong>Telefone / WhatsApp:</strong> </td><td>' . utf8_decode($telefone) . '</td></tr>';
    // $mensagem .= '<tr><td><strong>Unidade:</strong> </td><td>' . utf8_decode($unidade) . '</td></tr>';
    // $mensagem .= '<tr><td><strong>Contato via:</strong> </td><td>' . utf8_decode($identificador) . '</td></tr>';
    // $mensagem .= '</table>';
    // $mensagem .= '</body></html>';

    $mail->FromName = 'United Idiomas';
    $mail->From = 'unitedmatriculas@gmail.com';
    $mail->AddAddress($emailEnvio);
    $mail->AddCC($emailCopia);
    $mail->AddCC($emailCopia2);
    $mail->Subject = utf8_decode('United Idiomas - PM '. $unidade);
    $mail->MsgHTML($mensagem);

    if ($mail->Send()) {
        $insert = $db->query("INSERT INTO tbl_pedidos_matriculas (nome, telefone, email, unidade, identificador, data_mensagem, data_status) 
        VALUES('{$nome}', '{$telefone}', '{$email}', '{$unidade}', '{$identificador}', '{$dateMod}', now())");

        if ($db->affected_rows > 0){
            echo "true";
        } else {
            echo "false";
        }
    } else {
        echo 'false';
    }

?>