<?php
    include_once('config-new.php');

    $id = $_GET['id'];

    // $query = mysql_query("SELECT * FROM tbl_unidades WHERE id='{$id}'") or die(mysql_error());

    // $data = mysql_fetch_row($query);

    $query = $db->query("SELECT * FROM tbl_unidades WHERE id='{$id}'");
    $data = $query->fetch_row();
?>
    <p>
        <a href="unidades/<?php echo $data[19]; ?>">
            <?php echo $data[3]; ?>, <?php echo $data[4]; ?> - <?php echo $data[6]; ?> <br><?php echo $data[7]; ?> - <?php echo $data[8]; ?> <br>Tel: <?php echo $data[10]; ?>
        </a>
    </p>