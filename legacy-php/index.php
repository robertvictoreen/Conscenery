<?php
include "session.php";
/**
 * This is an example of a front controller for a flat file PHP site. Using a
 * Static list provides security against URL injection by default. See README.md
 * for more examples.
 */
# [START gae_simple_front_controller]
switch (@parse_url($_SERVER['REQUEST_URI'])['path']) {
    case '/':
        require 'main.php';
        break;
    case '/stream_messages.php':
        require 'stream_messages.php';
        break;
    case '/contacts.php':
        require 'contacts.php';
        break;
    case '/pending_contacts.php':
        require 'pending_contacts.php';
        break;
    case '/post.php':
        require 'post.php';
        break;
    case '/logout.php':
        require 'logout.php';
        break;
    case '/login.php':
        require 'login.php';
        break;
    case '/register.php':
        require 'register.php';
        break;
    case '/contact.php':
        require 'contact.php';
        break;
    case '/connect.php':
        require 'connect.php';
        break;
    case '/delete.php':
        require 'delete.php';
        break;
    default:
        http_response_code(404);
        exit('Not Found');
}
# [END gae_simple_front_controller]
