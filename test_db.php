<?php
// test_db.php - Testar conexão com banco de dados MySQL
// COLOCAR NA RAIZ DO HOSTGATOR TEMPORARIAMENTE PARA TESTES

// CONFIGURAÇÕES - AJUSTAR COM SEUS DADOS
$host = 'localhost';
$user = 'seu_usuario_mysql';  // clinica_user que você criou
$password = 'sua_senha_mysql'; // senha que você definiu
$database = 'clinica_5m_prod';

// Conectar ao MySQL
$conn = new mysqli($host, $user, $password, $database);

// Verificar conexão
if ($conn->connect_error) {
    die("Erro de conexão: " . $conn->connect_error);
}

echo "✅ Banco de dados conectado com sucesso!<br>";
echo "Host: " . $host . "<br>";
echo "Database: " . $database . "<br>";

// Testar se tabelas existem
$result = $conn->query("SHOW TABLES");
echo "<br>Tabelas no banco:<br>";
if ($result->num_rows > 0) {
    while($row = $result->fetch_row()) {
        echo "- " . $row[0] . "<br>";
    }
} else {
    echo "❌ Nenhuma tabela encontrada. Executar schema_mysql.sql no phpMyAdmin";
}

$conn->close();
?>
