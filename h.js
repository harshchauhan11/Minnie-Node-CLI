var uid = "harsh.h.chauhan@gmail.com";
var pwd = "henk";

var request = require('request');
var app = null;

var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
}
var options2 = {
    url: 'http://localhost:8080/login/gettoken.php',
    method: 'GET',
    json: true,
    headers: headers,
    qs: {'uid': uid, 'pwd': pwd}
}
request(options2, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        if(body['outcome'] == true && body['token'])
            console.log("Success");
        else if(body['outcome'] == false)
            console.log("Unsuccess");
    }
});