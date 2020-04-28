# Uptime Checker

This application lets users create accounts, register web resources whose availability they would like to monitor, and specify details about the requests they want to make to these resources.

The application will periodically make an HTTP request to these resources, and notify the owners of the checks whenever there is a change in state with the specified resources, i.e., if the state changes from “up/accessible” to “down/inaccessible”

As this project was made for demonstration purposes, I built every part of the application from scratch, using only the default Node.js modules, and no package.json nor npm.

The application consists of 3 main parts: a REST API, a user-facing web application, and a command-line interface for the application administrator to monitor the application.

To bring this project to fruition, I had to build the following:
- An HTTP/HTTPS server with integrated routing functions and the ability to add plugins. It is a minimal express.js clone.
- An Axios clone to help make HTTP requests within the application
- A JSON, file-based data storage utility.
- A Twilio SMS API client to notify the application’s users
- A REPL library for the CLI(used as admin panel) of the application
- A templating engine for rendering the application’s HTML
- A rudimentary unit testing toolkit for testing the application

Through this project, I sought to demonstrate my knowledge of the Node.js API, along with my problem-solving skills with low-level Node.js.

