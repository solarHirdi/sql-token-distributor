const fs = require('fs');
const os = require('os');

const successStream = fs.createWriteStream('log_success.txt', {flags: 'a'});
const errorStream = fs.createWriteStream('log_error.txt', {flags: 'a'});

module.exports = function () {
  let result = '';
  this.write = string => {
    result = result + string + os.EOL;
  };
  this.success = text => {
    this.write(text);
    this.write('--------------------------------------------------------------------------------');
    console.log(result);
    successStream.write(result);
  };
  this.error = error => {
    this.write(error);
    this.write('--------------------------------------------------------------------------------');
    console.log(result);
    errorStream.write(result);
  };
};
