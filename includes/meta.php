<?php

//DB details
$dbHost = 'localhost';
$dbUsername = 'unite987_usr5470';
$dbPassword = '11@Un!ted';
$dbName = 'unite987_unitedsite';

//Create connection and select DB
$mysqli = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);

$mysqli->set_charset("utf8");

// Identifca sub-link

$link = $_SERVER['REQUEST_URI'];

$linkog = "https://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";

$linkog = rtrim($linkog,"/");

// Limpeza da URL 

$link = rtrim($link,'/');

$link = ltrim($link,'/');   

$qmeta = $mysqli->query("SELECT * FROM metas WHERE pagina = '$link'");



if($qmeta->num_rows == 1){

	while($rm = $qmeta->fetch_object()){

		echo '<title>'.$rm->titulo.'</title>';

		echo '<link rel="canonical" href="'.$linkog.'" />';

		echo '<meta name="description" content="'.$rm->descr.'">';

		echo '<meta itemprop="name" content="'.$rm->titulo.'">';

		echo '<meta itemprop="description" content="'.$rm->descr.'">';

		echo '<meta name="keywords" content="'.$rm->keywords.'">';

		echo '<meta name="og:site_name" content="United Idiomas">';

		echo '<meta name="og:locale" content="pt_BR">';

		echo '<meta name="og:type" content="website">';

		echo '<meta name="og:url" content="'.$linkog.'">';

		echo '<meta name="twitter:card" content="summary">';

		echo '<meta name="twitter:title" content="'.$rm->titulo.'">';

		echo '<meta name="twitter:description" content="'.$rm->descr.'">';

	}

}else{

	$qmeta = $mysqli->query("SELECT * FROM metas WHERE pagina = 'default'");

	while($rm = $qmeta->fetch_object()){

		echo '<title>'.$rm->titulo.'</title>';

		echo '<link rel="canonical" href="'.$linkog.'" />';

		echo '<meta name="description" content="'.$rm->descr.'">';

		echo '<meta itemprop="name" content="'.$rm->titulo.'">';

		echo '<meta itemprop="description" content="'.$rm->descr.'">';

		echo '<meta name="keywords" content="'.$rm->keywords.'">';

		echo '<meta name="og:site_name" content="United Idiomas">';

		echo '<meta name="og:locale" content="pt_BR">';

		echo '<meta name="og:type" content="website">';

		echo '<meta name="og:url" content="'.$linkog.'">';

		echo '<meta name="twitter:card" content="summary">';

		echo '<meta name="twitter:title" content="'.$rm->titulo.'">';

		echo '<meta name="twitter:description" content="'.$rm->descr.'">';

	}

}

?>