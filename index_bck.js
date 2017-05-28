var chalk       = require('chalk');
var clc         = require('cli-color');
var clear       = require('cli-clear');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Preferences = require('preferences');
var Spinner     = CLI.Spinner;
//var GitHubApi   = require('github');
//var _           = require('lodash');
//var git         = require('simple-git')();
var touch       = require('touch');
var os = require("os");
var hostname = os.hostname();
//var hostname = "prhc2";
//var fs          = require('fs');
var uid, pwd;

var request = require('request');
var app = null;

var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
}



clear();

console.log("\n\n");
console.log(
  clc.yellowBright(
    figlet.textSync('M I N N I E', { font: 'bolger', horizontalLayout: 'controlled smushing' })
  )
);

console.log(
  clc.cyanBright(
    figlet.textSync('     a confront ai', { font: 'cybersmall', horizontalLayout: 'full' })
  )
);

function getCredentials(callback) {
  var questions = [
    {
      name: 'username',
      type: 'input',
      message: '   Enter E-mail Address: ',
      validate: function( value ) {
        if (value.length) {
          return true;
        } else {
          return clc.redBright('    Please enter your e-mail address');
        }
      }
    },
    {
      name: 'password',
      type: 'password',
      message: '   Enter Password: ',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return clc.redBright('    Please enter your password');
        }
      }
    }
  ];

  inquirer.prompt(questions).then(callback);
}

function getToken(callback) {
    //console.log("getToken");
  var prefs = new Preferences('com.prefacepro.minstt');

  if (prefs.user && prefs.user.token) {
      console.log("pref yes");
    return callback(null, prefs.user.token);
  }

  // Fetch token
  getCredentials(function(credentials) {
      //console.log("getCred");
      //console.log(credentials);
      //return callback(null, credentials);
      //return callback("unsuccess");
      console.log("\n");
      var status = new Spinner(' Authenticating you, please wait .. ');
      status.start();
      
      uid = credentials['username'];
      pwd = credentials['password'];
      
      //console.log(uid + "," + pwd);
      //status.stop();

      var options1 = {
        url: 'http://preface-prhc.rhcloud.com/pr/gettoken.php',
        method: 'GET',
        json: true,
        headers: headers,
        qs: {'uid': uid, 'pwd': pwd}
      }
      request(options1, function (error, response, body) {
          //console.log("req option1");
        if (!error && response.statusCode == 200) {
            //console.log("code 200");
            status.stop();
            if(body['outcome'] == true && body['token']) {
                //console.log("Success");
                prefs.user = {token : body['token']}
                return callback(null, body['token']);
            } else if(body['outcome'] == false) {
                //console.log("Unsuccess");
                return callback(body['message']);
            }
        }
      });
      //console.log("ready for return callback()");
      return callback(0);
  });
}

function x(n,token) {
    //console.log(token);
    if(n == null) {
        //console.log("n null");
        asyncMonitor(token);
    }
    else if(n != null && n != 0) {
        //console.log("n not null");
        console.log(clc.redBright('     ' + n));
        pressExit();
    }
}

console.log("\n\n");
getToken(x);

function asyncMonitor(token) {
    var options2 = {
        url: 'http://preface-prhc.rhcloud.com/pr/getstatusc.php',
        method: 'GET',
        json: true,
        headers: headers,
        qs: {'uid': token, 'pcid': hostname}
    }
    var options3 = {
        url: 'http://preface-prhc.rhcloud.com/pr/updateMinApp2.php',
        method: 'GET',
        json: true,
        headers: headers,
        qs: {'uid': token, 'ppcid': hostname, 'paname': '', 'pastatus': 'close'}
    }

    var status = new Spinner(chalk.green(' Connecting to the Control System, please wait ..'));
    status.start();
    var flag = 0;
    var requestLoop = setInterval(function(){
        //console.log("interval");
        // Start the request
        
        request(options2, function (error, response, body) {
            //console.log("in request");
            if (!error && response.statusCode == 200) {
                status.stop();
                if(body['outcome'] == false) {
                    //console.log(chalk.white('\u001b[90m' + body['message'] + '\u001b[0m'));
                    console.log(clc.redBright('     ' + body['message'] + '\n\n'));
                    clearInterval(requestLoop);
                    requestLoop = 0;
                    
                    pressExit();
                    //process.stdin.setRawMode(true);
                    //process.stdin.resume();
                    //process.stdin.on('data', process.exit.bind(process, 0));
                    //console.log(body['message']);
                } else {
                    //console.log(body);
                    if(flag == 0) {
                        console.log(clc.greenBright('     ::   Control System Started .. Applications Are Under Control !   ::'));
                        flag++;
                    }
                    // Print out the response body
                    for(var i=0; i<body.length; i++) {
                        if(body[i]['astatus'] == "open") {
                            app = body[i]['aname'];
                            appPath = body[i]['apath'];
                            appParam = body[i]['aparam'];
                            options3['qs']['paname'] = app;
                            //console.log(body[i]['astatus'] + ", " + options2['qs']['paname']);
                        } else {
                            //console.log(body[i]['astatus']);
                        }
                    }
                    //console.log(app);
                    //console.log(token + "," + hostname + "," + a, 'pastatus': 'close');
                    if(app != null) {
                        var cp = require('child_process');
                        if(appParam == "")
                            var ap = [];
                        var child = cp.spawn(appPath, ap, { detached: true, stdio: [ 'ignore', 'ignore', 'ignore' ] });
                        child.unref();

                        request(options3, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                //console.log(body);
                            }
                        });
                        app = null;
                    }
                }
            } else {
                console.log(error);
            }
        });
    }, 5000);
}

function pressExit() {
    //console.log('     Press any key to exit ..');
    var countdown = new Spinner(chalk.white(' Exiting in 5 seconds .. '));
    countdown.start();

    var number = 5;
    setInterval(function () {
        number--;
        countdown.message(chalk.white(' Exiting in ' + number + ' seconds .. '));
        if (number === 0) {
            process.stdout.write('\n');
            process.exit(0);
        }
    }, 1000);
}



// Load library
    var gui = require('nw.gui');
    
    // Reference to window and tray
    var win = gui.Window.get();
    var tray;

    // Get the minimize event
    win.on('minimize', function() {
      // Hide window
      this.hide();

      // Show tray
      tray = new gui.Tray({ icon: 'icon.png' });

      // Show window and remove tray when clicked
      tray.on('click', function() {
        win.show();
        this.remove();
        tray = null;
      });
    });


/*
getGithubCredentials(function(credentials) {
    var status = new Spinner('Authenticating you, please wait...');
    status.start();

    github.authenticate(
      _.extend(
        {
          type: 'basic',
        },
        credentials
      )
    );

    github.authorization.create({}, function(err, res) {return callback();});
  });
*/

/*
console.log("\n\n");
getCredentials(function(){
  console.log(arguments);
    uid = arguments[0]['username'];
    pwd = arguments[0]['password'];
    
    //console.log(uid + "," + pwd);
    
    var prefs = new Preferences('com.prefacepro.minstt',{
      account: {
        username: uid,
        password: pwd
      },
      test: {
        cycles: 1
      }
    });

    // Preferences can be accessed directly 
    //prefs.test.cycles++;
    console.log(prefs.account);

});


/*
var prefs = new Preferences('com.prefacepro.minstt',{
  account: {
    username: 'MrRobot',
    password: 'fsociety'
  },
  test: {
    cycles: 1
  }
});
 
// Preferences can be accessed directly 
//prefs.test.cycles++;
console.log(prefs.account);

// big chief
// hollywood
// banner3
// bolger
// cybersmall

// alligator2
// ansi shadow
// colossal
// dos rebel
// georgia11
// nv script

/*
figlet.fonts(function(err, fonts) {
    //console.dir(fonts);
    for (var index = 240; index < 250; ++index) {
        console.log(
            chalk.cyan(
                figlet.textSync(' Minnie', { font: fonts[index], horizontalLayout: 'half', verticalLayout: 'full' })
            )
        );
        console.log(fonts[index]);
    }
});
*/