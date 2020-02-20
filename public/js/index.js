import * as httptart from "./httptart.js";

const maxChecks = 25;

// Container for frontend application
let app = {};

// Config
app.config = {
  'sessionToken': false
};

// AJAX Client (for RESTful API)
app.client = {}

// Bind the logout button
app.bindLogoutButton = () => {
  if (!document.getElementById("logoutButton")) { return; }
  document.getElementById("logoutButton").addEventListener("click", e => {
    // Stop it from redirecting anywhere
    e.preventDefault();
    // Log the user out
    app.logUserOut();
  });
};

// Log the user out then redirect them
app.logUserOut = async (redirectUser) => {
  // Set redirectUser to default to true
  redirectUser = typeof (redirectUser) == 'boolean' ? redirectUser : true;

  // Get the current token id
  let tokenId = typeof (app.config.sessionToken.tokenId) == 'string' ? app.config.sessionToken.tokenId : false;

  // Send the current token to the tokens endpoint to delete it
  let queryStringObject = {
    'id': tokenId
  };
  await httptart.del('api/v1/tokens', queryStringObject);
  // Set the app.config token as false
  app.setSessionToken(false);
  // Send the user to the logged out page
  if (redirectUser) {
    window.location = '/session/deleted';
  }
};

// Bind the forms
app.bindForms = function () {
  if (!document.querySelector("form")) { return; }
  let allForms = document.querySelectorAll("form");
  for (let i = 0; i < allForms.length; i++) {
    allForms[i].addEventListener("submit", async function (e) {

      // Stop it from submitting
      e.preventDefault();
      let formId = this.id;
      let path = this.action;
      let method = this.method.toUpperCase();

      // Hide the error message (if it's currently shown due to a previous error)
      document.querySelector("#" + formId + " .formError").style.display = 'none';

      // Hide the success message (if it's currently shown due to a previous error)
      if (document.querySelector("#" + formId + " .formSuccess")) {
        document.querySelector("#" + formId + " .formSuccess").style.display = 'none';
      }


      // Turn the inputs into a payload
      let payload = {};
      let elements = this.elements;
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].type !== 'submit') {
          // Determine class of element and set value accordingly
          let classOfElement = typeof (elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
          let valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].checked : classOfElement.indexOf('intval') == -1 ? elements[i].value : parseInt(elements[i].value);
          let elementIsChecked = elements[i].checked;
          // Override the method of the form if the input's name is _method
          let nameOfElement = elements[i].name;
          if (nameOfElement == '_method') {
            method = valueOfElement;
          } else {
            // Create an payload field named "method" if the elements name is actually httpmethod
            if (nameOfElement == 'httpmethod') {
              nameOfElement = 'method';
            }
            // Create an payload field named "id" if the elements name is actually uid
            if (nameOfElement == 'uid') {
              nameOfElement = 'id';
            }
            // If the element has the class "multiselect" add its value(s) as array elements
            if (classOfElement.indexOf('multiselect') > -1) {
              if (elementIsChecked) {
                payload[nameOfElement] = typeof (payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                payload[nameOfElement].push(valueOfElement);
              }
            } else {
              payload[nameOfElement] = valueOfElement;
            }

          }
        }
      }


      // If the method is DELETE, the payload should be a queryStringObject instead
      let queryStringObject = method == 'DELETE' ? payload : {};
      let headers = {
        token: app.config.sessionToken.tokenId,
      };

      // Call the API
      let { statusCode, data } = await httptart.createRequest(method, path, queryStringObject, payload, headers);
      // Display an error on the form if needed
      if (statusCode === 200) {
        // If successful, send to form response processor
        return app.formResponseProcessor(formId, payload, data);
      }
      if (statusCode == 403) {
        // log the user out
        return app.logUserOut();
      }

      // Try to get the error from the api, or set a default error message
      let error = typeof (data.Error) == 'string' ? data.Error : 'An error has occured, please try again';

      // Set the formError field with the error text
      document.querySelector("#" + formId + " .formError").innerHTML = error;

      // Show (unhide) the form error field on the form
      document.querySelector("#" + formId + " .formError").style.display = 'block';
    });
  }
};

// Form response processor
app.formResponseProcessor = async (formId, requestPayload, responsePayload) => {
  let functionToCall = false;
  // If account creation was successful, try to immediately log the user in
  if (formId == 'accountCreate') {
    // Take the phone and password, and use it to log the user in
    let newPayload = {
      'phone': requestPayload.phone,
      'password': requestPayload.password
    };

    let { statusCode: newStatusCode, data } = await httptart.post('api/v1/tokens', undefined, newPayload);
    // Display an error on the form if needed
    if (newStatusCode !== 200) {

      // Set the formError field with the error text
      document.querySelector("#" + formId + " .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

      // Show (unhide) the form error field on the form
      document.querySelector("#" + formId + " .formError").style.display = 'block';

    } else {
      // If successful, set the token and redirect the user
      app.setSessionToken(data);
      window.location = '/checks/all';
    }
  }
  // If login was successful, set the token in localstorage and redirect the user
  if (formId == 'sessionCreate') {
    app.setSessionToken(responsePayload);
    window.location = '/checks/all';
  }

  // If forms saved successfully and they have success messages, show them
  let formsWithSuccessMessages = ['accountEdit1', 'accountEdit2', 'checksEdit1'];
  if (formsWithSuccessMessages.indexOf(formId) > -1) {
    document.querySelector("#" + formId + " .formSuccess").style.display = 'block';
  }

  // If the user just deleted their account, redirect them to the account-delete page
  if (formId == 'accountEdit3') {
    app.logUserOut(false);
    window.location = '/account/deleted';
  }

  // If the user just created a new check successfully, redirect back to the dashboard
  if (formId == 'checksCreate') {
    window.location = '/checks/all';
  }

  // If the user just deleted a check, redirect them to the dashboard
  if (formId == 'checksEdit2') {
    window.location = '/checks/all';
  }

};

// Get the session token from localstorage and set it in the app.config object
app.loadSessionToken = () => {
  let tokenString = localStorage.getItem("token");
  if (typeof (tokenString) !== "string") { return; }
  try {
    let token = JSON.parse(tokenString);
    app.config.sessionToken = token;
    const loggedInClass = typeof (token) === "object";
    app.setLoggedInClass(loggedInClass);
  } catch (e) {
    app.config.sessionToken = false;
    app.setLoggedInClass(false);
  }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = (add) => {
  let target = document.querySelector("body");
  if (add) {
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = (token) => {
  app.config.sessionToken = token;
  let tokenString = JSON.stringify(token);
  localStorage.setItem('token', tokenString);
  token = typeof (token) === "object" ? token : false;
  app.setLoggedInClass(token);
};

// Renew the token
app.renewToken = async (callback) => {
  let currentToken = typeof (app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
  if (!currentToken) {
    app.setSessionToken(false);
    callback(true);
    return;
  }
  // Update the token with a new expiration
  let payload = {
    'id': currentToken.tokenId,
    'extend': true,
  };
  let { statusCode } = await httptart.put('api/v1/tokens', undefined, payload);
  // Display an error on the form if needed
  if (statusCode !== 200) {
    app.setSessionToken(false);
    callback(true);
    return;
  }
  // Get the new token details
  let queryStringObject = { 'id': currentToken.tokenId };
  let { statusCode: newStatusCode, data: newData } = await httptart.get('api/v1/tokens', queryStringObject);

  if (newStatusCode == 200) {
    app.setSessionToken(newData);
    callback(false);
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// Load data on the page
app.loadDataOnPage = () => {
  // Get the current page from the body class
  let bodyClasses = document.querySelector("body").classList;
  let primaryClass = typeof (bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

  // Logic for account settings page
  if (primaryClass == 'accountEdit') {
    app.loadAccountEditPage();
  }

  // Logic for dashboard page
  if (primaryClass == 'checksList') {
    app.loadChecksListPage();
  }

  // Logic for check details page
  if (primaryClass == 'checksEdit') {
    app.loadChecksEditPage();
  }
};

// Load the account edit page specifically
app.loadAccountEditPage = async () => {
  // Get the phone number from the current token, or log the user out if none is there
  let phone = typeof (app.config.sessionToken.phone) == 'string' ? app.config.sessionToken.phone : false;
  if (!phone) { return app.logUserOut(); }
  // Fetch the user data
  let queryStringObject = {
    'phone': phone
  };
  let headers = {
    token: app.config.sessionToken.tokenId,
  };
  let { statusCode, data } = await httptart.get('api/v1/users', queryStringObject, headers);
  if (statusCode !== 200) {
    // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
    return app.logUserOut();
  }
  // Put the data into the forms as values where needed
  document.querySelector("#accountEdit1 .firstNameInput").value = data.firstName;
  document.querySelector("#accountEdit1 .lastNameInput").value = data.lastName;
  document.querySelector("#accountEdit1 .displayPhoneInput").value = data.phone;

  // Put the hidden phone field into both forms
  let hiddenPhoneInputs = document.querySelectorAll("input.hiddenPhoneNumberInput");
  for (let i = 0; i < hiddenPhoneInputs.length; i++) {
    hiddenPhoneInputs[i].value = data.phone;
  }
};

// Load the dashboard page specifically
app.loadChecksListPage = async () => {
  // Get the phone number from the current token, or log the user out if none is there
  let phone = typeof (app.config.sessionToken.phone) == 'string' ? app.config.sessionToken.phone : false;
  if (!phone) { return app.logUserOut(); }
  // Fetch the user data
  let queryStringObject = {
    'phone': phone
  };
  let headers = {
    token: app.config.sessionToken.tokenId,
  };
  let { statusCode, data } = await httptart.get('api/v1/users', queryStringObject, headers);
  if (statusCode !== 200) {
    // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
    return app.logUserOut();
  }
  // Determine how many checks the user has
  let allChecks = typeof (data.checks) == 'object' && data.checks instanceof Array && data.checks.length > 0 ? data.checks : [];
  if (allChecks.length === 0) {
    // Show 'you have no checks' message
    document.getElementById("noChecksMessage").style.display = 'table-row';
    // Show the createCheck CTA
    document.getElementById("createCheckCTA").style.display = 'block';
    return;
  }
  // Show each created check as a new row in the table
  allChecks.forEach(async (checkId) => {
    // Get the data for the check
    let newQueryStringObject = {
      'id': checkId
    };
    let headers = {
      token: app.config.sessionToken.tokenId,
    };
    let { statusCode, data } = await httptart.get('api/v1/checks', newQueryStringObject, headers);
    if (statusCode == 200) {
      let checkData = data;
      // Make the check data into a table row
      let table = document.getElementById("checksListTable");
      let tr = table.insertRow(-1);
      tr.classList.add('checkRow');
      let td0 = tr.insertCell(0);
      let td1 = tr.insertCell(1);
      let td2 = tr.insertCell(2);
      let td3 = tr.insertCell(3);
      let td4 = tr.insertCell(4);
      td0.innerHTML = data.method.toUpperCase();
      td1.innerHTML = data.protocol + '://';
      td2.innerHTML = data.url;
      let state = typeof (data.state) == 'string' ? data.state : 'unknown';
      td3.innerHTML = state;
      td4.innerHTML = '<a href="/checks/edit?id=' + data.id + '">View / Edit / Delete</a>';
    } else {
      console.log("Error trying to load check ID: ", checkId);
    }
  });

  if (allChecks.length < maxChecks) {
    // Show the createCheck CTA
    document.getElementById("createCheckCTA").style.display = 'block';
  }
};


// Load the checks edit page specifically
app.loadChecksEditPage = async () => {
  // Get the check id from the query string, if none is found then redirect back to dashboard
  let id = typeof (window.location.href.split('=')[1]) == 'string' && window.location.href.split('=')[1].length > 0 ? window.location.href.split('=')[1] : false;
  if (!id) {
    window.location = '/checks/all';
    return;
  }
  // Fetch the check data
  let queryStringObject = {
    'id': id
  };
  let headers = {
    token: app.config.sessionToken.tokenId,
  };
  let { statusCode, data } = await httptart.get('api/v1/checks', queryStringObject, headers);
  if (statusCode !== 200) {
    // If the request comes back as something other than 200, redirect back to dashboard
    window.location = '/checks/all';
    return;
  }

  // Put the hidden id field into both forms
  let hiddenIdInputs = document.querySelectorAll("input.hiddenIdInput");
  for (let i = 0; i < hiddenIdInputs.length; i++) {
    hiddenIdInputs[i].value = data.id;
  }

  // Put the data into the top form as values where needed
  document.querySelector("#checksEdit1 .displayIdInput").value = data.id;
  document.querySelector("#checksEdit1 .displayStateInput").value = data.state;
  document.querySelector("#checksEdit1 .protocolInput").value = data.protocol;
  document.querySelector("#checksEdit1 .urlInput").value = data.url;
  document.querySelector("#checksEdit1 .methodInput").value = data.method;
  document.querySelector("#checksEdit1 .timeoutInput").value = data.timeoutSeconds;
  let successCodeCheckboxes = document.querySelectorAll("#checksEdit1 input.successCodesInput");
  for (let i = 0; i < successCodeCheckboxes.length; i++) {
    if (data.successCodes.indexOf(parseInt(successCodeCheckboxes[i].value)) > -1) {
      successCodeCheckboxes[i].checked = true;
    }
  }
};

// Loop to renew token often
app.tokenRenewalLoop = () => {
  setInterval(() => {
    app.renewToken((err) => {
      if (!err) { console.log("Token renewed successfully @ " + Date.now()); }
    });
  }, 1000 * 60);
};

// Init (bootstrapping)
app.init = () => {

  httptart.get("ping/2?name=surname").then(d => console.log(d))

  // Bind all form submissions
  app.bindForms();

  // Bind logout logout button
  app.bindLogoutButton();

  // Get the token from localstorage
  app.loadSessionToken();

  // Renew token
  app.tokenRenewalLoop();

  // Load data on page
  app.loadDataOnPage();

};

// Call the init processes after the window loads
window.onload = () => {
  app.init();
};
