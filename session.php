<?php
if (!isset($db)){
   include('config.php');
}
   session_start();
   $loggedout = 0;
   if(!isset($_SESSION['login_user'])){
      $loggedout=1;
   } else {
   $user_check = mysqli_real_escape_string($db,$_SESSION['login_user']);

   $ses_sql = mysqli_query($db,"SELECT * FROM USERS WHERE USERNAME = '$user_check';");

   if (!$ses_sql) {
    die(mysqli_error($db));
} else if (mysqli_num_rows($ses_sql) != 1) $loggedout=1;



   $row = mysqli_fetch_array($ses_sql,MYSQLI_ASSOC);

   $login_session = $row['USERNAME'];

   $user_status = $row["STATUS"];

   $user_id = $row['ID'];
   $timestamp = date('Y-m-d G:i:s');

   mysqli_query($db,"UPDATE USERS SET ACTIVE='$timestamp' WHERE ID = '$user_id';");
   }



?>