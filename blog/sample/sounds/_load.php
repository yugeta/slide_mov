<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With");

$filename = './'.$_REQUEST["file"];

if(file_exists($filename)) {
    header('Content-Type: audio/mpeg');
    header('Content-Disposition: filename="test.mp3"');
    header('Content-length: '.filesize($filename));
    header('Cache-Control: no-cache');
    header("Content-Transfer-Encoding: chunked"); 

    readfile($filename);
} else {
    header("HTTP/1.0 404 Not Found");
}