<?php
/**
 * Test QR Code Generation
 * File untuk testing QR code generation
 */

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use SimpleSoftwareIO\QrCode\Facades\QrCode;

// Test QR code generation
$participantId = 1;
$eventId = 1;
$qrData = "participant-{$participantId}-{$eventId}";

echo "QR Data: " . $qrData . "\n";

// Generate QR code
$generator = QrCode::format('png');
$generator->size(300);
$generator->backgroundColor(255,255,255);
$generator->color(0,0,0);

$qrImage = $generator->generate($qrData);

// Save to file
$filename = "test_qr_{$participantId}_{$eventId}.png";
file_put_contents($filename, $qrImage);

echo "QR Code saved as: " . $filename . "\n";
echo "You can scan this QR code to test the scanner functionality.\n";
echo "QR Code content: " . $qrData . "\n";
?> 