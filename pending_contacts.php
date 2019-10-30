<?php
if ($loggedout == 1){
    die("Logged out");
}
$userid = mysqli_real_escape_string($db,$user_id);
$query = "SELECT * FROM NETWORK WHERE STATUS<>'0' AND (USER1='".$userid."' OR USER2='".$userid."');";

if ($result = mysqli_query($db, $query)) {

    $count = 0;
    /* fetch associative array */
    while ($row = mysqli_fetch_assoc($result)) {
        $count++;
        if ($row["USER1"] == $user_id)
            $otheruser = $row["USER2"];
        else $otheruser = $row["USER1"];

        ?>
        <div class="user_row"><p>
        <?php

        $userinfo = "SELECT * FROM USERS WHERE ID='".$otheruser."';";
        if ($user_result = mysqli_query($db, $userinfo)) {

            $user_data = mysqli_fetch_array($user_result,MYSQLI_ASSOC);
            echo $user_data["USERNAME"]; 

            if ($row["STATUS"] == '1') {
                //purgatory
                if ($row["USER1"]!=$userid){
                    ?>
                    <a class="contact_request" href="connect.php?id=<?php echo $user_data["ID"] ?>">Accept request</a>
                    <?php
                } else {
                    echo " (Requested)";
                }
                ?>
                <a class="contact_request" href="connect.php?id=<?php echo $user_data["ID"] ?>&status=1"> Cancel</a>
                <?php
            } else if ($row["STATUS"] == '2') {
                //blocked, check direction
                if (($row["USER1"]==$userid && $row["DIRECTION"]=="0") || ($row["USER2"]==$userid && $row["DIRECTION"]=="1")){
                    ?>
                    <a class="contact_request" href="connect.php?id=<?php echo $user_data["ID"] ?>&status=1">Unblock</a>
                    <?php

                }
            }

        }

        ?> </div></p> <?php
    }
    if ($count ==0) {
        ?>
        <div class="user_row"><p>No pending contacts</p></div>
        <?php
    }
}
?>