<?php

include_once "config-new.php";

$order = "unidade";
// $query = mysql_query("SELECT * FROM tbl_unidades WHERE ativo='0' ORDER BY ".$order."") or die(mysql_error());
$query = $db->query("SELECT * FROM tbl_unidades WHERE ativo='0' ORDER BY ".$order."");

$dados = array();

// while ($array = mysql_fetch_assoc($query)) {
while ($array = $query->fetch_assoc()) {
	$dados['united'][] = array(
		'estado' => $array['estado'], 'cidades' => array(
			'cidade' => $array['cidade'], 'unidades' => array(
				'unidade' => $array['unidade'], 'infos' => array(
					'id' => $array['id'],
					'nome' => $array['nome'],
					'rua' => $array['rua'],
					'numero' => $array['numero'],
					'complemento' => $array['complemento'],
					'bairro' => $array['bairro'],
					'cep' => $array['cep'],
					'telefone' => $array['telefone'],
					'telefone_link' => $array['telefone_link'],
					'email_adm' => $array['email_adm'],
					'email_ped' => $array['email_ped'],
					'slug' => $array['slug']
				)
			)
		)
	);
}

/*echo "<pre>";
print_r($dados);
exit;*/

header( 'Content-Type: application/json' );
echo(json_encode($dados));

?>