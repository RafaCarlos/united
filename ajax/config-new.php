<?php

//DB details
$dbHost = 'localhost';
$dbUsername = 'unite987_usr5470';
$dbPassword = '11@Un!ted';
$dbName = 'unite987_unitedsite';

//Create connection and select DB
$db = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);
$db->set_charset("utf8");

if($db->connect_error){
    die("Unable to connect database: " . $db->connect_error);
}
