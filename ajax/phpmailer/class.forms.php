<?php
require($_SERVER['DOCUMENT_ROOT']."/includes/config_site.php");

function ADMSYS_FORM_TRABAJO($FROM, $HEADER_MESSAGE, $SUBJECT, $ADD_ADDRESS, $ADD_BCC){
	
	$comentarios=nl2br(htmlspecialchars(strip_tags($Comentarios)));
    $mail = new PHPMailer();
	$mail->PluginDir = "";
	$mail->Mailer = "smtp";
	$mail->Host = "ssl://smtp.gmail.com";
	$mail->Port="465";
	$mail->SMTPAuth = true;
	$mail->Username = SMTP_user; 
	$mail->Password = SMTP_pass;

    $mail->From = $FROM[0];
    $mail->FromName = htmlspecialchars($FROM[1]);
    $mail->Subject = htmlspecialchars($SUBJECT);
    $mail->AddAddress($ADD_ADDRESS[0],$ADD_ADDRESS[1]);
	$mail->AddBCC($ADD_BCC);

    $body  ='
	<table width="500">
	<tr>
	<td style="background: #72727f; border: 2px solid #59595f; padding: 15px 15px 12px 15px; font-family: Helvetica, Arial, Sans-Serif;">
	<table width="100%" cellpadding="0" cellspacing="0">
	<tr>
	<td width="500" style="background: #fff; border: 2px solid #59595f; color: #404040;">
	<table style="border-collapse: collapse; width: 100%;">
	<tr>
	<td style="background: #f0f0f0; border-bottom: 1px solid #ccc; padding: 24px 20px 19px 20px;">
	<h1 style="margin: 0; font-size: 18px; color: #42424f;">'. $HeaderMessage .'</h1>
	</td>
	</tr>
	<tr>
	<td valign="top" style="padding: 13px 15px; font-size: 14px; line-height: 16px;">
	<table width="100%" border="0" cellspacing="0" cellpadding="7" style="font-size:14px; color:#42424f">
	<tr>
	<td width="100" style="border-bottom:1px solid #f0f0f0"><strong>Nombre</strong></td>
	<td style="border-bottom:1px solid #f0f0f0">: '. $_POST[txt_nombre] .'</td>
	</tr>
	<tr>
	<td style="border-bottom:1px solid #f0f0f0"><strong>Apellidos</strong></td>
	<td style="border-bottom:1px solid #f0f0f0">: '. $_POST[txt_apellido] .'</td>
	</tr>
	<tr>
	<td style="border-bottom:1px solid #f0f0f0"><strong>E-mail</strong></td>
	<td style="border-bottom:1px solid #f0f0f0">: '. $_POST[txt_email] .'</td>
	</tr>
	<tr>
	<td style="border-bottom:1px solid #f0f0f0"><strong>Tel&eacute;fono</strong></td>
	<td style="border-bottom:1px solid #f0f0f0">: '. $_POST[txt_telefono] .'</td>
	</tr>
	</table>
	<p>&nbsp;</p>
	<p>&nbsp;</p> 
	</td>
	</tr>
	</table>
	</td>
	</tr>
	<tr>
	<td>
	<p style="margin: 12px 0 0 0; font-size: 13px; color: #f9f9f9;">
	<strong>Nota:</strong> algunos tildes han sido omitidos intencionalmente.
	</p>
	</td>
	</tr>
	<tr>
	<td>&nbsp;</td>
	</tr>
	<tr>
	<td align="right" style="font-size:11px; color:#f9f9f9">Servicio proporcionado por <a href="http://www.admsys.cl" style="font-weight: bold; color: #f9f9f9; text-decoration:underline;" target="_blank">admsys</a></td>
	</tr>
	</table>
	</td>
	</tr>
	</table>
	';
    $mail->Body = $body;
    $mail->AltBody = $Subject;
    $mail->IsHTML(true);
    $mail->Send();
}


function ADMSYS_FORM_CONTACTO($FROM, $HEADER_MESSAGE, $SUBJECT, $ADD_ADDRESS, $ADD_BCC){
	
	$comentarios=nl2br(htmlspecialchars(strip_tags($Comentarios)));
    $mail = new PHPMailer();
	$mail->PluginDir = "";
	$mail->Mailer = "smtp";
	$mail->Host = "ssl://smtp.gmail.com";
	$mail->Port="465";
	$mail->SMTPAuth = true;
	$mail->Username = SMTP_user; 
	$mail->Password = SMTP_pass;

    $mail->From = $From[0];
    $mail->FromName = htmlspecialchars($From[1]);
    $mail->Subject = htmlspecialchars($Subject);
    $mail->AddAddress($AddAddress[0],$AddAddress[1]);
	$mail->AddBCC($AddBCC);
	$mail->AddReplyTo($From[0], htmlspecialchars($From[1]));

    $body  ='
	<table width="500">
	<tr>
	<td style="background: #72727f; border: 2px solid #59595f; padding: 15px 15px 12px 15px; font-family: Helvetica, Arial, Sans-Serif;">
	<table width="100%" cellpadding="0" cellspacing="0">
	<tr>
	<td width="500" style="background: #fff; border: 2px solid #59595f; color: #404040;">
	<table style="border-collapse: collapse; width: 100%;">
	<tr>
	<td style="background: #f0f0f0; border-bottom: 1px solid #ccc; padding: 24px 20px 19px 20px;">
	<h1 style="margin: 0; font-size: 18px; color: #42424f;">'. $HeaderMessage .'</h1>
	</td>
	</tr>
	<tr>
	<td valign="top" style="padding: 13px 15px; font-size: 14px; line-height: 16px;">
	<table width="100%" border="0" cellspacing="0" cellpadding="7" style="font-size:14px; color:#42424f">
	<tr>
	<td width="100" style="border-bottom:1px solid #f0f0f0"><strong>Nombre</strong></td>
	<td style="border-bottom:1px solid #f0f0f0">: '. $_POST[txt_nombre] .'</td>
	</tr>
	<tr>
	<td style="border-bottom:1px solid #f0f0f0"><strong>Apellidos</strong></td>
	<td style="border-bottom:1px solid #f0f0f0">: '. $_POST[txt_apellido] .'</td>
	</tr>
	<tr>
	<td style="border-bottom:1px solid #f0f0f0"><strong>E-mail</strong></td>
	<td style="border-bottom:1px solid #f0f0f0">: '. $_POST[txt_email] .'</td>
	</tr>
	<tr>
	<td style="border-bottom:1px solid #f0f0f0"><strong>Tel&eacute;fono</strong></td>
	<td style="border-bottom:1px solid #f0f0f0">: '. $_POST[txt_telefono] .'</td>
	</tr>
	<tr>
	<td valign="top" style="border-bottom:1px solid #f0f0f0"><strong>Comentarios</strong></td>
	<td valign="top" style="border-bottom:1px solid #f0f0f0">: '. $comentarios .'</td>
	</tr>
	</table>
	<p>&nbsp;</p>
	<p>&nbsp;</p> 
	</td>
	</tr>
	</table>
	</td>
	</tr>
	<tr>
	<td>
	<p style="margin: 12px 0 0 0; font-size: 13px; color: #f9f9f9;">
	<strong>Nota:</strong> algunos tildes han sido omitidos intencionalmente.
	</p>
	</td>
	</tr>
	<tr>
	<td>&nbsp;</td>
	</tr>
	<tr>
	<td align="right" style="font-size:11px; color:#f9f9f9">Servicio proporcionado por <a href="http://www.admsys.cl" style="font-weight: bold; color: #f9f9f9; text-decoration:underline;" target="_blank">admsys</a></td>
	</tr>
	</table>
	</td>
	</tr>
	</table>
	';
    $mail->Body = $body;
    $mail->AltBody = $Subject;
    $mail->IsHTML(true);
    $mail->Send();
}
?>