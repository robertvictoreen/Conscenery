<?php
if($loggedout==0){

    if($_SERVER["REQUEST_METHOD"] == "POST") {

        if (!isset($_POST['user'])){
            die("User required");
        }
        $data = mysqli_real_escape_string($db,$_POST["user"]);

        $userinfo = "SELECT * FROM USERS WHERE USERNAME='".$data."';";
        if ($user_result = mysqli_query($db, $userinfo)) {

            $count = mysqli_num_rows($user_result);

            if ($count < 1) die("User not found");

            $user_data = mysqli_fetch_array($user_result,MYSQLI_ASSOC);

            $userid = mysqli_real_escape_string($db,$user_id);

            if ($user_data["ID"] == $user_id) die("User not found");

            $sql = "SELECT * FROM NETWORK WHERE (USER1 = '".$userid."' AND USER2 = '".$user_data["ID"]."') OR (USER2 = '".$userid."' AND USER1 = '".$user_data["ID"]."');";
            $obj = mysqli_query($db,$sql);

  //    $row = mysqli_fetch_array($result,MYSQLI_ASSOC);
     // $active = $row['active'];


            $count = mysqli_num_rows($obj);

            if ($count < 1) {

                $sql = "INSERT INTO NETWORK (USER1, USER2, STATUS) VALUES ('".$userid."', '".$user_data["ID"]."', '1');";

                if (!mysqli_query($db,$sql)) {
                    die(mysqli_error($db));
                }

            }
        }
        exit("1");
    }
}
?>