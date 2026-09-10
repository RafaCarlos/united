<?php
error_reporting (E_ALL & ~ E_NOTICE & ~ E_DEPRECATED);

define('BD_USER', 'unite987_usr5470'); // USE O TEU USUÁRIO DE BANCO DE DADOS
define('BD_PASS', '11@Un!ted'); // USE A TUA SENHA DO BANCO DE DADOS
define('BD_NAME', 'unite987_unitedsite'); // USE O NOME DO TEU BANCO DE DADOS

mysql_connect('localhost', BD_USER, BD_PASS);
mysql_select_db(BD_NAME);
mysql_set_charset('utf8');

?>
