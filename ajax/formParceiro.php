<?php

    include_once('config-new.php');

    $nome = $_POST['nome'];
    $telefone = $_POST['telefone'];
    $email = $_POST['email'];

    // $sql = mysql_query("INSERT INTO tbl_mensagem_parceiros (nome, telefone, email, data_mensagem) 
    //     VALUES('{$nome}', '{$telefone}', '{$email}', now())") 
    //     or die( mysql_error() );

    $insert = $db->query("INSERT INTO tbl_mensagem_parceiros (nome, telefone, email, data_mensagem) VALUES('{$nome}', '{$telefone}', '{$email}', now())");

    // if (mysql_affected_rows() > 0){
    if ($db->affected_rows > 0){
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

        $mensagem = '<html><body>';
        $mensagem .= '<h1 style="font-size:15px;">' . utf8_decode('Parcerias Corporativas - Contato') . '</h1>';
        $mensagem .= '<table style="border-color: #666; font-size:11px" cellpadding="10">';
        $mensagem .= '<tr style="background: #eee;"><td><strong>Nome:</strong> </td><td>' . utf8_decode($nome) . '</td></tr>';
        $mensagem .= '<tr><td><strong>E-mail:</strong> </td><td>' . utf8_decode($email) . '</td></tr>';
        $mensagem .= '<tr><td><strong>Telefone:</strong> </td><td>' . utf8_decode($telefone) . '</td></tr>';
        $mensagem .= '</table>';
        $mensagem .= '</body></html>';

        $mail->FromName = 'United Idiomas';
        $mail->From = 'unitedmatriculas@gmail.com';
        $mail->AddAddress('franqueadora@united18.com.br');
        $mail->AddCC('rodrigo@united18.com.br');
        $mail->Subject = utf8_decode('Parcerias Corporativas - Contato');
        $mail->MsgHTML($mensagem);

        if ($mail->Send()) {
            echo 'true';
        } else {
            echo 'false';
        }
    } else {
        echo "false";
    }

?>