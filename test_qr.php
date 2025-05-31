<?php
require __DIR__.'/vendor/autoload.php';

use SimpleSoftwareIO\QrCode\Facades\QrCode;

$qrImage = QrCode::format('png')->size(300)->generate('Test QR Code');
file_put_contents('test_qr.png', $qrImage);

echo "QR Code generated successfully!\n"; 