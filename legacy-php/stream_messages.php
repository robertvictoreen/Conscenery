 <?php
 
 if ($loggedout == 1){
    die("Logged out");
 }
	 
function time2str($ts)
{
    if(!ctype_digit($ts))
        $ts = strtotime($ts);

    $diff = time() - $ts;
    if($diff == 0)
        return 'now';
    elseif($diff > 0)
    {
        $day_diff = floor($diff / 86400);
        if($day_diff == 0)
        {
            if($diff < 60) return 'just now';
            if($diff < 120) return '1 minute ago';
            if($diff < 3600) return floor($diff / 60) . ' minutes ago';
            if($diff < 7200) return '1 hour ago';
            if($diff < 86400) return floor($diff / 3600) . ' hours ago';
        }
        if($day_diff == 1) return 'Yesterday';
        if($day_diff < 7) return $day_diff . ' days ago';
        if($day_diff < 31) return ceil($day_diff / 7) . ' weeks ago';
        if($day_diff < 60) return 'last month';
        return date('F Y', $ts);
    }
    else
    {
        $diff = abs($diff);
        $day_diff = floor($diff / 86400);
        if($day_diff == 0)
        {
            if($diff < 120) return 'in a minute';
            if($diff < 3600) return 'in ' . floor($diff / 60) . ' minutes';
            if($diff < 7200) return 'in an hour';
            if($diff < 86400) return 'in ' . floor($diff / 3600) . ' hours';
        }
        if($day_diff == 1) return 'Tomorrow';
        if($day_diff < 4) return date('l', $ts);
        if($day_diff < 7 + (7 - date('w'))) return 'next week';
        if(ceil($day_diff / 7) < 4) return 'in ' . ceil($day_diff / 7) . ' weeks';
        if(date('n', $ts) == date('n') + 1) return 'next month';
        return date('F Y', $ts);
    }
}

    function formatSizeUnits($bytes)
    {
        if ($bytes >= 1073741824)
        {
            $bytes = number_format($bytes / 1073741824, 2) . ' GB';
        }
        elseif ($bytes >= 1048576)
        {
            $bytes = number_format($bytes / 1048576, 2) . ' MB';
        }
        elseif ($bytes >= 1024)
        {
            $bytes = number_format($bytes / 1024, 2) . ' KB';
        }
        elseif ($bytes > 1)
        {
            $bytes = $bytes . ' bytes';
        }
        elseif ($bytes == 1)
        {
            $bytes = $bytes . ' byte';
        }
        else
        {
            $bytes = '0 bytes';
        }

        return $bytes;
}
	 
	 $userid = mysqli_real_escape_string($db,$user_id);
	 if (isset($_GET["src"])) {
		 $otheruser = mysqli_real_escape_string($db,$_GET["src"]);
		 $query = "SELECT * FROM MESSAGES WHERE (SRC_ID='".$otheruser."' AND DEST_ID='".$userid."') OR (DEST_ID='".$otheruser."' AND SRC_ID='".$userid."') AND STREAM='0' ORDER by ID;";
	 } else $query = "SELECT * FROM MESSAGES WHERE STREAM='1' ORDER by ID;";

if ($result = mysqli_query($db, $query)) {
	
	$nowdate = new DateTime();

    /* fetch associative array */
    while ($row = mysqli_fetch_assoc($result)) {
		
		
		$expirycheck = new DateTime($row["EXPIRY_TIME"]);
		
		if ($expirycheck < $nowdate) {
			//delete process
			 if ($row["FILE"] != NULL ){
				 unlink("./uploads/".$row["FILE"]);
			 }
			 
			 $sql = "DELETE FROM MESSAGES WHERE ID='".$row["ID"]."';";
			mysqli_query($db, $sql);
			continue;
		}
		
		if ($row["SRC_ID"] != $user_id) {
		
	 $sql = "SELECT * FROM NETWORK WHERE (USER1 = '".$userid."' AND USER2 = '".$row["SRC_ID"]."' AND STATUS='0') OR (USER2 = '".$userid."' AND USER1 = '".$row["SRC_ID"]."' AND STATUS='0');";
      $obj = mysqli_query($db,$sql);
	  
  //    $row = mysqli_fetch_array($result,MYSQLI_ASSOC);
     // $active = $row['active'];
      
      $count = mysqli_num_rows($obj);
	  
	  if ($count <1) continue;
		}
		?>
		<div id="msg<?php echo $row["ID"]; ?>" class="<?php 
		if ($row["SRC_ID"] == $user_id) {
			echo "self";
		} else {
			echo "recieved";
		}
		 ?>">
    
    <div class="post_options"><ul>
      <li><a class="active" href="#comment"><?php 
	
	 $userinfo = "SELECT * FROM USERS WHERE ID='".$row["SRC_ID"]."';";
	 if ($user_result = mysqli_query($db, $userinfo)) {
		 
   		$user_data = mysqli_fetch_array($user_result,MYSQLI_ASSOC);
		echo $user_data["USERNAME"]; 
	
	 }
	?></a></li>
      <li class="dropdown">
    <a href="#" class="dropbtn">Options</a>
    <div class="dropdown-content">
      <?php
	  if ($row["SRC_ID"] == $user_id) {?>
      
      <a class="message_delete" href="delete.php?id=<?php echo $row["ID"]; ?>">Delete</a>
	  <?php 
	  } else {
	  ?>
      <a class="message_contact" href="connect.php?id=<?php echo $row["SRC_ID"] ?>&status=1">Remove Contact</a>
      <a class="message_contact" href="connect.php?id=<?php echo $row["SRC_ID"] ?>&status=2">Block</a>
     <?php
	  }
	  //<a class="edit_post" href="#">Edit</a>
	 ?>
     
    </div>
  </li>
      
      </ul>
      </div>
    
    <div class="message_content"><div class="message_margin">
    <p><?php echo $row["CONTENT"]; ?></p>
    
    <?php
	if ($row["FILE"] != NULL ){
			?>
            <p>
            
            
            <?php if ($row["FILETYPE"]==1) { ?>
            <a target="_blank" href="./uploads/<?php echo $row["FILE"]; ?>">
    <img src="./uploads/<?php echo $row["FILE"]; ?>" alt="<?php echo $row["ORIGINAL"]; ?>"></img>
	
  
  <?php
			
			
		} else {
			
			if ($row["FILETYPE"]==2) {
			?>
    <video src="./uploads/<?php echo $row["FILE"]; ?>" controls>
</video>
<?php }
?>

<a target="_blank" href="./uploads/<?php echo $row["FILE"]; ?>">
  <?php
		} echo $row["ORIGINAL"]. "</a> (". formatSizeUnits($row["FILESIZE"]).")"; ?></p>
        <?php
	}
	?>
    
    
    <p><?php echo time2str($row["POST_TIME"]); ?></p>
    </div></div></div>
		
		
		<?php 
    }

    /* free result set */
    mysqli_free_result($result);
	
}
  
   ?>