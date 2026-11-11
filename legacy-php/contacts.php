 <?php
 
 if ($loggedout==0){
  $userid = mysqli_real_escape_string($db,$user_id);
  
  $query = "SELECT * FROM NETWORK WHERE STATUS='0' AND (USER1='".$userid."' OR USER2='".$userid."');";

  if ($result = mysqli_query($db, $query)) {

    /* fetch associative array */
    while ($row = mysqli_fetch_assoc($result)) {
        
        if ($row["USER1"] == $user_id)
            $otheruser = $row["USER2"];
        else $otheruser = $row["USER1"];
        
        ?>
        <li><a user_id="<?php echo $otheruser; ?>" href="stream_messages.php?src=<?php echo $otheruser ?>" target="#direct_messages">
            <?php
            
            $userinfo = "SELECT * FROM USERS WHERE ID='".$otheruser."';";
            if ($user_result = mysqli_query($db, $userinfo)) {
               
                $user_data = mysqli_fetch_array($user_result,MYSQLI_ASSOC);
                echo $user_data["USERNAME"];
                
            }
            ?> </a></li> <?php
        }
    }
}

?>