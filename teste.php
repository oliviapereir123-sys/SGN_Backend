<?php
$host = getenv('DB_HOST') ?: 'não encontrado';
$name = getenv('DB_NAME') ?: 'não encontrado';
$user = getenv('DB_USER') ?: 'não encontrado';
$pass = getenv('DB_PASS') ?: 'não encontrado';

echo "DB_HOST: $host<br>";
echo "DB_NAME: $name<br>";
echo "DB_USER: $user<br>";
echo "DB_PASS: " . (empty($pass) ? 'vazio' : 'preenchido') . "<br>";

$conn = new mysqli($host, $user, $pass, $name);
if ($conn->connect_error) {
    echo "Erro de ligação: " . $conn->connect_error;
} else {
    echo "Ligação à base de dados OK!";
}
?>
