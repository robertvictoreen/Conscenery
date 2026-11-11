<?php
if ($loggedout == 0) {

    if (isset($_GET["id"])) {
        $contactid = mysqli_real_escape_string($db,$_GET["id"]);
        $userid = mysqli_real_escape_string($db,$user_id);

        if ($obj = mysqli_query($db,"SELECT * FROM NETWORK WHERE (USER1='".$contactid."' AND USER2='".$userid."') OR (USER1='".$userid."' AND USER2='".$contactid."');")) {
            $data = mysqli_fetch_array($obj,MYSQLI_ASSOC);

        } else {
            die(mysqli_error($db));
        }

        if (isset($_GET["status"])) {
            if ($_GET["status"] == "1"){
                //unfriend
                $query = "DELETE FROM NETWORK WHERE ID='".$data["ID"]."';";
            } else if ($_GET["status"] == "2"){
                //block
                if ($data["USER1"] == $user_id) {
                    $query = "UPDATE NETWORK SET STATUS='2', DIRECTION='0' WHERE ID='".$data["ID"]."';";
                } else if ($data["USER2"] ==$user_id) {
                    $query = "UPDATE NETWORK SET STATUS='2', DIRECTION='1' WHERE ID='".$data["ID"]."';";
                } else die("User Error");
            }
        } else {
            $query = "UPDATE NETWORK SET STATUS='0' WHERE ID='".$data["ID"]."';";
        }

        if ($result = mysqli_query($db, $query)) {

            exit("1");

        } else {
            die(mysqli_error($db));
        }

    }
}
?>