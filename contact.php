<?php
$to = 'riddhicreativestudio@gmail.com';
$subject = 'New Project Enquiry from Riddhi Creative Studio Website';

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$company = trim($_POST['company'] ?? '');
$service = trim($_POST['service'] ?? '');
$quantity = trim($_POST['quantity'] ?? '');
$need = trim($_POST['need'] ?? '');

if (empty($name) || empty($email) || empty($phone) || empty($need)) {
    header('Location: contact.html?status=error');
    exit;
}

$headers = [
    'From: ' . $name . ' <' . $email . '>',
    'Reply-To: ' . $email,
    'Content-Type: text/html; charset=UTF-8'
];

$body = "
<html>
<head>
  <title>Project Enquiry</title>
</head>
<body>
  <h2>New Project Enquiry</h2>
  <p><strong>Name:</strong> {$name}</p>
  <p><strong>Email:</strong> {$email}</p>
  <p><strong>Phone:</strong> {$phone}</p>
  <p><strong>Company / Business:</strong> {$company}</p>
  <p><strong>Service:</strong> {$service}</p>
  <p><strong>Quantity:</strong> {$quantity}</p>
  <p><strong>Project Details:</strong></p>
  <p>{$need}</p>
</body>
</html>
";

$upload_ok = true;
$uploaded_file = null;

if (!empty($_FILES['upload']['name'])) {
    $upload_dir = __DIR__ . '/uploads/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $file_name = time() . '_' . basename($_FILES['upload']['name']);
    $target_file = $upload_dir . $file_name;

    if (move_uploaded_file($_FILES['upload']['tmp_name'], $target_file)) {
        $uploaded_file = $target_file;
    } else {
        $upload_ok = false;
    }
}

if ($upload_ok && mail($to, $subject, $body, implode("\r\n", $headers))) {
    if ($uploaded_file) {
        $boundary = md5(time());
        $separator = "--" . $boundary;
        $eol = "\r\n";

        $headers = [
            'From: ' . $name . ' <' . $email . '>',
            'Reply-To: ' . $email,
            'MIME-Version: 1.0',
            'Content-Type: multipart/mixed; boundary="' . $boundary . '"'
        ];

        $message = '';
        $message .= $separator . $eol;
        $message .= 'Content-Type: text/html; charset=UTF-8' . $eol;
        $message .= 'Content-Transfer-Encoding: 7bit' . $eol . $eol;
        $message .= $body . $eol;
        $message .= $separator . $eol;
        $message .= 'Content-Type: application/octet-stream; name="' . basename($uploaded_file) . '"' . $eol;
        $message .= 'Content-Transfer-Encoding: base64' . $eol;
        $message .= 'Content-Disposition: attachment; filename="' . basename($uploaded_file) . '"' . $eol . $eol;
        $message .= chunk_split(base64_encode(file_get_contents($uploaded_file))) . $eol;
        $message .= $separator . '--';

        mail($to, $subject, $message, implode("\r\n", $headers));
    }

    if (file_exists($uploaded_file)) {
        unlink($uploaded_file);
    }

    header('Location: contact.html?status=success');
    exit;
}

header('Location: contact.html?status=error');
exit;
